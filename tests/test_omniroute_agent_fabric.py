from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from app.services import claude_agent_fabric as fabric_module


@pytest.fixture
def model_request():
    return fabric_module.ClaudeAgentRequest(
        role="reasoning",
        prompt="Summarize the evidence.",
        max_tokens=256,
    )


@pytest.mark.asyncio
async def test_omniroute_success_uses_openai_compatible_chat_api(monkeypatch, model_request):
    captured = {}

    class FakeAsyncOpenAI:
        def __init__(self, **kwargs):
            captured["client"] = kwargs
            self.chat = SimpleNamespace(
                completions=SimpleNamespace(
                    create=AsyncMock(return_value=SimpleNamespace(
                        choices=[SimpleNamespace(message=SimpleNamespace(content="Verified analysis"))],
                        model="provider/model-x",
                    ))
                )
            )

    monkeypatch.setattr(fabric_module.settings, "OMNIROUTE_ENABLED", True)
    monkeypatch.setattr(fabric_module.settings, "OMNIROUTE_API_KEY", "test-key")
    monkeypatch.setattr(fabric_module.settings, "OMNIROUTE_BASE_URL", "http://127.0.0.1:20128/v1/")
    monkeypatch.setattr(fabric_module.settings, "OMNIROUTE_MODEL", "auto")
    monkeypatch.setattr(fabric_module.settings, "OMNIROUTE_TIMEOUT_SECONDS", 12.0)
    monkeypatch.setitem(__import__("sys").modules, "openai", SimpleNamespace(AsyncOpenAI=FakeAsyncOpenAI))

    result = await fabric_module.ClaudeAgentFabric().run(model_request)

    assert result.status == "SUCCESS"
    assert result.provider == "omniroute"
    assert result.content == "Verified analysis"
    assert result.model == "provider/model-x"
    assert result.execution_authority is False
    assert captured["client"]["base_url"] == "http://127.0.0.1:20128/v1"
    assert captured["client"]["api_key"] == "test-key"


@pytest.mark.asyncio
async def test_omniroute_failure_uses_anthropic_fallback(monkeypatch, model_request):
    class FakeAsyncOpenAI:
        def __init__(self, **kwargs):
            self.chat = SimpleNamespace(
                completions=SimpleNamespace(
                    create=AsyncMock(side_effect=TimeoutError("private transport detail"))
                )
            )

    class FakeAsyncAnthropic:
        def __init__(self, **kwargs):
            self.messages = SimpleNamespace(
                create=AsyncMock(return_value=SimpleNamespace(
                    content=[SimpleNamespace(type="text", text="Fallback analysis")]
                ))
            )

    monkeypatch.setattr(fabric_module.settings, "OMNIROUTE_ENABLED", True)
    monkeypatch.setattr(fabric_module.settings, "OMNIROUTE_API_KEY", "test-key")
    monkeypatch.setattr(fabric_module.settings, "OMNIROUTE_FALLBACK_TO_ANTHROPIC", True)
    monkeypatch.setattr(fabric_module.settings, "ANTHROPIC_API_KEY", "anthropic-test-key")
    monkeypatch.setattr(fabric_module.settings, "ARCHOS_CLAUDE_MODEL", "claude-test-model")
    monkeypatch.setitem(__import__("sys").modules, "openai", SimpleNamespace(AsyncOpenAI=FakeAsyncOpenAI))
    monkeypatch.setitem(__import__("sys").modules, "anthropic", SimpleNamespace(AsyncAnthropic=FakeAsyncAnthropic))

    routed_request = fabric_module.ClaudeAgentRequest(
        role=model_request.role,
        prompt=model_request.prompt,
        model="openai/gpt-4.1",
        max_tokens=model_request.max_tokens,
    )
    result = await fabric_module.ClaudeAgentFabric().run(routed_request)

    assert result.status == "FALLBACK_SUCCESS"
    assert result.provider == "anthropic"
    assert result.content == "Fallback analysis"
    assert result.model == "claude-test-model"
    assert result.execution_authority is False
    assert "OmniRoute unavailable" in result.error
    assert "private transport detail" not in result.error


@pytest.mark.asyncio
async def test_omniroute_missing_key_is_unconfigured_without_provider_call(monkeypatch, model_request):
    monkeypatch.setattr(fabric_module.settings, "OMNIROUTE_ENABLED", True)
    monkeypatch.setattr(fabric_module.settings, "OMNIROUTE_API_KEY", None)
    monkeypatch.setattr(fabric_module.settings, "OMNIROUTE_FALLBACK_TO_ANTHROPIC", False)

    result = await fabric_module.ClaudeAgentFabric().run(model_request)

    assert result.status == "UNCONFIGURED"
    assert result.provider == "omniroute"
    assert result.is_real is False
    assert result.execution_authority is False
    assert result.error == "OMNIROUTE_API_KEY is not configured"


@pytest.mark.asyncio
async def test_disabled_omniroute_preserves_direct_anthropic_path(monkeypatch, model_request):
    class FakeAsyncAnthropic:
        def __init__(self, **kwargs):
            self.messages = SimpleNamespace(
                create=AsyncMock(return_value=SimpleNamespace(
                    content=[SimpleNamespace(type="text", text="Direct Anthropic analysis")]
                ))
            )

    monkeypatch.setattr(fabric_module.settings, "OMNIROUTE_ENABLED", False)
    monkeypatch.setattr(fabric_module.settings, "ANTHROPIC_API_KEY", "anthropic-test-key")
    monkeypatch.setattr(fabric_module.settings, "ARCHOS_CLAUDE_MODEL", "claude-test-model")
    monkeypatch.setitem(__import__("sys").modules, "anthropic", SimpleNamespace(AsyncAnthropic=FakeAsyncAnthropic))

    result = await fabric_module.ClaudeAgentFabric().run(model_request)

    assert result.status == "SUCCESS"
    assert result.provider == "anthropic"
    assert result.content == "Direct Anthropic analysis"
    assert result.execution_authority is False
