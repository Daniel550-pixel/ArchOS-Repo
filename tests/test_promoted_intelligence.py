import unittest

from backend.agents.base import RealityLevel
from backend.intelligence.financial_intelligence import FinancialObservation, assess_market, aggregate_confidence
from backend.intelligence.jarvis_financial_adapter import normalize_jarvis_decision


class TestPromotedIntelligence(unittest.TestCase):
    def test_financial_assessment_is_bounded_and_provenance_aware(self):
        result = assess_market([FinancialObservation("TEST", 100.0, 0.2, 1000, "UP", "finsight")])[0]
        self.assertEqual(result.signal, "LONG_BIAS")
        self.assertTrue(0.0 <= result.confidence <= 1.0)
        self.assertTrue(0.0 <= result.risk <= 1.0)
        self.assertEqual(result.provenance, ("finsight",))
        self.assertTrue(0.0 <= aggregate_confidence([result]) <= 1.0)

    def test_external_jarvis_can_never_become_execution_authority(self):
        result = normalize_jarvis_decision("fgse-jarvis", "task-1", {"status": "EXECUTE", "confidence": 0.9, "risk": 0.1, "action": "LONG"})
        self.assertEqual(result.status, "EXECUTE")
        self.assertEqual(result.reality, RealityLevel.INFERRED)
        self.assertIn("execution_authority_retained_by_archos", result.evidence)


if __name__ == "__main__":
    unittest.main()

