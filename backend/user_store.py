"""SQLite auth user/session/state store."""
from __future__ import annotations

import os
import sqlite3
import threading
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any


DEFAULT_DB_PATH = Path(__file__).resolve().parent.parent / "data" / "auth.sqlite3"


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat()


def parse_iso(value: str) -> datetime:
    return datetime.fromisoformat(value)


class UserStore:
    def __init__(self, path: str | None = None):
        self.path = path or os.environ.get("AUTH_SQLITE_PATH") or str(DEFAULT_DB_PATH)
        self._lock = threading.RLock()
        self.init_schema()

    def _connect(self) -> sqlite3.Connection:
        if self.path != ":memory:":
            Path(self.path).expanduser().parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(self.path, timeout=10)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        return conn

    def init_schema(self) -> None:
        with self._lock, self._connect() as conn:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS users (
                  id TEXT PRIMARY KEY,
                  google_sub TEXT UNIQUE NOT NULL,
                  email TEXT UNIQUE NOT NULL,
                  name TEXT,
                  picture TEXT,
                  created_at TEXT NOT NULL,
                  updated_at TEXT NOT NULL,
                  last_login_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS auth_sessions (
                  token_hash TEXT PRIMARY KEY,
                  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                  created_at TEXT NOT NULL,
                  expires_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS oauth_states (
                  state TEXT PRIMARY KEY,
                  created_at TEXT NOT NULL,
                  expires_at TEXT NOT NULL
                );
                """
            )

    def create_oauth_state(self, state: str, ttl: timedelta) -> None:
        now = utcnow()
        with self._lock, self._connect() as conn:
            conn.execute("DELETE FROM oauth_states WHERE expires_at <= ?", (iso(now),))
            conn.execute(
                "INSERT OR REPLACE INTO oauth_states (state, created_at, expires_at) VALUES (?, ?, ?)",
                (state, iso(now), iso(now + ttl)),
            )

    def consume_oauth_state(self, state: str) -> bool:
        now_s = iso(utcnow())
        with self._lock, self._connect() as conn:
            row = conn.execute("SELECT expires_at FROM oauth_states WHERE state = ?", (state,)).fetchone()
            if row is None:
                return False
            conn.execute("DELETE FROM oauth_states WHERE state = ?", (state,))
            return parse_iso(row["expires_at"]) > parse_iso(now_s)

    def upsert_google_user(self, *, google_sub: str, email: str, name: str | None, picture: str | None) -> dict[str, Any]:
        now = iso(utcnow())
        with self._lock, self._connect() as conn:
            row = conn.execute("SELECT id FROM users WHERE google_sub = ?", (google_sub,)).fetchone()
            if row is None:
                user_id = uuid.uuid4().hex
                conn.execute(
                    """
                    INSERT INTO users (id, google_sub, email, name, picture, created_at, updated_at, last_login_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (user_id, google_sub, email, name, picture, now, now, now),
                )
            else:
                user_id = row["id"]
                conn.execute(
                    """
                    UPDATE users
                    SET email = ?, name = ?, picture = ?, updated_at = ?, last_login_at = ?
                    WHERE id = ?
                    """,
                    (email, name, picture, now, now, user_id),
                )
            return dict(conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone())

    def create_session(self, *, token_hash: str, user_id: str, ttl: timedelta) -> None:
        now = utcnow()
        with self._lock, self._connect() as conn:
            conn.execute("DELETE FROM auth_sessions WHERE expires_at <= ?", (iso(now),))
            conn.execute(
                "INSERT INTO auth_sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
                (token_hash, user_id, iso(now), iso(now + ttl)),
            )

    def get_user_by_session(self, token_hash: str) -> dict[str, Any] | None:
        now = iso(utcnow())
        with self._lock, self._connect() as conn:
            row = conn.execute(
                """
                SELECT users.*
                FROM auth_sessions
                JOIN users ON users.id = auth_sessions.user_id
                WHERE auth_sessions.token_hash = ? AND auth_sessions.expires_at > ?
                """,
                (token_hash, now),
            ).fetchone()
            if row is None:
                conn.execute("DELETE FROM auth_sessions WHERE token_hash = ? OR expires_at <= ?", (token_hash, now))
                return None
            return dict(row)

    def delete_session(self, token_hash: str) -> None:
        with self._lock, self._connect() as conn:
            conn.execute("DELETE FROM auth_sessions WHERE token_hash = ?", (token_hash,))
