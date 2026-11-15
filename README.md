# Aetherion Labs — AI Proposal Writer 3.0
### Autonomous RFP Intelligence, Voice-Powered Scoping, Okapi-BM25 RAG & Interactive Deal Studio for Anna AI OS

[![Anna Platform](https://img.shields.io/badge/Anna_Platform-Store_App_#319-indigo.svg)](https://anna.partners/store/@hammad/ai-proposal-writer-anna)
[![Version](https://img.shields.io/badge/Version-3.0.0-blue.svg)](./manifest.json)
[![Build Status](https://img.shields.io/badge/Tests-45%2F45_Passing-brightgreen.svg)](./tests)
[![Security & Privacy](https://img.shields.io/badge/Privacy-Zero_Data_Retention-success.svg)](./PRIVACY.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue.svg)](./tsconfig.json)
[![React](https://img.shields.io/badge/React-18.2-61dafb.svg)](./ui/package.json)
[![License](https://img.shields.io/badge/License-MIT-orange.svg)](./LICENSE)

---

## 🌟 Executive Overview

**Aetherion Labs — AI Proposal Writer 3.0** is an enterprise-grade document automation and proposal intelligence suite engineered natively for **Anna AI OS**. It transforms raw client requirements, voice briefs, and complex 100+ page RFP solicitations into persuasive, win-optimized commercial proposals in minutes.

Unlike conventional text-generation tools that output generic placeholders, Aetherion Labs combines **deterministic pricing calculations**, **semantic requirement shredding**, **local Okapi-BM25 retrieval-augmented generation (RAG)**, and an **interactive client portal with cryptographic e-signatures**.

---

## 🚀 Key Innovations in Version 3.0

### 1. 🎙️ Controlled Voice Proposal Studio
- **Zero-Duplication Engine:** Engineered with a deterministic finite state machine (`idle` &rarr; `requesting_permission` &rarr; `listening` &rarr; `processing` &rarr; `ready`) that cleanly separates interim preview buffers from finalized transcript arrays, completely eliminating duplicate speech fragments.
- **Session ID Guard:** Stale Web Speech events emitted after session termination are dropped automatically.
- **Instant AI Scoping:** Transcribes natural spoken client briefs in real time and auto-populates client name, deliverables, budget tier, and tech stack.

### 2. 📑 Enterprise RFP Intelligence & Compliance Matrix
- **12 Semantic Requirement Categories:** Classifies complex solicitations into `functional`, `technical`, `security_compliance`, `sla_performance`, `commercial_pricing`, `governance_management`, `staffing_qualifications`, `implementation_timeline`, `legal_terms`, `evaluation_criteria`, `submission_guidelines`, and `mandatory_eligibility`.
- **Bid / No-Bid Decision Score (0–100):** Evaluates solicitation complexity, mandatory compliance coverage, and punitive liability risks to output an actionable bidding verdict with win themes and risk factors.
- **Exact Line-by-Line Traceability:** Every extracted requirement preserves its original document section and exact line numbers.
- **Smart Q&A Auto-Responder:** Matches extracted RFP questions with authoritative company answers from your knowledge base with confidence metrics.
- **Export Formats:** 1-click export to CSV Compliance Matrix or direct transition into Proposal Studio.

### 3. 🧠 Zero-Hallucination Okapi-BM25 RAG Knowledge System
- **Grounded Context Synthesis:** Pulls proven company case studies, technical certifications, past performance metrics, and security policies directly into active proposals.
- **Strict Inverted Index:** Pure deterministic BM25 scoring with term-frequency saturation ($k_1=1.5$) and length normalization ($b=0.75$), avoiding unverified external vector API calls.
- **Document Lineage Citations:** Every referenced fact is tagged with `[Source: Document Title, Chunk #N]`.
- **Interactive RAG Simulator:** Search and test your knowledge index in real time from the dashboard.

### 4. ✍️ Proposal Studio 3.0 — Enterprise Document Editor
- **Full Undo / Redo History:** Standard `Ctrl+Z` / `Ctrl+Y` keyboard shortcuts with state snapshotting.
- **Real-Time Autosave Indicator:** Visual feedback indicator (`✓ Saved Just now`) connected to durable `anna.storage`.
- **Reviewable AI Diffs:** AI suggestions appear in an amber review banner highlighting changes before applying them, preventing silent overwrites.
- **10 Contextual AI Refinement Actions:** Expand, Condense, Executive Summary, Enterprise Tone, Persuasive Tone, Add Risk Mitigation, Value Proposition, Technical Depth, Plain Language, and Format Bullets.
- **1-Pager Executive Brief Generator:** Generates a condensed C-level pitch card with ROI forecast, timelines, budget, and key deliverables.

### 5. ✍️ Interactive Client Portal & Digital Signature (e-Sign)
- **Live Client Presentation Mode:** Generates a presentation-ready interactive web proposal view for stakeholders.
- **Interactive Pricing Calculation:** Clients can toggle optional add-ons, recalculating subtotal, tax, discounts, and advance deposits in real time.
- **Cryptographic e-Signature Block:** Draw or type digital signatures stamped with a tamper-evident SHA-256 verification hash, UTC timestamp, and signer metadata.

### 6. 📊 Deal Pipeline CRM & Analytics
- **Kanban & Table Views:** Drag-and-drop or sort proposals across stages (*Drafting*, *Internal Review*, *Submitted*, *Negotiation*, *Won*, *Lost*).
- **Real Aggregate Volume Metrics:** Instant financial roll-ups per column, win probability weighting, and pipeline forecasting.

---

## 🏛️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Anna AI OS Environment                          │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                 Aetherion Labs UI (static-spa)                 │   │
│   │  Vite 5 • React 18 • TypeScript 5.2 • Tailwind CSS • Lucide    │   │
│   │                                                                │   │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │   │
│   │  │ Voice Engine │  │ BM25 RAG Hub │  │ RFP Intelligence Hub │  │   │
│   │  └──────────────┘  └──────────────┘  └──────────────────────┘  │   │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │   │
│   │  │ Studio 3.0   │  │ Deal CRM     │  │ Client Portal e-Sign │  │   │
│   │  └──────────────┘  └──────────────┘  └──────────────────────┘  │   │
│   └────────────────────────────────┬───────────────────────────────┘   │
│                                    │                                   │
│                        /static/anna-apps/_sdk                          │
│                                    ▼                                   │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                      Anna Host SDK Bridge                      │   │
│   │        anna.tools.invoke()  •  anna.storage (Durable KV)       │   │
│   └────────────────────────────────┬───────────────────────────────┘   │
│                                    │                                   │
└────────────────────────────────────┼───────────────────────────────────┘
                                     │ stdio JSON-RPC 2.0
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Executa Python Plugin Runtime                        │
│                                                                        │
│   • Tool: tool-hammad-ai-proposal-writer-anna-84jkbu68                 │
│   • Host LLM Reverse-RPC Sampling (sampling/createMessage)             │
│   • Deterministic Fallback Synthesis & Temporal Sanitization           │
│   • Structured Proposal JSON Normalization & Schema Validation         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📂 Project Structure

```
ai-proposal-writer-anna/
├── ui/                                # Vite + React 18 Frontend
│   ├── src/
│   │   ├── assets/branding/          # Aetherion Labs SVG vectors (mark, logo, dark/light)
│   │   ├── components/
│   │   │   ├── branding/             # AetherionLogo reusable component
│   │   │   ├── layout/               # AppSidebar, Header
│   │   │   └── ui/                   # Button, Card, Badge, Modal, Tabs
│   │   ├── views/
│   │   │   ├── DashboardView.tsx     # Executive metrics & quick actions
│   │   │   ├── ProposalStudioView.tsx# 3-pane editor, Undo/Redo, AI diffs, e-Sign
│   │   │   ├── VoiceProposalView.tsx # Zero-duplication voice scoping
│   │   │   ├── RfpIntelligenceView.tsx# 12 categories, Bid/No-Bid, Q&A matcher
│   │   │   ├── CompanyKnowledgeView.tsx# Okapi-BM25 RAG index & simulator
│   │   │   ├── DealPipelineView.tsx  # Kanban / Table CRM with volume stats
│   │   │   ├── TemplatesView.tsx     # 6 industry starter templates
│   │   │   └── SettingsView.tsx      # Aetherion profile, rates, API keys
│   │   ├── voice-engine.ts           # Speech state machine & buffer management
│   │   ├── rfp-intelligence-engine.ts# NLP requirement shredder & Bid/No-Bid
│   │   ├── rag-knowledge-engine.ts   # Inverted index & Okapi-BM25 search
│   │   ├── client-portal-engine.ts   # e-Signature & interactive client presentation
│   │   ├── executa-client.ts         # Anna JSON-RPC 2.0 client bridge
│   │   └── types.ts                  # TypeScript interfaces & domain models
│   └── public/
│       └── favicon.svg               # Branded Aetherion Labs favicon
├── executas/                          # Anna Executa Plugins (Python 3.10+)
│   └── ai-proposal-writer-anna/
│       ├── executa.json              # Executa metadata & schema
│       └── ai_proposal_writer_anna_plugin.py # JSON-RPC 2.0 server & prompt engineering
├── bundle/                            # Compiled production distribution for Anna OS
├── tests/                             # Automated test suites (Node.js & Python)
│   ├── test_voice_engine.mjs         # Voice state machine & deduplication tests
│   ├── test_rfp_intelligence.mjs     # 12-category parser & risk assessment tests
│   ├── test_rag_engine.mjs           # Okapi-BM25 ranking & precision tests
│   ├── test_studio_undo.mjs          # History manager snapshot tests
│   ├── test_pricing_and_audit.mjs    # Deterministic pricing & audit tests
│   ├── test_dates_frontend.mjs       # Temporal boundary & sanitization tests
│   ├── test_proposal_dates.py        # Python backend date validation
│   └── test_executa_v020.py          # Executa stdio JSON-RPC contract tests
├── app.json                           # Anna App specification
├── manifest.json                      # Strict capability declarations
├── PRIVACY.md                         # Enterprise Privacy & GDPR Policy
├── ARCHITECTURE.md                    # Detailed architecture specifications
└── package.json                       # Scripts, dependencies & metadata
```

---

## 🧪 Testing & Quality Assurance

The application maintains a comprehensive automated test suite with **45 passing unit, integration, and contract tests**:

```bash
# Run the complete test suite
npm test
```

### Test Coverage Highlights:
- **Voice Engine:** Verifies zero duplication across rapid interim speech bursts, session isolation, and interim buffer commitment on stop.
- **RFP Shredder:** Validates classification across 12 semantic categories, preservation of document line numbers, and detection of high-risk commercial penalties.
- **RAG Engine:** Asserts Okapi-BM25 ranking accuracy, multi-document retrieval diversity, and zero false positives on out-of-domain queries.
- **Studio History:** Asserts non-destructive undo/redo cycles with full state recovery.
- **Deterministic Math:** Verifies subtotal, tier discounts, taxes, and deposit calculations match across currencies (USD, EUR, GBP, INR).
- **Temporal Sanitization:** Guarantees LLM date hallucination (e.g., stale 2023 dates) is actively stripped and replaced with current valid operational dates.

---

## 🛠️ Local Development & Running

### Prerequisites
- **Node.js:** &ge; 20.x
- **Python:** &ge; 3.10
- **Anna CLI:** `@anna-ai/cli` (`anna-app --version`)

### Quick Start
```bash
# 1. Clone the repository
git clone https://github.com/hammad986/ai-proposal-writer-anna-executa.git
cd ai-proposal-writer-anna-executa

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev

# 4. Open in browser
# http://127.0.0.1:5173/
```

### Production Build & Validation
```bash
# Compile optimized production bundle into bundle/
npm run build

# Validate Anna manifest against strict JSON schemas
anna-app validate --strict

# Run deployment pre-flight dry-run
anna-app apps publish --dry-run
```

---

## 🔒 Security, Privacy & Least Privilege

- **App Scoped Storage:** All proposals, drafts, and knowledge documents are stored inside the app's isolated `anna.storage` namespace.
- **Zero Data Mining:** Client briefs and solicitation documents are never used for AI model training.
- **Strict Capabilities:** The app only requests the minimum required capabilities (`tools`, `storage`, `window`).
- For full details, review [PRIVACY.md](./PRIVACY.md) and [SECURITY_AUDIT.md](./SECURITY_AUDIT.md).

---

## 📄 License & Attribution

- **Developed by:** **Aetherion Labs Inc.**
- **Lead Architect:** Hammad ([@hammad986](https://github.com/hammad986))
- **Platform:** [Anna AI OS](https://anna.partners)
- **License:** MIT License. See [LICENSE](./LICENSE) for details.
