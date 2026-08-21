import asyncio
import logging
from datetime import datetime
from typing import Optional, Dict, Any
from app.core.config import settings
from app.services.ingestion import IngestionEngine

logger = logging.getLogger(__name__)

class NewsIngestionScheduler:
    """
    Lightweight, robust background worker for periodic news ingestion.
    Manages lock to prevent concurrency overlaps and records telemetry.
    """

    def __init__(self):
        self._is_running = False
        self._is_executing_job = False
        self._task: Optional[asyncio.Task] = None
        self._interval_seconds = settings.NEWS_FETCH_INTERVAL_MINUTES * 60
        self.last_run_at: Optional[datetime] = None
        self.last_run_status: str = "IDLE"
        self.last_result_summary: Dict[str, Any] = {}

    def start(self):
        if self._is_running:
            return
        self._is_running = True
        self._task = asyncio.create_task(self._scheduler_loop())
        logger.info(f"News Ingestion Scheduler started with interval of {settings.NEWS_FETCH_INTERVAL_MINUTES} minutes")

    def stop(self):
        self._is_running = False
        if self._task and not self._task.done():
            self._task.cancel()
        logger.info("News Ingestion Scheduler stopped")

    async def _scheduler_loop(self):
        while self._is_running:
            try:
                await self.trigger_sync()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in scheduler tick: {e}")
            
            try:
                await asyncio.sleep(self._interval_seconds)
            except asyncio.CancelledError:
                break

    async def trigger_sync(self) -> Dict[str, Any]:
        """Manually or periodically trigger an ingestion cycle."""
        if self._is_executing_job:
            logger.warning("Ingestion job already running; skipping trigger")
            return {"status": "SKIPPED", "reason": "Job in progress"}

        self._is_executing_job = True
        self.last_run_at = datetime.utcnow()
        try:
            engine = IngestionEngine()
            result = await engine.run_ingestion(limit=settings.MAX_ARTICLES_PER_FETCH)
            self.last_run_status = result.status
            self.last_result_summary = {
                "job_id": result.job_id,
                "provider": result.provider,
                "fetched": result.fetched_count,
                "inserted": result.inserted_count,
                "duplicates": result.duplicate_count,
                "latency_ms": result.latency_ms,
                "status": result.status
            }
            return self.last_result_summary
        except Exception as e:
            self.last_run_status = "FAILED"
            self.last_result_summary = {"error": str(e), "status": "FAILED"}
            return self.last_result_summary
        finally:
            self._is_executing_job = False

scheduler = NewsIngestionScheduler()
