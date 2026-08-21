"""Comprehensive Unit Tests for ArchOS Phase 4 Specialist Intelligence & Governed Execution."""
import unittest
import asyncio
from backend.agents.base import AgentTask, RealityLevel, RiskLevel
from backend.agents.specialists import (
    PerceptionAgent,
    WorldModelAgent,
    ResearchAgent,
    ReasoningAgent,
    PlanningAgent,
    RiskAgent,
    VerificationAgent,
    ExecutionAgent
)
from backend.agents.swarm import swarm
from backend.agents.action_gate import action_gate
from backend.agents.jarvis_orchestrator import jarvis_orchestrator
from backend.core.abac import evaluate_access, Subject, Resource, Action, Environment

class TestSpecialistIntelligence(unittest.IsolatedAsyncioTestCase):
    async def test_specialist_agents_registration(self):
        self.assertEqual(len(swarm.agents), 8)
        self.assertIsNotNone(swarm.get_agent("perception"))
        self.assertIsNotNone(swarm.get_agent("world_model"))
        self.assertIsNotNone(swarm.get_agent("research"))
        self.assertIsNotNone(swarm.get_agent("reasoning"))
        self.assertIsNotNone(swarm.get_agent("planning"))
        self.assertIsNotNone(swarm.get_agent("risk"))
        self.assertIsNotNone(swarm.get_agent("verification"))
        self.assertIsNotNone(swarm.get_agent("execution"))

    async def test_perception_agent_disambiguation(self):
        agent = PerceptionAgent()
        task = AgentTask(
            task_id="t-1",
            intent="What is the height of Burj Khalifa in Downtown Dubai?",
            payload={"query": "What is the height of Burj Khalifa in Downtown Dubai?"}
        )
        res = await agent.execute(task)
        self.assertEqual(res.status, "SUCCESS")
        self.assertIn("detected_entities", res.output)
        self.assertFalse(res.output["is_action_intent"])

    async def test_action_gate_consequential_protection(self):
        # A consequential action should require approval
        task = AgentTask(
            task_id="t-2",
            intent="SET_CHILLER_SETPOINT",
            payload={
                "is_action_intent": True,
                "risk_level": "CONSEQUENTIAL",
                "plan": {"steps": [{"step_id": "s1"}]}
            }
        )
        exec_agent = ExecutionAgent()
        res = await exec_agent.execute(task)
        self.assertEqual(res.status, "SUCCESS")
        self.assertEqual(res.output.get("action_state"), "PENDING_APPROVAL")
        self.assertIn("action_id", res.output)

        action_id = res.output["action_id"]
        self.assertTrue(len(action_gate.get_pending()) > 0)

        # Approve action
        approved = await action_gate.approve(action_id, approver="chief_engineer")
        self.assertTrue(approved)
        self.assertEqual(len(action_gate.get_pending()), 0)

    async def test_abac_fail_closed(self):
        sub = Subject(id="guest", role="ANONYMOUS", clearance=0)
        res = Resource(id="bms_actuator", type="CRITICAL_INFRASTRUCTURE", sensitivity=5)
        act = Action(type="WRITE", is_consequential=True)
        env = Environment(threat_level="DEFCON_1")

        decision = evaluate_access(sub, res, act, env)
        self.assertFalse(decision.allowed)
        self.assertEqual(decision.reason, "Denied by default (fail-closed ABAC)")

    async def test_jarvis_10_stage_orchestration(self):
        session = await jarvis_orchestrator.orchestrate(
            query="Survey Downtown Dubai heights and report telemetry",
            actor="operator",
            tenant_id="uae-sovereign"
        )
        self.assertIn("stages", session)
        self.assertTrue(len(session["stages"]) >= 8)
        self.assertEqual(session["verification_status"], "VERIFIED")
        self.assertIn("J.A.R.V.I.S.", session["final_answer"])

if __name__ == "__main__":
    unittest.main()
