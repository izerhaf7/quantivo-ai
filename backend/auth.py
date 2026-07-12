"""Google OAuth helpers and session-cookie auth."""
from __future__ import annotations

import base64
import hashlib
import json
import os
import secrets
from datetime import timedelta
from typing import Any
from urllib.parse import urlencode

import httpx
from fastapi import HTTPException, Request, Response
from fastapi.responses import RedirectResponse

from user_store import UserStore

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
SESSION_TTL = timedelta(days=30)
STATE_TTL = timedelta(minutes=10)


def env(name: str, default: str | None = None) -> str:
    value = os.environ.get(name, default)
    if value is None or value == "":
        raise RuntimeError(f"missing required env var: {name}")
    return value


def cookie_name() -> str:
    return os.environ.get("SESSION_COOKIE_NAME") or "boa_session"


def cookie_secure() -> bool:
    return (os.environ.get("SESSION_COOKIE_SECURE") or "false").lower() in {"1", "true", "yes", "on"}


def token_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def current_user_from_request(request: Request, store: UserStore) -> dict[str, Any] | None:
    token = request.cookies.get(cookie_name())
    if not token:
        return None
    return store.get_user_by_session(token_hash(token))


def require_current_user(request: Request, store: UserStore) -> dict[str, Any]:
    user = current_user_from_request(request, store)
    if user is None:
        raise HTTPException(401, "not authenticated")
    return user


def user_response(user: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user.get("name"),
        "picture": user.get("picture"),
    }


def google_start(store: UserStore) -> RedirectResponse:
    state = secrets.token_urlsafe(32)
    store.create_oauth_state(state, STATE_TTL)
    params = {
        "client_id": env("GOOGLE_OAUTH_CLIENT_ID"),
        "redirect_uri": env("GOOGLE_OAUTH_REDIRECT_URI"),
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "online",
        "prompt": "select_account",
    }
    return RedirectResponse(f"{GOOGLE_AUTH_URL}?{urlencode(params)}", status_code=302)


async def google_callback(code: str | None, state: str | None, store: UserStore) -> RedirectResponse:
    if not code or not state or not store.consume_oauth_state(state):
        raise HTTPException(400, "invalid oauth state")

    async with httpx.AsyncClient(timeout=10) as client:
        token_resp = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": env("GOOGLE_OAUTH_CLIENT_ID"),
                "client_secret": env("GOOGLE_OAUTH_CLIENT_SECRET"),
                "redirect_uri": env("GOOGLE_OAUTH_REDIRECT_URI"),
                "grant_type": "authorization_code",
            },
        )
    if token_resp.status_code >= 400:
        raise HTTPException(400, "oauth token exchange failed")
    id_token = token_resp.json().get("id_token")
    if not id_token:
        raise HTTPException(400, "missing id token")

    claims = validate_google_id_token(id_token, env("GOOGLE_OAUTH_CLIENT_ID"))
    email = claims.get("email")
    google_sub = claims.get("sub")
    if not email or not google_sub:
        raise HTTPException(400, "missing google profile")
    if claims.get("email_verified") is not True:
        raise HTTPException(403, "google email not verified")
    if not domain_allowed(email):
        raise HTTPException(403, "email domain not allowed")

    user = store.upsert_google_user(
        google_sub=google_sub,
        email=email,
        name=claims.get("name"),
        picture=claims.get("picture"),
    )
    session_token = secrets.token_urlsafe(48)
    store.create_session(token_hash=token_hash(session_token), user_id=user["id"], ttl=SESSION_TTL)

    response = RedirectResponse("/", status_code=302)
    response.set_cookie(
        cookie_name(),
        session_token,
        max_age=int(SESSION_TTL.total_seconds()),
        httponly=True,
        secure=cookie_secure(),
        samesite="lax",
        path="/",
    )
    return response


def logout(request: Request, response: Response, store: UserStore) -> dict[str, bool]:
    token = request.cookies.get(cookie_name())
    if token:
        store.delete_session(token_hash(token))
    response.delete_cookie(cookie_name(), path="/", samesite="lax", secure=cookie_secure(), httponly=True)
    return {"ok": True}


def domain_allowed(email: str) -> bool:
    raw = os.environ.get("GOOGLE_OAUTH_ALLOWED_DOMAINS", "").strip()
    if not raw:
        return True
    domain = email.rsplit("@", 1)[-1].lower()
    allowed = {part.strip().lower() for part in raw.split(",") if part.strip()}
    return domain in allowed


def validate_google_id_token(id_token: str, audience: str) -> dict[str, Any]:
    parts = id_token.split(".")
    if len(parts) != 3:
        raise HTTPException(400, "invalid id token")
    try:
        header = json.loads(_b64url_decode(parts[0]))
        claims = json.loads(_b64url_decode(parts[1]))
    except (ValueError, json.JSONDecodeError) as exc:
        raise HTTPException(400, "invalid id token") from exc

    alg = header.get("alg")
    if alg != "RS256":
        raise HTTPException(400, "unsupported id token alg")
    verify_google_rs256 = os.environ.get("AUTH_VERIFY_GOOGLE_RS256", "true").lower() not in {"0", "false", "no"}
    if verify_google_rs256:
        import jwt

        jwks_client = jwt.PyJWKClient("https://www.googleapis.com/oauth2/v3/certs")
        key = jwks_client.get_signing_key_from_jwt(id_token).key
        try:
            return jwt.decode(
                id_token,
                key,
                algorithms=["RS256"],
                audience=audience,
                issuer=["https://accounts.google.com", "accounts.google.com"],
            )
        except jwt.PyJWTError as exc:
            raise HTTPException(400, "invalid id token") from exc

    if claims.get("aud") != audience:
        raise HTTPException(400, "invalid id token audience")
    if claims.get("iss") not in {"https://accounts.google.com", "accounts.google.com"}:
        raise HTTPException(400, "invalid id token issuer")
    return claims

def _b64url_decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def _test_rs256_claim_validation() -> None:
    os.environ["AUTH_VERIFY_GOOGLE_RS256"] = "false"
    header = {"alg": "RS256", "typ": "JWT"}
    claims = {"iss": "https://accounts.google.com", "aud": "client-id", "sub": "sub", "email": "u@example.com", "email_verified": True}
    token = f"{_b64url(json.dumps(header, separators=(',', ':')).encode())}.{_b64url(json.dumps(claims, separators=(',', ':')).encode())}.sig"
    assert validate_google_id_token(token, "client-id")["sub"] == "sub"


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("ascii").rstrip("=")


if __name__ == "__main__":
    _test_rs256_claim_validation()
