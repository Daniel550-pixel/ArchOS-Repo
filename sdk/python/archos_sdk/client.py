"""HTTP client for the stable, externally consumable ArchOS endpoints."""

from __future__ import annotations

from typing import Any, Mapping

import httpx

from .models import ActionDecision, ActionResult, JarvisResult


class ArchOSError(RuntimeError):
    """Raised when the ArchOS API returns an unsuccessful response."""


class ArchOSClient:
    """Minimal synchronous client for JARVIS and governed actions.

    The client deliberately contains no policy implementation. Authorization,
    identity, governance, and action execution remain server-side concerns.
    """

    def __init__(
        self,
        base_url: str,
        *,
        token: str | None = None,
        timeout: float = 30.0,
        api_prefix: str = "/api/v1",
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.api_prefix = "/" + api_prefix.strip("/")
        headers = {"Accept": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        self._client = httpx.Client(base_url=self.base_url, headers=headers, timeout=timeout)

    def close(self) -> None:
        self._client.close()

    def __enter__(self) -> "ArchOSClient":
        return self

    def __exit__(self, *_: object) -> None:
        self.close()

    def health(self) -> Mapping[str, Any]:
        return self._request("GET", f"{self.api_prefix}/health/runtime")

    def ask(self, query: str, *, actor: str = "operator", tenant_id: str = "uae-sovereign") -> JarvisResult:
        data = self._request(
            "POST",
            f"{self.api_prefix}/jarvis/ask",
            json={"query": query, "actor": actor, "tenant_id": tenant_id},
        )
        return JarvisResult(
            task_id=data.get("task_id"),
            verification_status=data.get("verification_status"),
            raw=data,
        )

    def submit_action(
        self,
        *,
        actor: str,
        agent: str,
        target: str,
        requested_operation: str,
        risk_level: str = "LOW_RISK",
        required_authority: str = "OPERATOR_CLEARANCE",
        task_id: str = "",
        provenance: str = "",
        payload: Mapping[str, Any] | None = None,
    ) -> ActionDecision:
        data = self._request(
            "POST",
            f"{self.api_prefix}/governance/actions",
            json={
                "actor": actor,
                "agent": agent,
                "task_id": task_id,
                "target": target,
                "requested_operation": requested_operation,
                "risk_level": risk_level,
                "required_authority": required_authority,
                "provenance": provenance,
                "payload": dict(payload or {}),
            },
        )
        return ActionDecision(
            action_id=str(data["action_id"]),
            decision=str(data["decision"]),
            approval_state=data.get("approval_state"),
            policy_decision=data.get("policy_decision"),
        )

    def approve_action(self, action_id: str, *, approver: str) -> ActionResult:
        data = self._request(
            "POST",
            f"{self.api_prefix}/governance/actions/{action_id}/approve",
            json={"approver": approver},
        )
        return ActionResult.from_mapping(data)

    def _request(self, method: str, path: str, **kwargs: Any) -> dict[str, Any]:
        response = self._client.request(method, path, **kwargs)
        if response.is_error:
            detail: Any = response.text
            try:
                detail = response.json().get("detail", detail)
            except ValueError:
                pass
            raise ArchOSError(f"ArchOS API {response.status_code}: {detail}")
        try:
            data = response.json()
        except ValueError as exc:
            raise ArchOSError("ArchOS API returned non-JSON data") from exc
        if not isinstance(data, dict):
            raise ArchOSError("ArchOS API returned an unexpected response shape")
        return data
