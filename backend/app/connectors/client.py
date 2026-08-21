import httpx
import time
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from urllib.parse import urlparse
from pydantic import BaseModel, Field
from app.core.config import settings

logger = logging.getLogger(__name__)

class RawArticlePayload(BaseModel):
    """
    Standardized raw payload directly received and parsed from the UAE News API.
    """
    provider: str = "uae_news_api"
    provider_article_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    content: Optional[str] = None
    url: str
    source_name: str
    source_domain: Optional[str] = None
    author: Optional[str] = None
    published_at: datetime
    image_url: Optional[str] = None
    language: str = "en"
    country: str = "ae"
    category: Optional[str] = None
    raw_payload: Dict[str, Any] = Field(default_factory=dict)

class SensorHealthStatus(BaseModel):
    sensor_name: str = "UAE News API Sensor"
    status: str
    authenticated: bool
    latency_ms: float
    message: str

class UaeNewsApiClient:
    """
    Single, dedicated client for the UAE News API.
    Acts as the sole external news-data sensor for the entire intelligence platform.
    API Key is strictly isolated in the backend environment.
    """

    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        self.api_key = api_key or settings.NEWS_API_KEY or settings.UAE_NEWS_API_KEY or ""
        self.base_url = (base_url or settings.NEWS_API_BASE_URL).rstrip("/")
        self.timeout = settings.REQUEST_TIMEOUT_SECONDS

    def _extract_domain(self, url: str) -> Optional[str]:
        try:
            parsed = urlparse(url)
            return parsed.netloc or None
        except Exception:
            return None

    def _parse_article(self, item: Dict[str, Any]) -> Optional[RawArticlePayload]:
        try:
            url = item.get("url", "").strip()
            title = item.get("title", "").strip()
            if not url or not title or title == "[Removed]":
                return None

            source_dict = item.get("source") or {}
            source_name = source_dict.get("name") or "UAE News Source"
            source_domain = self._extract_domain(url)

            # Parse ISO timestamp safely
            published_str = item.get("publishedAt")
            published_at = datetime.utcnow()
            if published_str:
                try:
                    published_at = datetime.fromisoformat(published_str.replace("Z", "+00:00"))
                except Exception:
                    published_at = datetime.utcnow()

            return RawArticlePayload(
                provider="uae_news_api",
                provider_article_id=url,
                title=title,
                description=item.get("description"),
                content=item.get("content"),
                url=url,
                source_name=source_name,
                source_domain=source_domain,
                author=item.get("author"),
                published_at=published_at,
                image_url=item.get("urlToImage"),
                language=settings.NEWS_LANGUAGE,
                country=settings.NEWS_COUNTRY,
                category=None,
                raw_payload=item
            )
        except Exception as e:
            logger.warning(f"Failed to parse article from UAE News API feed: {e}")
            return None

    async def fetch_latest(self, limit: int = 20) -> List[RawArticlePayload]:
        """
        Fetch the freshest UAE news headlines from the single UAE News API sensor.
        """
        if not self.api_key:
            logger.warning("UAE News API Key is not configured in backend environment.")
            return []

        articles: List[RawArticlePayload] = []
        headers = {"X-Api-Key": self.api_key, "User-Agent": "UAE-News-Intelligence/1.0"}
        
        # Primary targeted query for UAE headlines and strategic topics
        endpoints = [
            f"{self.base_url}/top-headlines?country={settings.NEWS_COUNTRY}&pageSize={min(limit, 50)}",
            f"{self.base_url}/everything?q=(UAE OR \"United Arab Emirates\" OR Dubai OR \"Abu Dhabi\" OR \"Etihad Rail\" OR \"Barakah\" OR \"AIDA\")&sortBy=publishedAt&language={settings.NEWS_LANGUAGE}&pageSize={min(limit, 50)}"
        ]

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            for endpoint in endpoints:
                try:
                    resp = await client.get(endpoint, headers=headers)
                    if resp.status_code == 200:
                        data = resp.json()
                        raw_items = data.get("articles", [])
                        for item in raw_items:
                            parsed = self._parse_article(item)
                            if parsed and not any(a.url == parsed.url for a in articles):
                                articles.append(parsed)
                        if len(articles) >= limit:
                            break
                    elif resp.status_code == 401:
                        logger.error("UAE News API returned 401 Unauthorized - check API Key.")
                        break
                    elif resp.status_code == 429:
                        logger.error("UAE News API rate limit reached.")
                        break
                except Exception as ex:
                    logger.error(f"Error fetching from UAE News API ({endpoint}): {ex}")

        return articles[:limit]

    async def fetch_by_query(self, query: str, limit: int = 20) -> List[RawArticlePayload]:
        """
        Query the single UAE News API sensor for specific keywords.
        """
        if not self.api_key:
            return []

        articles: List[RawArticlePayload] = []
        headers = {"X-Api-Key": self.api_key, "User-Agent": "UAE-News-Intelligence/1.0"}
        encoded_query = f"({query}) AND (UAE OR \"United Arab Emirates\" OR Dubai OR \"Abu Dhabi\")"
        endpoint = f"{self.base_url}/everything?q={encoded_query}&sortBy=publishedAt&language={settings.NEWS_LANGUAGE}&pageSize={min(limit, 50)}"

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                resp = await client.get(endpoint, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    for item in data.get("articles", []):
                        parsed = self._parse_article(item)
                        if parsed:
                            articles.append(parsed)
            except Exception as ex:
                logger.error(f"Error querying UAE News API for '{query}': {ex}")

        return articles[:limit]

    async def health_check(self) -> SensorHealthStatus:
        """
        Probe sensor connectivity and authentication status.
        """
        if not self.api_key:
            return SensorHealthStatus(
                sensor_name="UAE News API Sensor",
                status="UNCONFIGURED",
                authenticated=False,
                latency_ms=0.0,
                message="NEWS_API_KEY environment variable is not configured."
            )

        start_time = time.time()
        headers = {"X-Api-Key": self.api_key, "User-Agent": "UAE-News-Intelligence/1.0"}
        endpoint = f"{self.base_url}/top-headlines?country={settings.NEWS_COUNTRY}&pageSize=1"

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(endpoint, headers=headers)
                latency = round((time.time() - start_time) * 1000, 2)
                
                if resp.status_code == 200:
                    return SensorHealthStatus(
                        sensor_name="UAE News API Sensor",
                        status="HEALTHY",
                        authenticated=True,
                        latency_ms=latency,
                        message="Connected and authenticated with sole UAE News API sensor."
                    )
                elif resp.status_code == 401:
                    return SensorHealthStatus(
                        sensor_name="UAE News API Sensor",
                        status="ERROR",
                        authenticated=False,
                        latency_ms=latency,
                        message="Authentication failed: Invalid UAE News API key."
                    )
                elif resp.status_code == 429:
                    return SensorHealthStatus(
                        sensor_name="UAE News API Sensor",
                        status="DEGRADED",
                        authenticated=True,
                        latency_ms=latency,
                        message="Rate limit reached for current API quota."
                    )
                else:
                    return SensorHealthStatus(
                        sensor_name="UAE News API Sensor",
                        status="ERROR",
                        authenticated=False,
                        latency_ms=latency,
                        message=f"HTTP {resp.status_code}: {resp.text}"
                    )
        except Exception as e:
            latency = round((time.time() - start_time) * 1000, 2)
            return SensorHealthStatus(
                sensor_name="UAE News API Sensor",
                status="ERROR",
                authenticated=False,
                latency_ms=latency,
                message=f"Network error communicating with UAE News API: {str(e)}"
            )
