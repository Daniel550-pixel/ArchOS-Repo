import time
import uuid
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional

from app.connectors.client import UaeNewsApiClient, RawArticlePayload
from app.pipelines.normalization import canonicalize_url, compute_content_hash, clean_text
from app.pipelines.intelligence import IntelligencePipeline
from app.core.config import settings

logger = logging.getLogger(__name__)


class IngestionResult:
    def __init__(self):
        self.job_id = f"JOB_{uuid.uuid4().hex[:10].upper()}"
        self.sensor_source = "UAE News API"
        self.fetched_count = 0
        self.inserted_count = 0
        self.duplicate_count = 0
        self.error_count = 0
        self.status = "SUCCESS"
        self.latency_ms = 0.0
        self.error_message: Optional[str] = None
        self.articles_created: List[Dict[str, Any]] = []
        self.events_created: List[Dict[str, Any]] = []
        self.alerts_created: List[Dict[str, Any]] = []


class IngestionEngine:
    """UAE News API -> normalization -> intelligence -> persistent World Model."""

    def __init__(self, api_key: Optional[str] = None):
        self.client = UaeNewsApiClient(api_key=api_key)

    async def _persist_observation(
        self,
        article: Dict[str, Any],
        entities: List[Dict[str, Any]],
        locations: List[Dict[str, Any]],
        topics: List[Dict[str, Any]],
        event: Optional[Dict[str, Any]],
    ) -> None:
        """Persist the complete observation atomically when a database is configured."""
        if not settings.DATABASE_URL:
            if settings.ENVIRONMENT == "production":
                raise RuntimeError("Production ingestion requires DATABASE_URL")
            logger.warning("DATABASE_URL is not configured; observation remains non-persistent")
            return

        from app.core.database import AsyncSessionLocal
        from app.services.world_model import WorldModelService

        async with AsyncSessionLocal() as session:
            try:
                await WorldModelService.persist_observation(
                    session=session,
                    article=article,
                    entities=entities,
                    locations=locations,
                    topics=topics,
                    event=event,
                )
            except Exception:
                await session.rollback()
                raise

    async def run_ingestion(
        self,
        limit: int = 20,
        existing_hashes: Optional[set] = None,
        query: Optional[str] = None,
    ) -> IngestionResult:
        start_time = time.time()
        result = IngestionResult()
        seen_hashes = existing_hashes if existing_hashes is not None else set()

        try:
            logger.info("Starting ingestion from UAE News API Sensor (limit=%s)...", limit)
            raw_articles: List[RawArticlePayload]
            if query:
                raw_articles = await self.client.fetch_by_query(query=query, limit=limit)
            else:
                raw_articles = await self.client.fetch_latest(limit=limit)

            result.fetched_count = len(raw_articles)

            for raw in raw_articles:
                try:
                    title_cleaned = clean_text(raw.title)
                    desc_cleaned = clean_text(raw.description or "")
                    content_cleaned = clean_text(raw.content or "")
                    canonical_u = canonicalize_url(raw.url)
                    chash = compute_content_hash(title_cleaned, content_cleaned or desc_cleaned, canonical_u)

                    if chash in seen_hashes:
                        result.duplicate_count += 1
                        continue
                    seen_hashes.add(chash)

                    full_text = f"{title_cleaned} {desc_cleaned} {content_cleaned}"
                    detected_emirate = IntelligencePipeline.detect_emirate(full_text)
                    entities = IntelligencePipeline.extract_entities(full_text)
                    locations = IntelligencePipeline.extract_locations(full_text)
                    topics = IntelligencePipeline.classify_topics(f"{title_cleaned} {desc_cleaned}")
                    importance_score, importance_factors = IntelligencePipeline.calculate_importance(
                        title=title_cleaned,
                        content=desc_cleaned or content_cleaned,
                        entities=entities,
                        topics=topics,
                    )
                    confidence_score, confidence_reason = IntelligencePipeline.calculate_confidence(
                        source_name=raw.source_name,
                        has_entities=bool(entities),
                        has_locations=bool(locations),
                    )

                    article_id = f"ART_{uuid.uuid4().hex[:12].upper()}"
                    article_obj = {
                        "id": article_id,
                        "provider": "UAE_NEWS_API",
                        "sensor_source": "UAE News API",
                        "provider_article_id": raw.provider_article_id or raw.url,
                        "title": title_cleaned,
                        "description": desc_cleaned,
                        "content": content_cleaned,
                        "url": raw.url,
                        "canonical_url": canonical_u,
                        "source_name": raw.source_name,
                        "source_domain": raw.source_domain,
                        "author": raw.author,
                        "language": raw.language,
                        "country": raw.country,
                        "category": raw.category or (topics[0]["category_group"] if topics else "General"),
                        "image_url": raw.image_url,
                        "content_hash": chash,
                        "importance_score": importance_score,
                        "importance_factors": importance_factors,
                        "confidence_score": confidence_score,
                        "confidence_reason": confidence_reason,
                        "detected_emirate": detected_emirate,
                        "raw_payload": raw.raw_payload,
                        "processing_status": "PROCESSED",
                        "processing_version": "1.0.0",
                        "published_at": raw.published_at.isoformat() if hasattr(raw.published_at, "isoformat") else str(raw.published_at),
                        "fetched_at": datetime.utcnow().isoformat(),
                        "entities": entities,
                        "locations": locations,
                        "topics": topics,
                    }

                    evt = IntelligencePipeline.detect_event_candidate(
                        title=title_cleaned,
                        description=desc_cleaned,
                        emirate=detected_emirate,
                        importance_score=importance_score,
                        importance_factors=importance_factors,
                        confidence_score=confidence_score,
                        topics=topics,
                    )
                    if evt:
                        evt["supporting_articles"] = [article_obj]
                        evt["supporting_articles_count"] = 1
                        evt["first_detected_at"] = datetime.utcnow().isoformat()
                        evt["last_updated_at"] = datetime.utcnow().isoformat()

                    await self._persist_observation(
                        article=article_obj,
                        entities=entities,
                        locations=locations,
                        topics=topics,
                        event=evt,
                    )

                    result.articles_created.append(article_obj)
                    result.inserted_count += 1

                    if evt:
                        result.events_created.append(evt)

                        if importance_score >= 80.0:
                            result.alerts_created.append({
                                "alert_id": f"ALT_{uuid.uuid4().hex[:10].upper()}",
                                "title": f"HIGH IMPACT STRATEGIC TELEMETRY: {title_cleaned[:80]}...",
                                "description": f"Article with importance score {importance_score}/100 detected in {detected_emirate}.",
                                "severity": "CRITICAL_SOVEREIGN" if importance_score >= 88.0 else "HIGH",
                                "alert_type": "HIGH_IMPORTANCE_EVENT",
                                "trigger_rule": f"IMPORTANCE_SCORE >= 80.0 (Score: {importance_score})",
                                "related_article_id": article_id,
                                "related_event_id": evt["event_id"],
                                "acknowledged": False,
                                "created_at": datetime.utcnow().isoformat(),
                            })

                except Exception as ex:
                    logger.exception("Failed to persist/process raw article payload")
                    result.error_count += 1
                    if settings.ENVIRONMENT == "production":
                        result.status = "FAILED"
                        result.error_message = str(ex)
                        break

            if result.status != "FAILED":
                result.status = "SUCCESS" if result.error_count == 0 else "PARTIAL_SUCCESS"

        except Exception as e:
            logger.exception("Ingestion engine encountered error")
            result.status = "FAILED"
            result.error_message = str(e)

        result.latency_ms = round((time.time() - start_time) * 1000, 2)
        logger.info(
            "Ingestion completed in %sms: %s inserted, %s duplicates skipped.",
            result.latency_ms,
            result.inserted_count,
            result.duplicate_count,
        )
        return result
