import datetime
import json
import os
import sys
import unittest
from unittest.mock import patch

PLUGIN_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "executas", "ai-proposal-writer-anna")
)
if PLUGIN_DIR not in sys.path:
    sys.path.insert(0, PLUGIN_DIR)

import ai_proposal_writer_anna_plugin as plugin

REAL_DATE = datetime.date


class FakeDate(REAL_DATE):
    _today = REAL_DATE(2026, 10, 12)

    @classmethod
    def today(cls):
        return cls._today

    @classmethod
    def set_today(cls, y, m, d):
        cls._today = REAL_DATE(y, m, d)


class TestProposalDateGeneration(unittest.TestCase):
    def setUp(self):
        FakeDate.set_today(2026, 10, 12)
        self.sample_form = {
            "step1": {
                "agencyName": "Aetherion Labs",
                "agencyTagline": "Elite Engineering",
                "clientName": "Alice Johnson",
                "clientCompany": "Acme Corp",
                "projectName": "Cloud Migration",
                "projectType": "Custom Software",
                "industry": "Fintech",
                "problemStatement": "Legacy monolithic application needs modernization.",
            },
            "step2": {
                "keyFeatures": "Microservices\nGraphQL API\nOAuth2",
                "technicalRequirements": ["Python", "React", "Docker"],
                "targetUsers": "Internal staff",
                "constraints": "Strict compliance",
            },
            "step3": {
                "complexity": "standard",
                "budgetRange": "₹2,50,000 – ₹5,00,000",
                "paymentMilestone": "40-30-30",
                "advancePercent": 40,
                "revisions": 3,
                "warrantyPeriod": "3 Months",
                "additionalServices": ["Cloud Architecture"],
            },
            "step4": {
                "tone": "professional",
                "language": "English",
                "includedSections": [
                    "Executive Summary",
                    "Scope of Work",
                    "Timeline & Milestones",
                    "Investment & Pricing",
                ],
                "specialEmphasis": "High reliability",
            },
        }

    def test_a_current_generation_date_with_mocked_clock(self):
        """Test A: Freeze or mock clock to known date, assert generation date corresponds to that date."""
        FakeDate.set_today(2026, 10, 12)
        with patch.object(plugin.datetime, "date", FakeDate):
            raw_proposal = {
                "title": "Cloud Migration",
                "sections": [{"title": "Scope", "content": "Details"}],
            }
            proposal = plugin.normalize_proposal(raw_proposal, self.sample_form)

            self.assertEqual(proposal["generatedDate"], "2026-10-12")
            self.assertEqual(proposal["validUntil"], "2026-11-11")

    def test_b_validity_date_calculation_and_non_expired(self):
        """Test B: Assert validity date is calculated as today + 30 days and not expired."""
        FakeDate.set_today(2026, 10, 12)
        with patch.object(plugin.datetime, "date", FakeDate):
            proposal = plugin.normalize_proposal({}, self.sample_form)
            gen = REAL_DATE.fromisoformat(proposal["generatedDate"])
            valid = REAL_DATE.fromisoformat(proposal["validUntil"])

            delta = (valid - gen).days
            self.assertEqual(delta, 30, "Validity period must be exactly 30 days")
            self.assertGreater(valid, gen, "validUntil must be strictly after generatedDate")
            self.assertGreaterEqual(valid, FakeDate.today(), "Proposal must not be expired at creation")

    def test_c_date_formatting_and_iso_representation(self):
        """Test C: ISO 8601 YYYY-MM-DD formatting with leading zeros for single-digit months/days."""
        test_dates = [
            ((2026, 1, 5), "2026-01-05", "2026-02-04"),
            ((2026, 9, 30), "2026-09-30", "2026-10-30"),
            ((2026, 12, 31), "2026-12-31", "2027-01-30"),
        ]
        for (y, m, d), expected_gen, expected_valid in test_dates:
            FakeDate.set_today(y, m, d)
            with patch.object(plugin.datetime, "date", FakeDate):
                proposal = plugin.normalize_proposal({}, self.sample_form)
                self.assertEqual(proposal["generatedDate"], expected_gen)
                self.assertEqual(proposal["validUntil"], expected_valid)

    def test_d_persistence_serialization(self):
        """Test D: Serializing to JSON and deserializing preserves dates precisely."""
        FakeDate.set_today(2026, 10, 12)
        with patch.object(plugin.datetime, "date", FakeDate):
            proposal = plugin.normalize_proposal({}, self.sample_form)
            serialized = json.dumps(proposal)
            loaded = json.loads(serialized)

            self.assertEqual(loaded["generatedDate"], "2026-10-12")
            self.assertEqual(loaded["validUntil"], "2026-11-11")

    def test_e_edit_and_regeneration_preserves_dates(self):
        """Test E: Section regeneration does not alter proposal generation or validity dates."""
        FakeDate.set_today(2026, 10, 12)
        with patch.object(plugin.datetime, "date", FakeDate):
            proposal = plugin.normalize_proposal({}, self.sample_form)
            orig_gen = proposal["generatedDate"]
            orig_valid = proposal["validUntil"]

            # Advance clock by 5 days
            FakeDate.set_today(2026, 10, 17)

            # Call handle_regenerate_section
            args = {
                "formData": self.sample_form,
                "sectionTitle": "Scope of Work",
                "currentContent": "Old content",
            }
            res = plugin.handle_regenerate_section(args, {})
            self.assertTrue(res.get("success"))
            self.assertIn("section", res.get("data", {}))

            # Proposal itself was not mutated
            self.assertEqual(proposal["generatedDate"], orig_gen)
            self.assertEqual(proposal["validUntil"], orig_valid)

    def test_f_llm_hallucination_override(self):
        """Test F: Discard stale hallucinated LLM dates (e.g. 2023-10-27 and 2023-11-27)."""
        FakeDate.set_today(2026, 10, 12)
        with patch.object(plugin.datetime, "date", FakeDate):
            hallucinated_raw = {
                "title": "Cloud Migration",
                "generatedDate": "2023-10-27",
                "validUntil": "2023-11-27",
                "sections": [{"id": "s1", "title": "Scope", "content": "Text"}],
            }

            proposal = plugin.normalize_proposal(hallucinated_raw, self.sample_form)

            self.assertEqual(
                proposal["generatedDate"],
                "2026-10-12",
                "Must override stale LLM date with current date",
            )
            self.assertEqual(
                proposal["validUntil"],
                "2026-11-11",
                "Must override stale LLM validUntil date with current + 30 days",
            )

    def test_g_prompt_includes_current_date_context(self):
        """Test G: build_proposal_prompt includes real date context in LLM prompt."""
        FakeDate.set_today(2026, 10, 12)
        with patch.object(plugin.datetime, "date", FakeDate):
            prompt = plugin.build_proposal_prompt(self.sample_form)
            self.assertIn("PROPOSAL DATE: 2026-10-12", prompt)
            self.assertIn("VALID UNTIL: 2026-11-11", prompt)
            self.assertIn('"generatedDate": "2026-10-12"', prompt)
            self.assertIn('"validUntil": "2026-11-11"', prompt)


if __name__ == "__main__":
    unittest.main()
