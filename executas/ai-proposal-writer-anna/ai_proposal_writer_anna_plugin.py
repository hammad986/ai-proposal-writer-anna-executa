"""Executa plugin for AI Proposal Writer Anna App.

Implements JSON-RPC 2.0 over stdio with reverse-RPC LLM sampling,
structured prompt construction, robust JSON extraction, and
intelligent fallback synthesis for local dev environments.
"""

from __future__ import annotations

import datetime
import json
import queue
import re
import sys
import threading
import time
import uuid
from typing import Any

MANIFEST = {
    "display_name": "AI Proposal Writer Tool",
    "version": "0.2.0",
    "description": "JSON-RPC tool plugin powering AI Proposal Writer with proposal generation, section regeneration, quality audit, text refinement, and LLM sampling.",
    "host_capabilities": ["llm.sample"],
    "tools": [
        {
            "name": "ping",
            "description": "Smoke-test method.",
            "parameters": [],
        },
        {
            "name": "generate_proposal",
            "description": "Generate a complete structured project proposal from input form data.",
            "parameters": [
                {
                    "name": "formData",
                    "type": "object",
                    "description": "Proposal form data containing steps 1 to 4.",
                    "required": True,
                }
            ],
        },
        {
            "name": "regenerate_section",
            "description": "Regenerate a specific section of a proposal using AI.",
            "parameters": [
                {
                    "name": "formData",
                    "type": "object",
                    "description": "Proposal form data.",
                    "required": True,
                },
                {
                    "name": "sectionTitle",
                    "type": "string",
                    "description": "Title of the section to regenerate.",
                    "required": True,
                },
                {
                    "name": "currentContent",
                    "type": "string",
                    "description": "Current section content for context.",
                    "required": False,
                },
                {
                    "name": "instruction",
                    "type": "string",
                    "description": "Specific user instructions for how to rewrite the section.",
                    "required": False,
                },
            ],
        },
        {
            "name": "audit_proposal",
            "description": "Conduct a comprehensive AI Quality Assurance audit of a proposal, scoring completeness, pricing math, risk coverage, and clarity.",
            "parameters": [
                {
                    "name": "proposal",
                    "type": "object",
                    "description": "Complete proposal object to evaluate.",
                    "required": True,
                }
            ],
        },
        {
            "name": "refine_text",
            "description": "Refine or rewrite proposal text with a specific instruction (improve tone, make concise, expand technical details, simplify, add risks).",
            "parameters": [
                {
                    "name": "text",
                    "type": "string",
                    "description": "Original text to refine.",
                    "required": True,
                },
                {
                    "name": "instruction",
                    "type": "string",
                    "description": "Instruction: 'improve_tone' | 'make_concise' | 'expand_details' | 'simplify' | 'add_risks'.",
                    "required": True,
                },
                {
                    "name": "context",
                    "type": "string",
                    "description": "Optional context such as proposal title or client company.",
                    "required": False,
                },
            ],
        },
        {
            "name": "extract_brief",
            "description": "Extract structured proposal fields (client, project, problem, features, budget) from unstructured client RFP or brief text.",
            "parameters": [
                {
                    "name": "briefText",
                    "type": "string",
                    "description": "Raw project brief, email, or RFP text.",
                    "required": True,
                }
            ],
        },
    ],
}


DEFAULT_INCLUDED_SECTIONS = [
    "Executive Summary",
    "Understanding of Requirements",
    "Scope of Work",
    "Technical Approach",
    "Timeline & Milestones",
    "Investment & Pricing",
    "Terms & Conditions",
    "Next Steps",
]

COMPLEXITY_TIMELINE = {
    "simple": "1-2 weeks",
    "standard": "3-6 weeks",
    "complex": "2-3 months",
    "enterprise": "3+ months",
}

# Concurrency queues for bidirectional RPC
agent_requests: queue.Queue[dict[str, Any]] = queue.Queue()
host_responses: dict[str, queue.Queue[dict[str, Any]]] = {}
responses_lock = threading.Lock()
stdout_lock = threading.Lock()


def send_json(obj: dict[str, Any]) -> None:
    line = json.dumps(obj) + "\n"
    with stdout_lock:
        sys.stdout.write(line)
        sys.stdout.flush()


def stdin_reader() -> None:
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            msg = json.loads(line)
        except Exception:
            continue

        if "method" in msg:
            # Incoming host request to this plugin
            agent_requests.put(msg)
        elif "id" in msg:
            # Response to our reverse-RPC call
            req_id = str(msg["id"])
            with responses_lock:
                q = host_responses.get(req_id)
            if q is not None:
                q.put(msg)
    # Signal EOF to main loop
    agent_requests.put(None)


def sample_llm(
    prompt: str,
    invoke_id: str | None = None,
    max_tokens: int = 4096,
    timeout_s: float = 65.0,
) -> str:
    """Request host LLM completion via reverse JSON-RPC sampling/createMessage."""
    req_id = str(uuid.uuid4())
    resp_queue: queue.Queue[dict[str, Any]] = queue.Queue()
    with responses_lock:
        host_responses[req_id] = resp_queue

    reverse_rpc = {
        "jsonrpc": "2.0",
        "id": req_id,
        "method": "sampling/createMessage",
        "params": {
            "messages": [
                {
                    "role": "user",
                    "content": {"type": "text", "text": prompt},
                }
            ],
            "maxTokens": max_tokens,
            "systemPrompt": "You are an expert proposal writer for software engineering agencies. Always output strictly valid JSON matching the requested schema.",
            "temperature": 0.7,
            "responseFormat": {"type": "json_object"},
            "onUnsupported": "json_object",
            "includeContext": "none",
            "metadata": {"executa_invoke_id": invoke_id} if invoke_id else {},
        },
    }

    try:
        send_json(reverse_rpc)
        resp = resp_queue.get(timeout=timeout_s)
        if "error" in resp:
            err = resp["error"]
            err_msg = err.get("message", str(err)) if isinstance(err, dict) else str(err)
            raise RuntimeError(f"Host sampling error: {err_msg}")

        result = resp.get("result", {})
        content = result.get("content", {})
        text = content.get("text", "")
        if not text:
            raise RuntimeError("Empty response from host sampling")
        return text
    finally:
        with responses_lock:
            host_responses.pop(req_id, None)


def build_proposal_prompt(form_data: dict[str, Any]) -> str:
    step1 = form_data.get("step1", {})
    step2 = form_data.get("step2", {})
    step3 = form_data.get("step3", {})
    step4 = form_data.get("step4", {})

    agency_name = step1.get("agencyName") or "Our Agency"
    agency_tagline = step1.get("agencyTagline") or "Full-Stack Software Agency"
    client_name = step1.get("clientName") or "Client"
    client_company = step1.get("clientCompany") or "Client Company"
    project_name = step1.get("projectName") or "Software Project"
    project_type = step1.get("projectType") or "Web Development"
    industry = step1.get("industry") or "Technology"
    problem = step1.get("problemStatement") or "Development of custom software solution."

    raw_features = step2.get("keyFeatures") or ""
    features_lines = [
        f"{idx + 1}. {f.strip()}"
        for idx, f in enumerate(raw_features.split("\n"))
        if f.strip()
    ]
    features_formatted = "\n".join(features_lines) or "1. Core application development and deployment"

    tech_reqs = ", ".join(step2.get("technicalRequirements") or ["Responsive Web App"])
    target_users = step2.get("targetUsers") or "General users and team administrators"
    constraints = step2.get("constraints") or "None specified"
    budget_range = step3.get("budgetRange") or "Standard Project Budget"
    complexity = step3.get("complexity") or "standard"
    timeline_approx = COMPLEXITY_TIMELINE.get(complexity, "4-6 weeks")
    payment = step3.get("paymentMilestone") or "40-30-30"
    advance = step3.get("advancePercent", 40)
    revisions = step3.get("revisions", 3)
    warranty = step3.get("warrantyPeriod") or "3 Months"
    additional = ", ".join(step3.get("additionalServices") or [])
    tone = step4.get("tone") or "professional"
    language = step4.get("language") or "English"
    sections_list = step4.get("includedSections") or DEFAULT_INCLUDED_SECTIONS
    special_emphasis = step4.get("specialEmphasis") or ""

    today_str = datetime.date.today().isoformat()
    valid_until_str = (datetime.date.today() + datetime.timedelta(days=30)).isoformat()

    return f"""You are an expert proposal writer for a software development agency called {agency_name}.
Your proposals are professional, persuasive, and client-focused.
You always personalize proposals using the client's name and company.
You are generating a proposal in {tone} tone in {language} language.

Generate a complete project proposal with the following specifications:

AGENCY: {agency_name} - {agency_tagline}
CLIENT: {client_name} at {client_company}
PROJECT: {project_name} ({project_type} for {industry} industry)
PROBLEM: {problem}

PROPOSAL DATE: {today_str}
VALID UNTIL: {valid_until_str} (30 days validity)

REQUIREMENTS:
{features_formatted}

TECHNICAL REQUIREMENTS: {tech_reqs}
TARGET USERS: {target_users}
CONSTRAINTS: {constraints}

BUDGET: {budget_range}
COMPLEXITY: {complexity} (approx {timeline_approx})
PAYMENT: {payment} with {advance}% advance
REVISIONS: {revisions} revisions included
WARRANTY: {warranty} post-delivery support
ADDITIONAL SERVICES: {additional}

TONE: {tone}
LANGUAGE: {language}

Generate ONLY the following sections: {", ".join(sections_list)}
SPECIAL EMPHASIS: {special_emphasis}

CRITICAL INSTRUCTIONS:
- Use the client's name ({client_name}) throughout for personalization
- Be specific; use actual project details, not generic placeholders
- Pricing section MUST have an itemized breakdown table matching the budget range
- Timeline section MUST have clearly named phases with durations
- Each section should be 2-5 paragraphs or equivalent structured content
- For tables, use pipe-separated markdown: | Header 1 | Header 2 |
- For phases, use this format: ## Phase N: {{name}} ({{duration}})
- Terms must be professional, reasonable, standard freelance/agency terms
- Call to action must include specific next steps
- Use proposal date "{today_str}" and valid until date "{valid_until_str}"

RESPOND WITH A VALID JSON OBJECT ONLY. No markdown code blocks. No preamble. No explanation.
The JSON structure must be EXACTLY:
{{
  "title": "Project Proposal: {project_name}",
  "subtitle": "Prepared for {client_company} by {agency_name}",
  "generatedDate": "{today_str}",
  "validUntil": "{valid_until_str}",
  "totalValue": "{budget_range}",
  "sections": [
    {{
      "id": "snake_case_id",
      "title": "Section Title",
      "type": "text",
      "content": "Full section content as string.",
      "isEdited": false
    }}
  ]
}}"""


def build_section_prompt(
    form_data: dict[str, Any], section_title: str, current_content: str
) -> str:
    base = build_proposal_prompt(form_data)
    return f"""{base}

Regenerate only this section: {section_title}
Current section content for context:
{current_content}

Return the same JSON shape, but with only ONE item in the 'sections' array corresponding to {section_title}."""


def parse_json_response(raw_text: str) -> dict[str, Any]:
    cleaned = raw_text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()

    try:
        return json.loads(cleaned)
    except Exception:
        first = cleaned.find("{")
        last = cleaned.rfind("}")
        if first != -1 and last > first:
            return json.loads(cleaned[first : last + 1])
        raise ValueError("Invalid JSON response from LLM")


def synthesize_fallback_section(
    section_title: str, form_data: dict[str, Any]
) -> dict[str, Any]:
    step1 = form_data.get("step1", {})
    step2 = form_data.get("step2", {})
    step3 = form_data.get("step3", {})
    step4 = form_data.get("step4", {})

    agency = step1.get("agencyName") or "Aetherion Labs"
    client = step1.get("clientName") or "Client"
    company = step1.get("clientCompany") or "Client Co"
    project = step1.get("projectName") or "Custom Application"
    budget = step3.get("budgetRange") or "₹75,000 – ₹2,00,000"
    advance = step3.get("advancePercent", 40)
    warranty = step3.get("warrantyPeriod") or "3 Months"
    revisions = step3.get("revisions", 3)
    features = [
        f.strip() for f in (step2.get("keyFeatures") or "").split("\n") if f.strip()
    ]
    if not features:
        features = ["Modern user interface", "Robust backend architecture", "Secure deployment"]

    tech_reqs = step2.get("technicalRequirements") or ["Web Application", "API Integration"]

    norm_title = section_title.lower()

    if "executive" in norm_title or "summary" in norm_title:
        content = (
            f"This proposal presents a customized engineering and delivery roadmap for {project}, "
            f"tailored specifically for {client} and the team at {company}. "
            f"{agency} will design, develop, and deploy an enterprise-grade solution that addresses "
            f"your immediate business objectives with high reliability, security, and scalability.\n\n"
            f"Our strategy focuses on clear communication, rapid iteration cycles, and end-to-end quality assurance "
            f"to ensure {project} achieves maximum impact upon launch."
        )
        sec_type = "text"
    elif "understanding" in norm_title or "problem" in norm_title or "requirement" in norm_title:
        problem = step1.get("problemStatement") or "Building a scalable, modern software platform."
        content = (
            f"### Business Context & Challenge\n\n"
            f"Based on our initial discussions with {client}, {company} requires an effective solution to address: "
            f"**{problem}**\n\n"
            f"### Key Objectives\n"
            f"- Solve the core operational bottlenecks with automated, intuitive workflows\n"
            f"- Ensure target users experience seamless, responsive performance\n"
            f"- Maintain clean technical architecture supporting long-term business growth"
        )
        sec_type = "text"
    elif "scope" in norm_title or "features" in norm_title:
        items = "\n".join(f"- **{f}**: Comprehensive end-to-end implementation and validation" for f in features)
        content = (
            f"The scope of work for {project} includes the full design, development, and testing of the following core modules:\n\n"
            f"{items}\n\n"
            f"- Integration of required technical capabilities: {', '.join(tech_reqs)}\n"
            f"- Comprehensive cross-browser and mobile responsive testing\n"
            f"- Production deployment and administrator training handover"
        )
        sec_type = "list"
    elif "technical" in norm_title or "approach" in norm_title or "architecture" in norm_title:
        stack = step2.get("preferredTechStack") or "Modern Full-Stack Architecture (React, Node.js, Cloud Services)"
        content = (
            f"### Architectural Foundation\n"
            f"The technical solution for {project} leverages {stack}, selected for high performance, developer productivity, and cost-effective scaling.\n\n"
            f"### Quality & Security Controls\n"
            f"- Modular, maintainable component design adhering to industry standards\n"
            f"- Strict validation, secure credential storage, and data protection practices\n"
            f"- Automated continuous integration and staging environment verification prior to release"
        )
        sec_type = "text"
    elif "timeline" in norm_title or "milestone" in norm_title:
        content = (
            "## Phase 1: Discovery & Architecture (1 week)\n"
            "- Finalize system specifications and UI/UX wireframes\n"
            "- Database schema design and API contract definition\n\n"
            "## Phase 2: Core Engineering & Modules (3-4 weeks)\n"
            "- Implement primary workflows and user-facing views\n"
            "- Integrate business logic and technical requirements\n"
            "- Weekly sprint demonstrations and client feedback checkpoints\n\n"
            "## Phase 3: QA, Security & User Acceptance (1 week)\n"
            "- Comprehensive integration and stress testing\n"
            "- Client acceptance review and refinement cycles\n\n"
            "## Phase 4: Production Deployment & Handover (1 week)\n"
            "- Cloud hosting provisioning, DNS configuration, and live launch\n"
            "- Administrator documentation and operational handover"
        )
        sec_type = "phases"
    elif "pricing" in norm_title or "investment" in norm_title or "budget" in norm_title:
        content = (
            f"The total investment for the complete delivery of {project} is **{budget}**.\n\n"
            f"| Deliverable Item | Description | Allocation |\n"
            f"|---|---|---|\n"
            f"| Discovery & System Architecture | Requirements breakdown, UX flows, system design | 20% |\n"
            f"| Full Application Development | Frontend interface, backend logic, database, APIs | 50% |\n"
            f"| Quality Assurance & Optimization | Performance tuning, security checks, cross-device QA | 15% |\n"
            f"| Production Launch & Training | Cloud deployment, staff walkthrough, documentation | 15% |\n\n"
            f"**Payment Schedule**: {step3.get('paymentMilestone', '40-30-30')} "
            f"({advance}% advance payment upon agreement signing)."
        )
        sec_type = "table"
    elif "terms" in norm_title or "condition" in norm_title:
        content = (
            f"1. **Payment**: {advance}% advance payment is due upon contract execution to commence project kickoff.\n"
            f"2. **Revisions**: This proposal includes up to {revisions} structured rounds of revisions at key milestones.\n"
            f"3. **Warranty Support**: {agency} provides {warranty} of post-launch warranty support covering bug fixes.\n"
            f"4. **Intellectual Property**: Full ownership of custom source code and assets transfers to {company} upon final payment.\n"
            f"5. **Confidentiality**: Both parties agree to protect proprietary data and project information."
        )
        sec_type = "text"
    elif "next" in norm_title or "step" in norm_title or "action" in norm_title:
        content = (
            f"To initiate {project} with {agency}, the recommended next steps are:\n\n"
            f"1. **Review and Approve**: Confirm your acceptance of this proposal structure and scope.\n"
            f"2. **Kickoff Meeting**: Schedule our 45-minute discovery alignment with {client}.\n"
            f"3. **Agreement & Deposit**: Finalize the service agreement and process the {advance}% kickoff deposit.\n"
            f"4. **Commencement**: Sprint 1 begins immediately with architecture setup and initial sprint planning."
        )
        sec_type = "text"
    else:
        content = (
            f"Detailed specifications for {section_title} in relation to {project}. "
            f"{agency} will execute this work according to highest agency quality standards."
        )
        sec_type = "text"

    sec_id = re.sub(r"[^a-z0-9]+", "_", norm_title).strip("_") or "section"
    return {
        "id": sec_id,
        "title": section_title,
        "type": sec_type,
        "content": content,
        "isEdited": False,
    }


def synthesize_fallback_proposal(form_data: dict[str, Any]) -> dict[str, Any]:
    step1 = form_data.get("step1", {})
    step3 = form_data.get("step3", {})
    step4 = form_data.get("step4", {})

    project_name = step1.get("projectName") or "Custom Web System"
    agency_name = step1.get("agencyName") or "Aetherion Labs"
    client_company = step1.get("clientCompany") or "Client Organization"
    budget_range = step3.get("budgetRange") or "₹75,000 – ₹2,00,000"

    today_str = datetime.date.today().isoformat()
    valid_until = (datetime.date.today() + datetime.timedelta(days=30)).isoformat()

    sections_list = step4.get("includedSections") or DEFAULT_INCLUDED_SECTIONS
    sections = [synthesize_fallback_section(st, form_data) for st in sections_list]

    return {
        "title": f"Project Proposal: {project_name}",
        "subtitle": f"Prepared for {client_company} by {agency_name}",
        "generatedDate": today_str,
        "validUntil": valid_until,
        "totalValue": budget_range,
        "sections": sections,
    }


def normalize_proposal(
    raw: dict[str, Any], form_data: dict[str, Any]
) -> dict[str, Any]:
    today = datetime.date.today().isoformat()
    valid_until = (datetime.date.today() + datetime.timedelta(days=30)).isoformat()
    step1 = form_data.get("step1", {})
    step3 = form_data.get("step3", {})

    proj_name = step1.get("projectName", "Software Project")
    comp_name = step1.get("clientCompany", "Client")
    ag_name = step1.get("agencyName", "Agency")
    budget = step3.get("budgetRange", "₹75,000 – ₹2,00,000")

    raw_sections = raw.get("sections") or []
    sections = []
    for idx, s in enumerate(raw_sections):
        s_id = s.get("id") or f"section_{idx + 1}"
        s_title = s.get("title") or f"Section {idx + 1}"
        s_type = s.get("type") or "text"
        s_content = s.get("content") or ""
        sections.append(
            {
                "id": s_id,
                "title": s_title,
                "type": s_type,
                "content": s_content,
                "isEdited": False,
            }
        )

    uid = f"proposal_{int(time.time())}_{uuid.uuid4().hex[:6]}"
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    return {
        "id": uid,
        "formData": form_data,
        "title": raw.get("title") or f"Project Proposal: {proj_name}",
        "subtitle": raw.get("subtitle") or f"Prepared for {comp_name} by {ag_name}",
        "generatedDate": today,
        "validUntil": valid_until,
        "totalValue": raw.get("totalValue") or budget,
        "sections": sections,
        "status": "draft",
        "createdAt": now_iso,
        "updatedAt": now_iso,
    }


def handle_generate_proposal(args: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
    form_data = args.get("formData")
    if not isinstance(form_data, dict):
        return {"success": False, "error": "formData dictionary is required."}

    invoke_id = context.get("invoke_id")
    sampling_token = context.get("sampling_token")
    prompt = build_proposal_prompt(form_data)

    parsed = None
    if sampling_token:
        try:
            raw_text = sample_llm(prompt, invoke_id=invoke_id, timeout_s=35.0)
            parsed = parse_json_response(raw_text)
        except Exception:
            parsed = None

    if not parsed:
        parsed = synthesize_fallback_proposal(form_data)

    proposal = normalize_proposal(parsed, form_data)
    return {"success": True, "data": {"proposal": proposal}}


def handle_regenerate_section(args: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
    form_data = args.get("formData")
    section_title = args.get("sectionTitle")
    current_content = args.get("currentContent", "")

    if not isinstance(form_data, dict):
        return {"success": False, "error": "formData dictionary is required."}
    if not section_title:
        return {"success": False, "error": "sectionTitle is required."}

    invoke_id = context.get("invoke_id")
    sampling_token = context.get("sampling_token")
    prompt = build_section_prompt(form_data, section_title, current_content)

    new_section = None
    if sampling_token:
        try:
            raw_text = sample_llm(prompt, invoke_id=invoke_id, timeout_s=35.0)
            parsed = parse_json_response(raw_text)
            sections = parsed.get("sections") or []
            if sections and isinstance(sections, list):
                item = sections[0]
                sec_id = item.get("id") or re.sub(r"[^a-z0-9]+", "_", section_title.lower()).strip("_")
                new_section = {
                    "id": sec_id,
                    "title": item.get("title") or section_title,
                    "type": item.get("type") or "text",
                    "content": item.get("content") or current_content,
                    "isEdited": False,
                }
        except Exception:
            pass

    if not new_section:
        new_section = synthesize_fallback_section(section_title, form_data)

    return {"success": True, "data": {"section": new_section}}


def synthesize_fallback_audit(proposal: dict[str, Any]) -> dict[str, Any]:
    sections = proposal.get("sections") or []
    sec_titles = [s.get("title", "").lower() for s in sections]
    total_words = sum(len(s.get("content", "").split()) for s in sections)

    has_exec = any("executive" in t or "summary" in t for t in sec_titles)
    has_scope = any("scope" in t or "deliverable" in t or "feature" in t for t in sec_titles)
    has_tech = any("technical" in t or "approach" in t or "architecture" in t for t in sec_titles)
    has_timeline = any("timeline" in t or "milestone" in t or "schedule" in t for t in sec_titles)
    has_pricing = any("pricing" in t or "investment" in t or "commercial" in t for t in sec_titles)
    has_terms = any("term" in t or "condition" in t or "legal" in t for t in sec_titles)

    # Completeness (0-100)
    completeness_pts = (has_exec * 15) + (has_scope * 20) + (has_tech * 15) + (has_timeline * 20) + (has_pricing * 20) + (has_terms * 10)
    completeness = min(100, max(40, completeness_pts))

    # Clarity (0-100)
    clarity = 85 if total_words > 600 else (70 if total_words > 300 else 55)

    # Scope Specificity (0-100)
    bullet_count = sum(s.get("content", "").count("- ") + s.get("content", "").count("* ") for s in sections)
    scope_specificity = min(98, max(50, 60 + bullet_count * 3))

    # Pricing Integrity (0-100)
    has_table = any("|" in s.get("content", "") for s in sections)
    pricing_integrity = 92 if (has_pricing and has_table) else (78 if has_pricing else 45)

    # Risk Coverage (0-100)
    has_risks = any("risk" in s.get("content", "").lower() or "mitigation" in s.get("content", "").lower() or "warranty" in s.get("content", "").lower() for s in sections)
    risk_coverage = 88 if has_risks else 62

    # Actionability (0-100)
    has_next_steps = any("next" in t or "step" in t or "action" in t or "kickoff" in t for t in sec_titles)
    actionability = 94 if has_next_steps else 68

    # Weighted Overall Score
    overall_score = int(
        (completeness * 0.25)
        + (clarity * 0.15)
        + (scope_specificity * 0.20)
        + (pricing_integrity * 0.20)
        + (risk_coverage * 0.10)
        + (actionability * 0.10)
    )

    grade = "A" if overall_score >= 88 else ("B" if overall_score >= 75 else ("C" if overall_score >= 60 else "Needs Improvement"))

    strengths = []
    if has_scope and bullet_count >= 4:
        strengths.append("Granular scope of work with itemized deliverable breakdown.")
    if has_timeline:
        strengths.append("Clear phased project milestones providing structured delivery visibility.")
    if pricing_integrity >= 80:
        strengths.append("Structured investment schedule with explicit milestone payment terms.")
    if has_exec:
        strengths.append("Personalized executive summary establishing client problem alignment.")
    if not strengths:
        strengths.append("Foundational proposal structure established.")

    recommendations = []
    missing_items = []
    if not has_terms:
        recommendations.append("Include explicit Terms & Conditions covering IP transfer, warranty period, and revision bounds.")
        missing_items.append("Terms & Conditions")
    if not has_table and has_pricing:
        recommendations.append("Convert pricing text into an itemized tabular format for transparent client review.")
    if not has_risks:
        recommendations.append("Add a Risk Mitigation & Dependency section to build client trust and demonstrate foresight.")
        missing_items.append("Risk Mitigation Matrix")
    if not has_next_steps:
        recommendations.append("Add an unambiguous Next Steps section outlining contract signature and kickoff scheduling.")
        missing_items.append("Next Steps / Call to Action")
    if total_words < 500:
        recommendations.append("Elaborate on technical implementation specifics to strengthen competitive value.")

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    return {
        "overallScore": overall_score,
        "grade": grade,
        "metrics": {
            "completeness": completeness,
            "clarity": clarity,
            "pricingIntegrity": pricing_integrity,
            "scopeSpecificity": scope_specificity,
            "riskCoverage": risk_coverage,
            "actionability": actionability,
        },
        "strengths": strengths,
        "actionableRecommendations": recommendations,
        "missingCriticalItems": missing_items,
        "lastAuditedAt": now_iso,
    }


def synthesize_fallback_refine(text: str, instruction: str, context_info: str) -> str:
    cleaned = text.strip()
    norm_inst = instruction.lower()

    if "tone" in norm_inst or "professional" in norm_inst:
        prefix = f"### Professional Advisory Framing\n\n"
        enhanced = cleaned.replace("we will make", "our dedicated team will engineer and deliver")
        enhanced = enhanced.replace("good", "enterprise-grade").replace("fast", "high-velocity and robust")
        return prefix + enhanced + "\n\n*All specifications adhere strictly to modern engineering standards and client-approved governance.*"

    elif "concise" in norm_inst or "short" in norm_inst:
        paragraphs = [p.strip() for p in cleaned.split("\n\n") if p.strip()]
        condensed = []
        for p in paragraphs:
            sentences = [s.strip() for s in p.split(". ") if s.strip()]
            if sentences:
                condensed.append(". ".join(sentences[:2]) + ("." if not sentences[0].endswith(".") else ""))
        return "\n\n".join(condensed) if condensed else cleaned

    elif "expand" in norm_inst or "technical" in norm_inst or "detail" in norm_inst:
        suffix = (
            "\n\n### Technical Execution & Quality Standards\n"
            "- **Architecture**: Modular separation of concerns with clean API contracts.\n"
            "- **Resilience**: Comprehensive error boundaries, input sanitization, and automated retry policies.\n"
            "- **Validation**: Continuous automated unit testing and end-to-end regression validation prior to deployment."
        )
        return cleaned + suffix

    elif "simplify" in norm_inst or "plain" in norm_inst:
        simplified = cleaned.replace("orchestration", "organization").replace("utilize", "use")
        simplified = simplified.replace("enterprise-grade", "reliable and proven").replace("paradigm", "approach")
        return simplified

    elif "risk" in norm_inst or "mitigation" in norm_inst:
        risks_block = (
            "\n\n### Risk Management & Contingency Plan\n"
            "| Identified Risk | Severity | Mitigation Strategy |\n"
            "|---|---|---|\n"
            "| Third-Party API Latency / Changes | Medium | Mock fallback layer & strict SLA monitoring |\n"
            "| Scope Drift during Sprints | High | Formal Change Request procedure & weekly scope audits |\n"
            "| Data Schema Migration Bottlenecks | Low | Phased database migrations with automated rollback |"
        )
        return cleaned + risks_block

    return cleaned


def synthesize_fallback_extract_brief(brief_text: str) -> dict[str, Any]:
    text = brief_text.strip()
    lines = [l.strip() for l in text.split("\n") if l.strip()]

    # Heuristic extraction
    client_name = "Client Partner"
    client_company = "Client Organization"
    project_name = "Custom Solution"
    project_type = "Web Development"
    industry = "Technology"
    budget = "Standard Project Budget"

    # Search for client / company
    company_match = re.search(r"(?:company|organization|client|at)\s+([A-Za-z0-9 &]+?)(?:\.|\n|!|\s+we|\s+our|$)", text, re.I)
    if not company_match:
        company_match = re.search(r"(?:from)\s+([A-Za-z0-9 &]+?)(?:\.|\n|!|\s+we|\s+our|$)", text, re.I)
    if company_match:
        client_company = company_match.group(1).strip()

    name_match = re.search(r"(?:this is|i am|my name is|contact:?|name:?)\s+(?:dr\.?|mr\.?|ms\.?|mrs\.?)?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)", text, re.I)
    if not name_match:
        name_match = re.search(r"(?:from|hi|hello)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:at|from|with)", text, re.I)
    if name_match:
        client_name = name_match.group(1).strip()

    # Search for project name
    proj_match = re.search(r"(?:project|building|develop|create|build)\s+(?:a|an|the|our)?\s*([A-Za-z0-9 &'-]+?)(?:\.|\n|!|\s+in|\s+for|$)", text, re.I)
    if proj_match:
        project_name = proj_match.group(1).strip()
    elif lines:
        project_name = lines[0][:40]

    # Search for budget
    budget_match = re.search(r"(\$|₹|€|£)\s?([0-9,]+(?:\s?-\s?[0-9,]+|\s?k)?)", text, re.I)
    if budget_match:
        budget = budget_match.group(0).strip()

    # Extract bullet points as features
    raw_features = [l.lstrip("-*• 0123456789.)").strip() for l in lines if l.startswith(("-", "*", "•")) or re.match(r"^\d+\.", l)]
    if not raw_features:
        raw_features = [lines[i] for i in range(min(3, len(lines)))]

    return {
        "clientName": client_name,
        "clientCompany": client_company,
        "projectName": project_name,
        "projectType": project_type,
        "industry": industry,
        "problemStatement": text[:350],
        "keyFeatures": "\n".join(raw_features[:6]),
        "budgetRange": budget,
        "timeline": "4-6 weeks",
    }


def handle_audit_proposal(args: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
    proposal = args.get("proposal")
    if not isinstance(proposal, dict):
        return {"success": False, "error": "proposal dictionary is required."}

    invoke_id = context.get("invoke_id")
    sampling_token = context.get("sampling_token")

    audit_result = None
    if sampling_token:
        try:
            prompt = (
                f"You are a Senior Proposal Auditor and Commercial Contracts Reviewer.\n"
                f"Audit the following project proposal and output a structured QA assessment in JSON.\n\n"
                f"PROPOSAL DATA:\n{json.dumps(proposal)[:3000]}\n\n"
                f"Evaluate across: completeness, clarity, pricingIntegrity, scopeSpecificity, riskCoverage, actionability.\n"
                f"RESPOND WITH A VALID JSON OBJECT ONLY:\n"
                f"{{\n"
                f'  "overallScore": 88,\n'
                f'  "grade": "A",\n'
                f'  "metrics": {{\n'
                f'    "completeness": 90,\n'
                f'    "clarity": 85,\n'
                f'    "pricingIntegrity": 90,\n'
                f'    "scopeSpecificity": 85,\n'
                f'    "riskCoverage": 80,\n'
                f'    "actionability": 90\n'
                f'  }},\n'
                f'  "strengths": ["...", "..."],\n'
                f'  "actionableRecommendations": ["...", "..."],\n'
                f'  "missingCriticalItems": ["..."],\n'
                f'  "lastAuditedAt": "{datetime.datetime.now(datetime.timezone.utc).isoformat()}"\n'
                f"}}"
            )
            raw = sample_llm(prompt, invoke_id=invoke_id, timeout_s=30.0)
            audit_result = parse_json_response(raw)
        except Exception:
            audit_result = None

    if not audit_result or not isinstance(audit_result.get("metrics"), dict):
        audit_result = synthesize_fallback_audit(proposal)

    return {"success": True, "data": {"audit": audit_result}}


def handle_refine_text(args: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
    text = args.get("text", "")
    instruction = args.get("instruction", "improve_tone")
    context_info = args.get("context", "")

    if not text:
        return {"success": False, "error": "text string is required."}

    invoke_id = context.get("invoke_id")
    sampling_token = context.get("sampling_token")

    refined = None
    if sampling_token:
        try:
            prompt = (
                f"You are an expert agency proposal editor.\n"
                f"Context: {context_info}\n"
                f"Instruction: {instruction}\n"
                f"Original text:\n{text}\n\n"
                f"Rewrite and refine the text according to the instruction. Preserve Markdown formatting.\n"
                f"RESPOND WITH A VALID JSON OBJECT ONLY: {{\"refinedText\": \"...\"}}"
            )
            raw = sample_llm(prompt, invoke_id=invoke_id, timeout_s=25.0)
            parsed = parse_json_response(raw)
            refined = parsed.get("refinedText")
        except Exception:
            refined = None

    if not refined:
        refined = synthesize_fallback_refine(text, instruction, context_info)

    return {"success": True, "data": {"refinedText": refined}}


def handle_extract_brief(args: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
    brief_text = args.get("briefText", "")
    if not brief_text:
        return {"success": False, "error": "briefText string is required."}

    invoke_id = context.get("invoke_id")
    sampling_token = context.get("sampling_token")

    extracted = None
    if sampling_token:
        try:
            prompt = (
                f"Extract structured proposal scoping fields from this raw client brief / RFP:\n\n"
                f"{brief_text}\n\n"
                f"RESPOND WITH A VALID JSON OBJECT ONLY:\n"
                f"{{\n"
                f'  "clientName": "...",\n'
                f'  "clientCompany": "...",\n'
                f'  "projectName": "...",\n'
                f'  "projectType": "Web Development",\n'
                f'  "industry": "Technology",\n'
                f'  "problemStatement": "...",\n'
                f'  "keyFeatures": "1. ...\\n2. ...",\n'
                f'  "budgetRange": "...",\n'
                f'  "timeline": "..."\n'
                f"}}"
            )
            raw = sample_llm(prompt, invoke_id=invoke_id, timeout_s=30.0)
            extracted = parse_json_response(raw)
        except Exception:
            extracted = None

    if not extracted or not isinstance(extracted, dict):
        extracted = synthesize_fallback_extract_brief(brief_text)

    return {"success": True, "data": {"extractedData": extracted}}


def invoke(method: str, args: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
    if method == "ping":
        return {"success": True, "data": {"pong": True}}
    if method == "generate_proposal":
        return handle_generate_proposal(args, context)
    if method == "regenerate_section":
        return handle_regenerate_section(args, context)
    if method == "audit_proposal":
        return handle_audit_proposal(args, context)
    if method == "refine_text":
        return handle_refine_text(args, context)
    if method == "extract_brief":
        return handle_extract_brief(args, context)
    return {"success": False, "error": f"Unknown method: {method}"}


def main() -> None:
    if len(sys.argv) > 1:
        arg = sys.argv[1].lower()
        if arg in ("--describe", "describe"):
            print(json.dumps(MANIFEST))
            sys.exit(0)
        if arg in ("--health", "health"):
            print(json.dumps({"status": "ready"}))
            sys.exit(0)
        if arg in ("--version", "version", "-v"):
            print(MANIFEST.get("version", "0.2.0"))
            sys.exit(0)

    # Start stdin listener thread
    t = threading.Thread(target=stdin_reader, daemon=True)
    t.start()

    while True:
        try:
            req = agent_requests.get()
            if req is None:
                break
        except (KeyboardInterrupt, SystemExit):
            break

        req_id = req.get("id")
        method = req.get("method")

        try:
            if method == "describe":
                result = MANIFEST
            elif method == "initialize":
                result = {
                    "protocolVersion": "2.0",
                    "server_info": {
                        "name": MANIFEST.get("display_name", "AI Proposal Writer Tool"),
                        "version": MANIFEST.get("version", "0.2.0"),
                    },
                    "serverInfo": {
                        "name": MANIFEST.get("display_name", "AI Proposal Writer Tool"),
                        "version": MANIFEST.get("version", "0.2.0"),
                    },
                    "capabilities": {"sampling": {}},
                }
            elif method == "health":
                result = {"status": "ready"}
            elif method == "invoke":
                params = req.get("params", {})
                tool_name = params.get("tool")
                arguments = params.get("arguments", {})
                context = params.get("context", {})
                result = invoke(tool_name, arguments, context)
            else:
                raise ValueError(f"unknown rpc: {method}")

            send_json({"jsonrpc": "2.0", "id": req_id, "result": result})
        except Exception as e:
            send_json(
                {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "error": {"code": -32601, "message": str(e)},
                }
            )


if __name__ == "__main__":
    main()
