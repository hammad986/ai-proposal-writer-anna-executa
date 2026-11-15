# AI Proposal Writer 2.0 — Architecture & System Design
## Enterprise AI Proposal & RFP Intelligence Workspace

**Version:** 2.0.0  
**Target Platform:** Anna AI OS (Dispatcher 0.22.0+, Schema v2)  
**Date:** November 15, 2026  

---

## 1. High-Level System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Anna Platform Host                              │
│                                                                        │
│   ┌────────────────────────────┐    ┌──────────────────────────────┐   │
│   │    Anna Dashboard Host     │    │      Host RPC Dispatcher     │   │
│   │  (postMessage Relay Bridge)│    │ (Storage, Window, LLM)       │   │
│   └──────────────▲─────────────┘    └──────────────▲───────────────┘   │
└──────────────────┼─────────────────────────────────┼───────────────────┘
                   │ postMessage                     │
                   ▼                                 │ Reverse RPC
┌────────────────────────────────────────┐           │ (sampling/createMessage)
│     Static-SPA Bundle (iframe)         │           │
│                                        │           │
│  - App.tsx (Router, State, Toasts)     │           │
│  - DashboardView (KPIs, Proposals)     │           │
│  - NewProposalView (Scoping Wizard)    │           │
│  - ProposalDetailView (Editor, Hub)    │           │
│  - RfpIntelligenceModal (Shredder)    │           │
│  - RfpComplianceMatrixModal            │           │
│  - CompanyKnowledgeModal (RAG Ground)  │           │
│  - ClientPreviewModal (Interactive CPQ)│           │
│  - docx-generator.ts (Microsoft Word)  │           │
│  - pdf-generator.ts (Vector A4 PDF)    │           │
│  - anna-bridge.ts (Host RPC wrapper)   │           │
└──────────────────┬─────────────────────┘           ▼
                   │ tools.invoke          ┌───────────────────────────┐
                   │                       │       Executa Plugin      │
                   └──────────────────────►│ tool-hammad-ai-proposal...│
                                           │  - generate_proposal      │
                                           │  - regenerate_section     │
                                           │  - extract_rfp_matrix     │
                                           │  - audit_proposal         │
                                           │  - scan_contract_risks    │
                                           │  - analyze_deal_health    │
                                           │  - calculate_roi          │
                                           │  - JSON-RPC 2.0 stdio     │
                                           └───────────────────────────┘
```

---

## 2. Core Subsystems

### A. RFP & Requirements Intelligence ("RFP Shredder")
1. **Multi-Format Ingestion**: Ingests unstructured documents (PDF text, DOCX, Markdown, plain text) via client-side file reading or direct text input.
2. **Clause Extraction Engine**: Automatically scans for mandatory compliance language (`shall`, `must`, `will`, `required`), technical prerequisites, deliverables, timeline constraints, and evaluation criteria.
3. **2-Way Compliance Matrix**: Maps every extracted requirement directly to a proposal section, tracking compliance status (`Compliant`, `Partial Exception`, `Unaddressed`) and allowing 1-click clause generation into the target section.

### B. Company Knowledge Base & Context Grounding
1. **Durable Local Knowledge Store**: Stores verified agency case studies, tech stack certifications, past proposal snippets, and standard legal terms in `anna.storage`.
2. **Grounding Prompts**: Injects verified company facts and case studies into proposal generation prompts, preventing LLM hallucinations and ensuring authentic agency credentials.

### C. Multi-Format Export Engine
1. **Vector A4 PDF (`pdf-generator.ts`)**: Built with `jspdf`, generating cover pages, tables of contents, markdown tables, phase timelines, and verified digital signature stamps.
2. **Native Microsoft Word DOCX (`docx-generator.ts`)**: Generates valid `.docx` files formatted with document title, metadata, table of contents, styled tables, bullet lists, and legal signature sections.
3. **Structured Markdown & JSON Schema Portability**: Lossless JSON backup and export for team collaboration and archival.

### D. Financial & CPQ Calculation Subsystem
- **Deterministic Math**: Pure TypeScript calculation engine (`calculatePricingTotals`, `convertCurrency`, `calculateRoiLocally`) ensuring zero hallucinated arithmetic.
- **Dynamic Buyer CPQ**: Client preview allows toggling optional add-ons and switching tiers with real-time recalculation before digital sign-off.
