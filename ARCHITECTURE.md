# AI Proposal Writer — Architecture Documentation (Anna Platform)

## 1. System Overview

The AI Proposal Writer Anna App is a full-featured, production-ready client proposal engine built for the Anna platform. It combines a high-performance Single Page Application (SPA) UI bundle with an asynchronous Executa plugin speaking JSON-RPC 2.0 over stdio.

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
│  - NewProposalView (4-Step Wizard)     │           │
│  - ProposalDetailView (Editor, PDF)    │           │
│  - SectionCard (Inline edit/regen)     │           │
│  - pdf-generator.ts (Vector A4 PDF)    │           │
│  - anna-bridge.ts (Host RPC wrapper)   │           │
└──────────────────┬─────────────────────┘           ▼
                   │ tools.invoke          ┌───────────────────────────┐
                   │                       │       Executa Plugin      │
                   └──────────────────────►│ tool-dev-ai-proposal-writer│
                                           │  - generate_proposal      │
                                           │  - regenerate_section     │
                                           │  - JSON normalizer        │
                                           │  - fallback synthesizer  │
                                           └───────────────────────────┘
```

---

## 2. Component Boundaries & Responsibilities

### UI Bundle (`bundle/`)
- **Format**: `static-spa` (entry: `index.html`, script: `app.js`).
- **Framework**: React 18, TypeScript, Tailwind CSS, Lucide icons.
- **Routing**: Client-side hash routing (`#/proposals`, `#/new`, `#/proposals/:id`) compatible with Anna iframe sandboxing.
- **Lifecycle**: Connects to the host using `/static/anna-apps/_sdk/latest/index.js`, signals `window.ready`, and dynamically updates window title via `window.set_title`.
- **State & Storage**: Durable state synchronization via Anna Host API `storage` (`anna.storage.get`, `anna.storage.set`, `anna.storage.delete`), with localStorage local cache fallback.

### Executa Plugin (`executas/ai-proposal-writer-anna/`)
- **Protocol**: JSON-RPC 2.0 over stdio (`protocolVersion: "2.0"`).
- **Tool Id**: `tool-dev-ai-proposal-writer-anna`.
- **Capabilities**: Declares `host_capabilities: ["llm.sample"]` in `describe` and `capabilities: {"sampling": {}}` in `initialize`.
- **Methods**:
  - `ping`: Smoke test.
  - `generate_proposal`: Assembles detailed system instructions, requests host LLM sampling via `sampling/createMessage`, sanitizes output, normalizes dates/sections, and outputs structured `GeneratedProposal`.
  - `regenerate_section`: Re-prompts the model for an isolated section with contextual awareness of the surrounding proposal, returning a formatted `ProposalSection`.
  - **Graceful Fallback**: If host LLM sampling is offline, unconfigured, or lacking a PAT in local dev, the Executa generates rich, personalized, contextual proposal sections derived directly from the user's form parameters.

---

## 3. Data Model

### `GeneratedProposal`
```typescript
interface GeneratedProposal {
  id: string;              // Unique proposal ID
  formData: ProposalFormData;
  title: string;           // E.g. "Project Proposal: E-commerce Platform"
  subtitle: string;        // E.g. "Prepared for StyleHub by Aetherion Labs"
  generatedDate: string;   // YYYY-MM-DD
  validUntil: string;      // YYYY-MM-DD (+30 days)
  sections: ProposalSection[];
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  totalValue: string;      // E.g. "₹1,25,000"
  createdAt: string;       // ISO 8601
  updatedAt: string;       // ISO 8601
}
```

### `ProposalSection`
```typescript
interface ProposalSection {
  id: string;              // E.g. "executive_summary", "pricing"
  title: string;
  content: string;         // Markdown / pipe table / phase syntax
  type: 'text' | 'table' | 'list' | 'phases';
  isEdited: boolean;
}
```

---

## 4. PDF Generation Architecture

- **Engine**: Client-side vector generation using `jsPDF`.
- **Layout**: Standard A4 document:
  - **Page 1 (Cover)**: Indigo brand band (`#6366f1`), agency title, subtitle, proposal title, client metadata, confidentiality note.
  - **Page 2+ (Details)**: Running header and footer, table of contents, parsed sections with styled table grids, phase milestone cards, and typography.
- **Delivery**: Direct browser file download (`doc.save('<clean-title>.pdf')`) without external network hops or base64 RPC transport overhead.
