"""Google Places API module for competitor discovery and review extraction.

Implements ScraperModule protocol. Outputs RawDataItem with:
- source_type=PLACES_LISTING for competitor venues
- source_type=REVIEW for customer reviews (subject to TTL buffer)
"""

from __future__ import annotations

import logging
import os
from typing import Optional

import httpx
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential_jitter,
    retry_if_exception_type,
)

from contracts import (
    RawDataItem,
    ScopeConfig,
    SourceType,
    Location,
)
from contracts.interfaces import ScraperModule

logger = logging.getLogger(__name__)

PLACES_BASE = "https://maps.googleapis.com/maps/api/place"
NEARBY_SEARCH = f"{PLACES_BASE}/nearbysearch/json"
PLACE_DETAILS = f"{PLACES_BASE}/details/json"


class PlacesModule:
    """Google Places API scraper for competitors + reviews.

    Circuit-breaker: on quota/limit errors, returns [] + logs warning.
    Never raises to caller (graceful degradation per spec §3).
    """

    name = "google_places"

    def __init__(
        self,
        api_key: Optional[str] = None,
        timeout: float = 30.0,
        max_retries: int = 3,
    ):
        self.api_key = api_key or os.getenv("GOOGLE_PLACES_API_KEY")
        self.timeout = timeout
        self.max_retries = max_retries
        self._client: Optional[httpx.AsyncClient] = None
        self._healthy = True

    @property
    def client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=self.timeout)
        return self._client

    async def close(self) -> None:
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    def is_healthy(self) -> bool:
        """Health check for degradation reporting."""
        return self._healthy and bool(self.api_key)

    async def fetch(self, scope: ScopeConfig) -> list[RawDataItem]:
        """Fetch competitors + reviews for the given scope.

        Returns:
            List of RawDataItem with source_type=PLACES_LISTING (competitors)
            and source_type=REVIEW (customer reviews).
        """
        if not self.api_key:
            logger.warning("GOOGLE_PLACES_API_KEY not set; PlacesModule returning empty")
            self._healthy = False
            return []

        items: list[RawDataItem] = []

        try:
            # 1. Find competitors via nearby search
            competitors = await self._nearby_search(scope)
            items.extend(competitors)

            # 2. For each competitor, fetch reviews (up to config limit)
            for comp in competitors:
                if comp.place_id:
                    reviews = await self._fetch_reviews(comp.place_id, scope)
                    items.extend(reviews)

        except httpx.HTTPStatusError as e:
            if e.response.status_code in (403, 429):
                logger.warning("Places API quota/limit hit: %s", e)
                self._healthy = False
            else:
                logger.error("Places API error: %s", e)
        except Exception as e:  # noqa: BLE001
            logger.error("PlacesModule unexpected error: %s", e)

        return items

    @retry(
        wait=wait_exponential_jitter(initial=1, max=10),
        stop=stop_after_attempt(3),
        retry=retry_if_exception_type(httpx.RequestError),
        reraise=True,
    )
    async def _nearby_search(self, scope: ScopeConfig) -> list[RawDataItem]:
        """Search for nearby competitors matching the business type."""
        inp = scope.business_input
        location = inp.location

        # Build location bias
        lat = location.coordinates.lat if location.coordinates else -6.2
        lng = location.coordinates.lng if location.coordinates else 106.8
        location_bias = f"circle:{inp.radius_km * 1000}@{lat},{lng}"

        # Use business_type + category for keyword
        keyword = f"{inp.business_type} {inp.category.value}"

        params = {
            "key": self.api_key,
            "location": f"{lat},{lng}",
            "radius": int(inp.radius_km * 1000),
            "keyword": keyword,
            "language": "id",
            "type": "establishment",
        }

        resp = await self.client.get(NEARBY_SEARCH, params=params)
        resp.raise_for_status()
        data = resp.json()

        if data.get("status") == "OVER_QUERY_LIMIT":
            raise httpx.HTTPStatusError("Quota exceeded", request=resp.request, response=resp)

        results: list[RawDataItem] = []
        for place in data.get("results", [])[:20]:  # cap at 20 competitors
            place_id = place.get("place_id")
            if not place_id:
                continue

            # Build competitor listing item
            items.append(
                RawDataItem(
                    scope_id=scope.scope_id,
                    source_type=SourceType.PLACES_LISTING,
                    source_name="google_places",
                    url=f"https://maps.google.com/?cid={place_id}",
                    title=place.get("name", "Unknown"),
                    raw_text=(
                        f"{place.get('name', '')} - "
                        f"Rating: {place.get('rating', 'N/A')} "
                        f"({place.get('user_ratings_total', 0)} reviews). "
                        f"Address: {place.get('vicinity', '')}"
                    ),
                    lang_hint="id",
                    geo_hint=Location(
                        city=location.city,
                        district=location.district,
                        province=location.province,
                        coordinates=Location.Coordinates(lat=lat, lng=lng) if lat and lng else None,
                    ),
                    place_id=place_id,
                    rating_aggregate=place.get("rating"),
                    review_count=place.get("user_ratings_total"),
                    raw_meta={
                        "types": place.get("types", []),
                        "vicinity": place.get("vicinity"),
                        "price_level": place.get("price_level"),
                    },
                )
            )

        logger.info("PlacesModule: found %d competitors for scope %s", len(results), scope.scope_id)
        return results

    @retry(
        wait=wait_exponential_jitter(initial=1, max=10),
        stop=stop_after_attempt(3),
        retry=retry_if_exception_type(httpx.RequestError),
        reraise=True,
    )
    async def _fetch_reviews(
        self, place_id: str, scope: ScopeConfig
    ) -> list[RawDataItem]:
        """Fetch reviews for a specific place (subject to TTL buffer)."""
        params = {
            "key": self.api_key,
            "place_id": place_id,
            "fields": "name,rating,reviews,user_ratings_total",
            "language": "id",
            "reviews_sort": "newest",  # prioritize fresh reviews
            "reviews_no_translations": "true",
        }

        resp = await self.client.get(PLACE_DETAILS, params=params)
        resp.raise_for_status()
        data = resp.json()

        if data.get("status") == "OVER_QUERY_LIMIT":
            raise httpx.HTTPStatusError("Quota exceeded", request=resp.request, response=resp)

        result = data.get("result", {})
        reviews_data = result.get("reviews", [])

        items: list[RawDataItem] = []
        for rev in reviews_data[:10]:  # cap at 10 reviews per place
            text = rev.get("text", "").strip()
            if not text:
                continue

            items.append(
                RawDataItem(
                    scope_id=scope.scope_id,
                    source_type=SourceType.REVIEW,
                    source_name="google_places",
                    url=f"https://maps.google.com/?cid={place_id}",
                    title=f"Review for {result.get('name', 'Unknown')}",
                    raw_text=text,
                    lang_hint=rev.get("language", "id"),
                    published_at=self._parse_relative_time(rev.get("relative_time_description")),
                    geo_hint=scope.business_input.location,
                    place_id=place_id,
                    rating_aggregate=result.get("rating"),
                    review_count=result.get("user_ratings_total"),
                    raw_meta={
                        "author": rev.get("author_name"),
                        "rating": rev.get("rating"),
                        "relative_time": rev.get("relative_time_description"),
                        "profile_photo": rev.get("profile_photo_url"),
                    },
                )
            )

        logger.debug("PlacesModule: fetched %d reviews for place %s", len(items), place_id)
        return items

    @staticmethod
    def _parse_relative_time(rel: Optional[str]) -> Optional[str]:
        """Convert Google's relative time to ISO datetime (approximate)."""
        if not rel:
            return None
        # Google returns strings like "a week ago", "3 months ago"
        # For hackathon, we return None and let router handle recency from scraped_at
        return None


# ---- Mock for testing without API key ----
class MockPlacesModule:
    """Deterministic mock returning fixture-like data."""

    name = "google_places_mock"

    def __init__(self):
        self._healthy = True

    def is_healthy(self) -> bool:
        return self._healthy

    async def fetch(self, scope: ScopeConfig) -> list[RawDataItem]:
        inp = scope.business_input
        loc = inp.location

        # Return 2-3 mock competitors + 2-3 mock reviews
        items = [
            RawDataItem(
                scope_id=scope.scope_id,
                source_type=SourceType.PLACES_LISTING,
                source_name="google_places_mock",
                title=f"Kopi Kenangan {loc.city}",
                raw_text=(
                    f"Kopi Kenangan {loc.city} - Rating: 4.3 (1,234 reviews). "
                    f"Jl. Raya {loc.city} No. 123. Kopi kenyal harga terjangkau."
                ),
                lang_hint="id",
                geo_hint=loc,
                place_id="ChIJ_mock_kenangan",
                rating_aggregate=4.3,
                review_count=1234,
                raw_meta={"types": ["cafe", "food"], "price_level": 1},
            ),
            RawDataItem(
                scope_id=scope.scope_id,
                source_type=SourceType.PLACES_LISTING,
                source_name="google_places_mock",
                title=f"Starbucks {loc.city} Mall",
                raw_text=(
                    f"Starbucks {loc.city} Mall - Rating: 4.5 (2,567 reviews). "
                    f"{loc.city} Mall Lt. 1. Kopi premium, suasana nyaman kerja."
                ),
                lang_hint="id",
                geo_hint=loc,
                place_id="ChIJ_mock_starbucks",
                rating_aggregate=4.5,
                review_count=2567,
                raw_meta={"types": ["cafe", "food"], "price_level": 2},
            ),
            RawDataItem(
                scope_id=scope.scope_id,
                source_type=SourceType.REVIEW,
                source_name="google_places_mock",
                title="Review for Kopi Kenangan",
                raw_text="Kopi enak banget, harga murah, pelayanan cepet. Tempatnya agak sempit tapi nyaman buat nongkrong.",
                lang_hint="id",
                geo_hint=loc,
                place_id="ChIJ_mock_kenangan",
                rating_aggregate=4.3,
                review_count=1234,
                raw_meta={"author": "Budi S", "rating": 5, "relative_time": "2 weeks ago"},
            ),
            RawDataItem(
                scope_id=scope.scope_id,
                source_type=SourceType.REVIEW,
                source_name="google_places_mock",
                title="Review for Starbucks",
                raw_text="Tempatnya nyaman buat kerja, wifi lancar. Kopi mahal tapi konsisten. Barista ramah.",
                lang_hint="id",
                geo_hint=loc,
                place_id="ChIJ_mock_starbucks",
                rating_aggregate=4.5,
                review_count=2567,
                raw_meta={"author": "Sari W", "rating": 4, "relative_time": "1 month ago"},
            ),
        ]
        logger.info("MockPlacesModule: returned %d items for scope %s", len(items), scope.scope_id)
        return items