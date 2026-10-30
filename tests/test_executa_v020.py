#!/usr/bin/env python3
"""Comprehensive test suite for AI Proposal Writer Executa plugin v0.2.0.

Tests ping, generate_proposal, regenerate_section, audit_proposal,
refine_text, and extract_brief methods in both direct invoke mode
and JSON-RPC protocol mode.
"""

import datetime
import json
import os
import sys
import unittest

PLUGIN_PATH = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "../executas/ai-proposal-writer-anna/ai_proposal_writer_anna_plugin.py",
    )
)
sys.path.insert(0, os.path.dirname(PLUGIN_PATH))

import ai_proposal_writer_anna_plugin as plugin


class TestExecutaV020(unittest.TestCase):
    def test_version_and_manifest(self):
        self.assertEqual(plugin.MANIFEST["version"], "0.4.0")
        tool_names = [t["name"] for t in plugin.MANIFEST["tools"]]
        self.assertIn("ping", tool_names)
        self.assertIn("generate_proposal", tool_names)
        self.assertIn("regenerate_section", tool_names)
        self.assertIn("audit_proposal", tool_names)
        self.assertIn("refine_text", tool_names)
        self.assertIn("extract_brief", tool_names)
        self.assertIn("compare_versions", tool_names)
        self.assertIn("calculate_roi", tool_names)
        self.assertIn("analyze_deal_health", tool_names)
        self.assertIn("scan_contract_risks", tool_names)
        self.assertIn("generate_discovery_questions", tool_names)

    def test_ping(self):
        res = plugin.invoke("ping", {}, {})
        self.assertTrue(res.get("success"))
        self.assertTrue(res.get("data", {}).get("pong"))

    def test_generate_proposal_dates_and_structure(self):
        form_data = {
            "step1": {
                "agencyName": "Aetherion Labs",
                "clientName": "Test Client",
                "clientCompany": "Acme Inc",
                "projectName": "Cloud Portal",
                "projectType": "Web Development",
                "industry": "Technology",
                "problemStatement": "Acme Inc requires modern customer portal.",
            },
            "step2": {
                "keyFeatures": "Feature A\nFeature B",
                "technicalRequirements": ["React", "Python"],
                "targetUsers": "Customers",
            },
            "step3": {
                "budgetRange": "$20,000",
                "complexity": "standard",
                "advancePercent": 40,
                "revisions": 3,
                "warrantyPeriod": "3 Months",
                "paymentMilestone": "40-30-30",
            },
            "step4": {
                "tone": "professional",
                "language": "English",
                "includedSections": plugin.DEFAULT_INCLUDED_SECTIONS,
            },
        }

        res = plugin.invoke("generate_proposal", {"formData": form_data}, {})
        self.assertTrue(res.get("success"), f"generate_proposal failed: {res}")
        proposal = res["data"]["proposal"]

        today_iso = datetime.date.today().isoformat()
        expected_valid = (datetime.date.today() + datetime.timedelta(days=30)).isoformat()
        self.assertEqual(proposal["generatedDate"], today_iso)
        self.assertEqual(proposal["validUntil"], expected_valid)
        self.assertEqual(proposal["status"], "draft")
        self.assertTrue(len(proposal["sections"]) >= 6)

    def test_audit_proposal(self):
        mock_proposal = {
            "title": "Cloud Portal Proposal",
            "sections": [
                {"title": "Executive Summary", "content": "Summary of cloud portal project."},
                {"title": "Scope of Work", "content": "- Module 1\n- Module 2\n- Module 3"},
                {"title": "Timeline & Milestones", "content": "## Phase 1: Build (2 weeks)\n- Tasks"},
                {"title": "Investment & Pricing", "content": "| Module | Cost |\n|---|---|\n| Core | $10,000 |"},
                {"title": "Terms & Conditions", "content": "90 days warranty and IP transfer."},
                {"title": "Next Steps", "content": "Sign proposal to initiate kickoff."},
            ],
        }

        res = plugin.invoke("audit_proposal", {"proposal": mock_proposal}, {})
        self.assertTrue(res.get("success"), f"audit_proposal failed: {res}")
        audit = res["data"]["audit"]

        self.assertIsInstance(audit["overallScore"], int)
        self.assertGreaterEqual(audit["overallScore"], 60)
        self.assertIn(audit["grade"], ["A", "B", "C"])
        self.assertIn("completeness", audit["metrics"])
        self.assertIn("pricingIntegrity", audit["metrics"])
        self.assertIsInstance(audit["strengths"], list)
        self.assertIsInstance(audit["actionableRecommendations"], list)

    def test_refine_text(self):
        sample_text = "We will make a website for your company. It will be fast and good."

        for instruction in ["improve_tone", "make_concise", "expand_details", "simplify", "add_risks"]:
            res = plugin.invoke("refine_text", {"text": sample_text, "instruction": instruction}, {})
            self.assertTrue(res.get("success"), f"refine_text failed for {instruction}: {res}")
            refined = res["data"]["refinedText"]
            self.assertTrue(len(refined) > 0)
            if instruction == "add_risks":
                self.assertIn("Risk Management", refined)
            elif instruction == "improve_tone":
                self.assertIn("Professional", refined)

    def test_extract_brief(self):
        brief_text = (
            "Hi there! This is Dr. Marcus Vance from BioHealth Labs.\n"
            "We are looking for a team to build our Clinical Trial Dashboard.\n"
            "Our challenge is managing clinical data in spreadsheets.\n"
            "We need:\n"
            "- Patient recruitment tracking\n"
            "- Adverse event alert system\n"
            "- Exportable regulatory PDF reports\n"
            "Budget is around $35,000 with a 60-day launch timeline."
        )

        res = plugin.invoke("extract_brief", {"briefText": brief_text}, {})
        self.assertTrue(res.get("success"), f"extract_brief failed: {res}")
        data = res["data"]["extractedData"]

        self.assertIn("Marcus Vance", data.get("clientName", ""))
        self.assertIn("BioHealth", data.get("clientCompany", ""))
        self.assertIn("Clinical Trial Dashboard", data.get("projectName", ""))
        self.assertIn("$35,000", data.get("budgetRange", ""))
        self.assertTrue(len(data.get("keyFeatures", "")) > 10)

    def test_compare_versions(self):
        v_a = {
            "totalValue": "$15,000",
            "sections": [
                {"title": "Scope of Work", "content": "Baseline"},
                {"title": "Pricing", "content": "$15k"},
            ],
        }
        v_b = {
            "totalValue": "$22,000",
            "sections": [
                {"title": "Scope of Work", "content": "Expanded"},
                {"title": "Pricing", "content": "$22k"},
                {"title": "Security & SOC2", "content": "Added compliance"},
            ],
        }
        res = plugin.invoke("compare_versions", {"versionA": v_a, "versionB": v_b}, {})
        self.assertTrue(res.get("success"), f"compare_versions failed: {res}")
        comp = res["data"]["comparison"]
        self.assertEqual(comp.get("valA"), "$15,000")
        self.assertEqual(comp.get("valB"), "$22,000")
        self.assertIn("Security & SOC2", comp.get("addedSections", []))

    def test_calculate_roi(self):
        res = plugin.invoke("calculate_roi", {"budget": 25000, "hoursSavedPerMonth": 60, "hourlyRate": 80}, {})
        self.assertTrue(res.get("success"), f"calculate_roi failed: {res}")
        roi = res["data"]["roi"]
        self.assertEqual(roi["monthlyCostSavings"], 4800.0)
        self.assertEqual(roi["annualCostSavings"], 57600.0)
        self.assertTrue(roi["paybackMonths"] > 0)
        self.assertTrue(roi["threeYearNetRoi"] > 0)

    def test_analyze_deal_health(self):
        sample_prop = {
            "sections": [
                {"title": "Executive Summary", "content": "Overview"},
                {"title": "Scope", "content": "Deliverables"},
                {"title": "Architecture", "content": "Cloud APIs"},
                {"title": "Milestones", "content": "Sprints"},
                {"title": "Pricing", "content": "Itemized"},
                {"title": "Terms", "content": "90 day warranty included"},
            ],
            "pricingStructure": {"depositPercent": 40},
        }
        res = plugin.invoke("analyze_deal_health", {"proposal": sample_prop}, {})
        self.assertTrue(res.get("success"), f"analyze_deal_health failed: {res}")
        health = res["data"]["dealHealth"]
        self.assertGreaterEqual(health["winProbability"], 40)
        self.assertIn("factors", health)
        self.assertIn("recommendations", health)

    def test_scan_contract_risks(self):
        sample_prop = {
            "sections": [
                {"title": "Scope", "content": "Build web and mobile app for client."},
                {"title": "Pricing", "content": "Full payment at completion."},
            ],
        }
        res = plugin.invoke("scan_contract_risks", {"proposal": sample_prop}, {})
        self.assertTrue(res.get("success"), f"scan_contract_risks failed: {res}")
        report = res["data"]["riskReport"]
        self.assertIn(report["overallRiskLevel"], ["low", "moderate", "high"])
        self.assertTrue(len(report["risks"]) > 0)
        self.assertTrue(any(r["category"] == "Scope Creep" for r in report["risks"]))

    def test_generate_discovery_questions(self):
        form_data = {
            "step1": {
                "projectName": "FinTech Core Platform",
                "projectType": "Full-Stack App",
            }
        }
        res = plugin.invoke("generate_discovery_questions", {"formData": form_data}, {})
        self.assertTrue(res.get("success"), f"generate_discovery_questions failed: {res}")
        questions = res["data"]["questions"]
        self.assertEqual(len(questions), 5)
        self.assertTrue(any("KPI" in q["question"] for q in questions))


if __name__ == "__main__":
    unittest.main()
