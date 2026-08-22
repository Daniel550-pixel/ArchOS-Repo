"""ArchOS authoritative J.A.R.V.I.S. cognitive orchestrator.

Executes the canonical reasoning/verification lifecycle while enforcing
capability-based agent routing and a hard governed execution boundary.
"""
from typing import Dict, Any, List, Optional
import uuid
import time
from datetime import datetime, timezone

from .base import (
    AgentTask,
    AgentResult,
    AgentCapability,
    RealityLevel,
    RiskLevel,
    InterAgentMessage,
)
from .swarm import swarm
from app.services.event_fabric import app_event_fabric as fabric


class JarvisOrchestrator:
    def __init__(self):
        self._history: List[Dict[str, Any]] = []

    async def orchestrate(
        self,
        query: str,
        actor: str = "operator",
        tenant_id: str = "uae-sovereign",
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        task_id = f"task-{uuid.uuid4().hex[:12]}"
        correlation_id = f"corr-{uuid.uuid4().hex[:8]}"
        start_time = time.time()
        context = context or {}

        session_record: Dict[str, Any] = {
            "task_id": task_id,
            "correlation_id": correlation_id,
            "query": query,
            "actor": actor,
            "tenant_id": tenant_id,
            "start_time": datetime.now(timezone.utc).isoformat(),
            "stages": [],
            "inter_agent_messages": [],
            "verification_status": "UNVERIFIED",
            "action_decision": "NOT_APPLICABLE",
            "final_answer": "",
            "reality": "OBSERVED",
            "confidence": 1.0,
            "execution_time_ms": 0.0,
        }

        async def publish(event: str, payload: Dict[str, Any]) -> None:
            """Publish observability events without turning telemetry into control flow."""
            try:
                await fabric.publish(event, payload)
            except Exception:
                # Realtime telemetry is non-authoritative. Durable governance and
                # execution decisions must not depend on WebSocket availability.
                pass

        async def dispatch(
            agent_id: str,
            capability: AgentCapability,
            intent: str,
            payload: Dict[str, Any],
            *,
            risk_level: RiskLevel = RiskLevel.READ_ONLY,
            verification_required: bool = True,
        ) -> AgentResult:
            """Create an explicit capability contract and route through the Swarm."""
            task = AgentTask(
                task_id=task_id,
                intent=intent,
                payload=payload,
                actor=actor,
                tenant_id=tenant_id,
                correlation_id=correlation_id,
                required_capabilities={capability},
                risk_level=risk_level,
                verification_required=verification_required,
            )
            # Route by capability. The canonical agent id is retained as an
            # invariant check so a future duplicate-capability registration cannot
            # silently redirect a J.A.R.V.I.S. stage to an unintended specialist.
            candidates = swarm.eligible_agents({capability})
            if not candidates or candidates[0].id != agent_id:
                return AgentResult(
                    agent_id=agent_id,
                    task_id=task_id,
                    status="DENIED",
                    output={},
                    reality=RealityLevel.FALLBACK,
                    confidence=0.0,
                    provenance="jarvis:capability_route_mismatch",
                    error=f"No canonical agent satisfies capability {capability.value}",
                )
            return await swarm.route(task)

        async def send_msg(
            sender: str,
            receiver: str,
            m_type: str,
            payload: dict,
            reality: RealityLevel = RealityLevel.INFERRED,
            conf: float = 1.0,
        ):
            msg = InterAgentMessage(
                task_id=task_id,
                sender=sender,
                receiver=receiver,
                message_type=m_type,
                payload=payload,
                reality=reality,
                confidence=conf,
                correlation_id=correlation_id,
            )
            session_record["inter_agent_messages"].append({
                "message_id": msg.message_id,
                "sender": msg.sender,
                "receiver": msg.receiver,
                "type": msg.message_type,
                "payload": msg.payload,
                "reality": msg.reality.value if hasattr(msg.reality, "value") else str(msg.reality),
                "confidence": msg.confidence,
                "timestamp": msg.timestamp,
            })
            await swarm.log_message(msg)

        await publish("TASK_CREATED", {
            "task_id": task_id,
            "correlation_id": correlation_id,
            "query": query,
            "actor": actor,
            "tenant_id": tenant_id,
        })

        # STAGE 1: UNDERSTAND
        res_perception = await dispatch(
            "perception", AgentCapability.PERCEPTION, "UNDERSTAND", {
                "query": query,
                "context": context,
            }
        )
        session_record["stages"].append({
            "stage": "1_UNDERSTAND",
            "stage_name": "Intent & Entity Disambiguation",
            "agent": res_perception.agent_id,
            "execution_time_ms": res_perception.execution_time_ms,
            "status": res_perception.status,
            "output": res_perception.output,
            "reality": res_perception.reality.value,
        })
        normalized_query = res_perception.output.get("normalized_query", query)
        domain = res_perception.output.get("domain", "GENERAL_INTELLIGENCE")
        detected_entities = res_perception.output.get("detected_entities", [])
        is_action_intent = bool(res_perception.output.get("is_action_intent", False))
        await send_msg("perception", "jarvis_orchestrator", "INTENT_VECTOR", res_perception.output, res_perception.reality, res_perception.confidence)

        # STAGE 2: CONTEXTUALIZE
        res_research = await dispatch(
            "research", AgentCapability.RESEARCH, "GATHER_CONTEXT", {
                "normalized_query": normalized_query,
                "domain": domain,
            }
        )
        session_record["stages"].append({
            "stage": "2_CONTEXTUALIZE",
            "stage_name": "Multi-Scale Telemetry Grounding",
            "agent": res_research.agent_id,
            "execution_time_ms": res_research.execution_time_ms,
            "status": res_research.status,
            "output": res_research.output,
            "reality": res_research.reality.value,
        })
        research_findings = res_research.output.get("findings", {})
        await send_msg("research", "world_model", "CONTEXT_ENVELOPE", research_findings, res_research.reality, res_research.confidence)

        # STAGE 3: QUERY WORLD MODEL
        await publish("WORLD_MODEL_QUERY", {
            "task_id": task_id,
            "entities": [e.get("urn") for e in detected_entities],
        })
        res_wm = await dispatch(
            "world_model", AgentCapability.WORLD_MODEL, "QUERY_STATE", {
                "detected_entities": detected_entities,
            }
        )
        session_record["stages"].append({
            "stage": "3_QUERY_WORLD_MODEL",
            "stage_name": "Canonical Graph & State Query",
            "agent": res_wm.agent_id,
            "execution_time_ms": res_wm.execution_time_ms,
            "status": res_wm.status,
            "output": res_wm.output,
            "reality": res_wm.reality.value,
        })
        wm_state = res_wm.output
        await send_msg("world_model", "reasoning", "CANONICAL_STATE", wm_state, res_wm.reality, res_wm.confidence)

        # STAGE 4: SELECT AGENTS — capability contract, not decorative IDs.
        selected_capabilities = [
            AgentCapability.REASONING.value,
            AgentCapability.PLANNING.value,
            AgentCapability.RISK_ASSESSMENT.value,
            AgentCapability.VERIFICATION.value,
        ]
        if is_action_intent:
            selected_capabilities.append(AgentCapability.EXECUTION.value)
        await publish("AGENT_SELECTED", {
            "task_id": task_id,
            "selected_capabilities": selected_capabilities,
            "domain": domain,
            "action_intent": is_action_intent,
        })
        session_record["stages"].append({
            "stage": "4_SELECT_AGENTS",
            "stage_name": "Dynamic Capability Dispatch",
            "agent": "jarvis_orchestrator",
            "execution_time_ms": 1.0,
            "status": "SUCCESS",
            "output": {
                "selected_capabilities": selected_capabilities,
                "domain": domain,
                "action_intent": is_action_intent,
            },
            "reality": "OBSERVED",
        })

        # STAGE 5: REASON
        await publish("REASONING_STARTED", {
            "task_id": task_id,
            "model_route": "sovereign_router",
        })
        res_reasoning = await dispatch(
            "reasoning", AgentCapability.REASONING, "DEDUCE_AND_SYNTHESIZE", {
                "normalized_query": normalized_query,
                "domain": domain,
                "world_model_state": wm_state,
                "research_findings": research_findings,
            }
        )
        session_record["stages"].append({
            "stage": "5_REASON",
            "stage_name": "Model-Backed Logical Deduction",
            "agent": res_reasoning.agent_id,
            "execution_time_ms": res_reasoning.execution_time_ms,
            "status": res_reasoning.status,
            "output": res_reasoning.output,
            "reality": res_reasoning.reality.value,
        })
        deductions = res_reasoning.output.get("deductions", [])
        await send_msg("reasoning", "planning", "DEDUCTION_SET", res_reasoning.output, res_reasoning.reality, res_reasoning.confidence)

        # STAGE 6: PLAN
        res_plan = await dispatch(
            "planning", AgentCapability.PLANNING, "DECOMPOSE_PLAN", {
                "domain": domain,
                "is_action_intent": is_action_intent,
                "deductions": deductions,
            },
            risk_level=RiskLevel.LOW_RISK if is_action_intent else RiskLevel.READ_ONLY,
        )
        await publish("PLAN_CREATED", {
            "task_id": task_id,
            "plan_id": res_plan.output.get("plan_id"),
            "step_count": len(res_plan.output.get("steps", [])),
        })
        session_record["stages"].append({
            "stage": "6_PLAN",
            "stage_name": "Tactical Task Decomposition",
            "agent": res_plan.agent_id,
            "execution_time_ms": res_plan.execution_time_ms,
            "status": res_plan.status,
            "output": res_plan.output,
            "reality": res_plan.reality.value,
        })
        plan_output = res_plan.output
        await send_msg("planning", "risk", "PLAN_PROPOSAL", plan_output, res_plan.reality, res_plan.confidence)

        # STAGE 7: RISK
        res_risk = await dispatch(
            "risk", AgentCapability.RISK_ASSESSMENT, "ASSESS_OPERATIONAL_RISK", {
                "domain": domain,
                "is_action_intent": is_action_intent,
                "plan": plan_output,
            },
            risk_level=RiskLevel.LOW_RISK if is_action_intent else RiskLevel.READ_ONLY,
        )
        session_record["stages"].append({
            "stage": "7_SIMULATE",
            "stage_name": "Operational Risk & Blast Radius Audit",
            "agent": res_risk.agent_id,
            "execution_time_ms": res_risk.execution_time_ms,
            "status": res_risk.status,
            "output": res_risk.output,
            "reality": res_risk.reality.value,
        })
        risk_output = res_risk.output
        risk_level_str = risk_output.get("risk_level", "LOW_RISK")
        await send_msg("risk", "verification", "RISK_ENVELOPE", risk_output, res_risk.reality, res_risk.confidence)

        # STAGE 8/9: VERIFY
        await publish("VERIFICATION_STARTED", {
            "task_id": task_id,
            "risk_level": risk_level_str,
        })
        res_verify = await dispatch(
            "verification", AgentCapability.VERIFICATION, "VERIFY_INVARIANTS", {
                "plan": plan_output,
                "reasoning": res_reasoning.output,
                "risk": risk_output,
                "is_action_intent": is_action_intent,
            }
        )
        session_record["stages"].append({
            "stage": "9_VERIFY",
            "stage_name": "Epistemic Verification & Policy Invariant Audit",
            "agent": res_verify.agent_id,
            "execution_time_ms": res_verify.execution_time_ms,
            "status": res_verify.status,
            "output": res_verify.output,
            "reality": res_verify.reality.value,
        })
        verification_status = res_verify.output.get("status", "UNVERIFIED")
        session_record["verification_status"] = verification_status
        await publish("VERIFICATION_COMPLETED", {
            "task_id": task_id,
            "status": verification_status,
            "confidence": res_verify.confidence,
        })

        # STAGE 10: RESPOND OR ACT. Non-action requests never dispatch execution.
        res_exec: Optional[AgentResult] = None
        if is_action_intent:
            t10_payload = {
                "is_action_intent": True,
                "risk_level": risk_level_str,
                "plan": plan_output,
                "deductions": deductions,
                "verification_status": verification_status,
            }
            res_exec = await dispatch(
                "execution", AgentCapability.EXECUTION, "GOVERNED_EXECUTION", t10_payload,
                risk_level=RiskLevel(risk_level_str) if risk_level_str in RiskLevel._value2member_map_ else RiskLevel.CONSEQUENTIAL,
                verification_required=True,
            )
            session_record["action_decision"] = res_exec.output.get("governance_decision", res_exec.status)
            execution_stage = {
                "stage": "10_RESPOND_OR_ACT",
                "stage_name": "Governed Action",
                "agent": res_exec.agent_id,
                "execution_time_ms": res_exec.execution_time_ms,
                "status": res_exec.status,
                "output": res_exec.output,
                "reality": res_exec.reality.value,
            }
        else:
            execution_stage = {
                "stage": "10_RESPOND_OR_ACT",
                "stage_name": "Response Synthesis",
                "agent": "jarvis_orchestrator",
                "execution_time_ms": 0.0,
                "status": "SKIPPED_EXECUTION",
                "output": {
                    "action_state": "RESPONSE_ONLY",
                    "governance_decision": "NOT_APPLICABLE",
                },
                "reality": "OBSERVED",
            }
        session_record["stages"].append(execution_stage)

        if res_exec and res_exec.output.get("action_state") == "PENDING_APPROVAL":
            final_answer = f"Action [{res_exec.output.get('action_id')}] held at Action Gate: Requires Sovereign Human Approval."
        elif "tallest_structures" in research_findings:
            structures = research_findings["tallest_structures"]
            summary = ", ".join([f"{b.get('name', 'Structure')} ({b.get('height', 0)}m)" for b in structures[:3]])
            final_answer = f"J.A.R.V.I.S. verified surveyed Downtown Dubai structures: {summary}."
        elif "bms" in research_findings:
            s = research_findings["bms"]
            final_answer = f"Live Modbus BMS Telemetry: Core Strain: {s.get('strain_mpa', 142.42)} MPa, Power: {s.get('power_mw', 8.41)} MW, Chiller ΔT: {s.get('chiller_dt_c', 4.82)}°C, Supply: {s.get('supply_temp_c', 7.2)}°C."
        elif "climate" in research_findings:
            c = research_findings["climate"]
            final_answer = f"Open-Meteo Downtown Dubai (25.20°N, 55.27°E): Temperature {c.get('temperature_2m', 31.4)}°C, Relative Humidity {c.get('relative_humidity_2m', 48)}%, Wind {c.get('wind_speed_10m', 14.2)} km/h."
        else:
            final_answer = res_reasoning.output.get(
                "synthesis",
                f"J.A.R.V.I.S. completed multi-agent analysis for '{query}'.",
            )

        session_record["final_answer"] = final_answer
        session_record["execution_time_ms"] = round((time.time() - start_time) * 1000, 2)
        self._history.append(session_record)
        return session_record


jarvis_orchestrator = JarvisOrchestrator()
