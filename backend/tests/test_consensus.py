import unittest

from backend.agents.consensus_contracts import (
    AgreementState,
    CanonicalPosition,
    LaneResult,
    LaneStatus,
    PanelState,
    ResolutionState,
)
from backend.agents.consensus_engine import build_consensus


class ConsensusEngineTests(unittest.TestCase):
    def lane(self, lane_id, position, *, status=LaneStatus.SUCCESS, evidence=True):
        from backend.agents.consensus_contracts import EvidenceRef

        return LaneResult(
            lane_id=lane_id,
            position=position,
            status=status,
            confidence=0.9 if status is LaneStatus.SUCCESS else 0.0,
            rationale="independent rationale",
            evidence=(EvidenceRef(source=f"{lane_id}:source", claim="supporting evidence"),) if evidence else (),
        )

    def test_single_successful_lane_is_insufficient_and_requires_verification(self):
        artifact = build_consensus(
            "task-1",
            "decision-1",
            [
                self.lane("baseline", CanonicalPosition.AFFIRM),
                self.lane("claude", None, status=LaneStatus.ERROR, evidence=False),
                self.lane("ox", None, status=LaneStatus.TIMEOUT, evidence=False),
            ],
        )
        self.assertEqual(artifact.panel_state, PanelState.INSUFFICIENT)
        self.assertEqual(artifact.agreement, AgreementState.UNANIMOUS)
        self.assertEqual(artifact.resolution, ResolutionState.VERIFICATION_REQUIRED)
        self.assertEqual(artifact.selected_position, CanonicalPosition.AFFIRM)

    def test_unanimous_full_panel_with_evidence_is_consensus(self):
        artifact = build_consensus(
            "task-2",
            "decision-2",
            [
                self.lane("baseline", CanonicalPosition.AFFIRM),
                self.lane("claude", CanonicalPosition.AFFIRM),
                self.lane("ox", CanonicalPosition.AFFIRM),
            ],
        )
        self.assertEqual(artifact.panel_state, PanelState.FULL)
        self.assertEqual(artifact.agreement, AgreementState.UNANIMOUS)
        self.assertEqual(artifact.resolution, ResolutionState.CONSENSUS)
        self.assertEqual(artifact.agreement_score, 1.0)

    def test_majority_requires_verification(self):
        artifact = build_consensus(
            "task-3",
            "decision-3",
            [
                self.lane("baseline", CanonicalPosition.AFFIRM),
                self.lane("claude", CanonicalPosition.AFFIRM),
                self.lane("ox", CanonicalPosition.NEGATE),
            ],
        )
        self.assertEqual(artifact.agreement, AgreementState.MAJORITY)
        self.assertEqual(artifact.resolution, ResolutionState.VERIFICATION_REQUIRED)
        self.assertEqual(artifact.proposed_position, CanonicalPosition.AFFIRM)
        self.assertEqual(artifact.selected_position, CanonicalPosition.AFFIRM)
        self.assertTrue(artifact.conflicts)

    def test_high_impact_never_selects_a_model_position(self):
        artifact = build_consensus(
            "task-4",
            "decision-4",
            [
                self.lane("baseline", CanonicalPosition.AFFIRM),
                self.lane("claude", CanonicalPosition.AFFIRM),
                self.lane("ox", CanonicalPosition.AFFIRM),
            ],
            high_impact=True,
        )
        self.assertEqual(artifact.resolution, ResolutionState.HUMAN_REVIEW_REQUIRED)
        self.assertEqual(artifact.selected_position, None)
        self.assertEqual(artifact.proposed_position, CanonicalPosition.AFFIRM)

    def test_failed_lanes_never_become_votes(self):
        artifact = build_consensus(
            "task-5",
            "decision-5",
            [
                self.lane("baseline", CanonicalPosition.AFFIRM),
                self.lane("claude", CanonicalPosition.NEGATE, status=LaneStatus.ERROR, evidence=False),
                self.lane("ox", CanonicalPosition.NEGATE, status=LaneStatus.TIMEOUT, evidence=False),
            ],
        )
        self.assertEqual(artifact.panel_state, PanelState.INSUFFICIENT)
        self.assertEqual(artifact.proposed_position, CanonicalPosition.AFFIRM)
        self.assertEqual(artifact.agreement_score, 1.0)


if __name__ == "__main__":
    unittest.main()
