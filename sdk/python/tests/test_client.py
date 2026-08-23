from archos_sdk import ArchOSClient


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
