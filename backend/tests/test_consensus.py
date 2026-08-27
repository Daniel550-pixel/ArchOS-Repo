import unittest

from agents.consensus import (
    Agreement,
    ConflictType,
    LaneAssessment,
    Resolution,
    build_consensus_artifact,
)


class ConsensusArtifactTests(unittest.TestCase):
    def test_single_lane_degrades_to_verification(self):
        artifact = build_consensus_artifact(
            task_id="task-1",
            decision_id="decision-1",
            claim="A claim",
            lane_results=[
                LaneAssessment("baseline", "SUCCESS", "A", 0.9),
                LaneAssessment("claude", "UNCONFIGURED", "", 0.0),
                LaneAssessment("ox", "UNCONFIGURED", "", 0.0),
            ],
        )
        self.assertEqual(artifact.claims[0].agreement, Agreement.ABSTAINED)
        self.assertEqual(artifact.resolution, Resolution.VERIFICATION_REQUIRED)

    def test_divergent_lanes_create_conflict(self):
        artifact = build_consensus_artifact(
            task_id="task-2",
            decision_id="decision-2",
            claim="A claim",
            lane_results=[
                LaneAssessment("baseline", "SUCCESS", "A", 0.9),
                LaneAssessment("claude", "SUCCESS", "B", 0.8),
                LaneAssessment("ox", "SUCCESS", "A", 0.9),
            ],
        )
        self.assertEqual(artifact.claims[0].agreement, Agreement.MAJORITY)
        self.assertEqual(artifact.resolution, Resolution.VERIFICATION_REQUIRED)
        self.assertTrue(artifact.claims[0].conflicts)
        self.assertEqual(artifact.claims[0].conflicts[0].conflict_type, ConflictType.INTERPRETIVE)

    def test_unanimous_lanes_are_not_marked_verified(self):
        artifact = build_consensus_artifact(
            task_id="task-3",
            decision_id="decision-3",
            claim="A claim",
            lane_results=[
                LaneAssessment("baseline", "SUCCESS", "A", 0.9),
                LaneAssessment("claude", "SUCCESS", "A", 0.9),
                LaneAssessment("ox", "SUCCESS", "A", 0.9),
            ],
        )
        self.assertEqual(artifact.claims[0].agreement, Agreement.UNANIMOUS)
        self.assertEqual(artifact.resolution, Resolution.CONSENSUS)


if __name__ == "__main__":
    unittest.main()
