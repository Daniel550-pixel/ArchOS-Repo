import pytest
import asyncio
from app.services.ingestion import IngestionEngine

@pytest.mark.asyncio
async def test_mock_ingestion_idempotence():
    engine = IngestionEngine(provider_type="mock_sovereign")
    seen_hashes = set()

    # First Ingestion Run
    res1 = await engine.run_ingestion(limit=5, existing_hashes=seen_hashes)
    assert res1.status == "SUCCESS"
    assert res1.inserted_count > 0
    assert res1.duplicate_count == 0

    # Second Ingestion Run with same seen_hashes
    res2 = await engine.run_ingestion(limit=5, existing_hashes=seen_hashes)
    assert res2.status == "SUCCESS"
    assert res2.inserted_count == 0
    assert res2.duplicate_count == res1.inserted_count

@pytest.mark.asyncio
async def test_alert_generation_for_critical_events():
    engine = IngestionEngine(provider_type="mock_sovereign")
    res = await engine.run_ingestion(limit=10)
    
    assert len(res.articles_created) > 0
    # Check that high importance articles trigger alerts
    high_imp_articles = [a for a in res.articles_created if a["importance_score"] >= 80.0]
    if high_imp_articles:
        assert len(res.alerts_created) > 0
        first_alert = res.alerts_created[0]
        assert "alert_id" in first_alert
        assert "CRITICAL" in first_alert["severity"] or "HIGH" in first_alert["severity"]
