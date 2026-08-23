from archos_sdk import ArchOSClient, RuntimeHealth, WorldModelQuery


def test_ask_maps_runtime_response(monkeypatch):
    client = ArchOSClient("http://localhost:8000")
    monkeypatch.setattr(
        client,
        "_request",
        lambda *args, **kwargs: {"task_id": "t-1", "verification_status": "verified", "answer": "ok"},
    )
    result = client.ask("hello")
    assert result.task_id == "t-1"
    assert result.verification_status == "verified"
    assert result.raw["answer"] == "ok"
    client.close()


def test_action_decision_mapping(monkeypatch):
    client = ArchOSClient("http://localhost:8000")
    monkeypatch.setattr(
        client,
        "_request",
        lambda *args, **kwargs: {
            "action_id": "a-1",
            "decision": "ALLOW",
            "approval_state": "PENDING",
            "policy_decision": "ALLOW",
        },
    )
    decision = client.submit_action(
        actor="operator",
        agent="test-agent",
        target="runtime",
        requested_operation="read_health",
    )
    assert decision.action_id == "a-1"
    assert decision.decision == "ALLOW"
    assert decision.approval_state == "PENDING"
    client.close()


def test_world_model_query_maps_temporal_and_confidence_fields(monkeypatch):
    client = ArchOSClient("http://localhost:8000")
    captured = {}

    def fake_request(*args, **kwargs):
        captured.update(kwargs)
        return {
            "entity": {"id": "entity-1", "name": "Dubai"},
            "observations": [{"timestamp": "2026-08-23T10:00:00Z", "value": 42}],
            "observation_count": 1,
            "effective_confidence": 0.94,
        }

    monkeypatch.setattr(client, "_request", fake_request)
    result = client.query_entity(
        "entity-1",
        at="2026-08-23T10:00:00Z",
        observation_start="2026-08-01T00:00:00Z",
        observation_end="2026-08-23T23:59:59Z",
        request_id="req-123",
    )

    assert isinstance(result, WorldModelQuery)
    assert result.observation_count == 1
    assert result.effective_confidence == 0.94
    assert captured["params"]["at"] == "2026-08-23T10:00:00Z"
    assert captured["headers"]["X-Request-Id"] == "req-123"
    client.close()


def test_health_maps_runtime_contract(monkeypatch):
    client = ArchOSClient("http://localhost:8000")
    monkeypatch.setattr(
        client,
        "_request",
        lambda *args, **kwargs: {
            "status": "operational",
            "version": "0.1.0",
            "components": {"world_model": "active"},
        },
    )
    result = client.health()
    assert isinstance(result, RuntimeHealth)
    assert result.status == "operational"
    assert result.version == "0.1.0"
    assert result.components["world_model"] == "active"
    client.close()
