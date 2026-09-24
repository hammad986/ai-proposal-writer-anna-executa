# AI Proposal Writer — Anna App

AI Proposal Writer is a comprehensive, production-grade Anna App that enables freelancers, agencies, and software consultants to draft, customize, refine, and export client proposals in minutes.

---

## Features

- **Executive Proposal Dashboard**: Real-time KPI metrics displaying total proposals, pipeline value (INR), accepted proposals, and pending proposals.
- **4-Step Proposal Scoping Wizard**:
  - **Step 1 (Basics)**: Agency identity, client company, contact name, project type, industry, and problem statement.
  - **Step 2 (Scope & Tech)**: Deliverable features, technical requirements pills, preferred tech stack, and target users.
  - **Step 3 (Pricing & Timeline)**: Project complexity, budget range, advance percentage slider, revision rounds, warranty period, and milestone structure.
  - **Step 4 (Tone & Style)**: Proposal tone (Professional, Friendly, Bold, Technical), language (English, Hindi, Hinglish), section toggles, and custom emphasis.
- **AI-Powered Structured Generation**: Invokes an Anna Executa plugin speaking JSON-RPC 2.0 with reverse-RPC host LLM sampling and contextual normalization.
- **Interactive Proposal Viewer**: Sticky Table of Contents, metadata header, status badge, and structured sections.
- **Formatted Section Rendering**: Automatic parsing for markdown tables (Pricing), numbered phases with task lists (Timeline), and bulleted lists.
- **Inline Section Editing**: Quick text editing with Save and Cancel actions and an "Edited" badge indicator.
- **Single-Section AI Regeneration**: Re-prompts the AI model to regenerate only the targeted section while preserving the rest of the proposal.
- **Vector PDF Export**: One-click client-side A4 PDF generation with a branded cover page, headers/footers, and clean layout matching the original design.
- **Durable Storage**: Automatic synchronization with Anna Host Storage (`anna.storage`) and browser cache fallback.

---

## Architecture Overview

```
Anna App Host (Nexus/Dispatcher)
   │
   ├── Iframe UI Bundle (static-spa):
   │     - Vite + React 18 + TypeScript + Tailwind CSS
   │     - Communicates via /static/anna-apps/_sdk/latest/index.js
   │     - Calls anna.tools.invoke('generate_proposal' | 'regenerate_section')
   │     - Persists proposals via anna.storage.get/set/delete
   │
   └── Executa Plugin (stdio JSON-RPC 2.0):
         - Python plugin at executas/ai-proposal-writer-anna/
         - Requests LLM completions via reverse-RPC sampling/createMessage
         - Sanitizes, validates, and normalizes structured proposal JSON
         - Fallback synthesis for local offline development
```

For full details, see [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## Local Development & Setup

### Prerequisites
- Node.js ≥ 20.x
- Python ≥ 3.10
- `@anna-ai/cli` installed (`anna-app --version`)

### Build the UI Bundle
To compile the React TypeScript application into `bundle/`:
```bash
npm install
npm run build
```

### Validate Anna Manifest
Run the strict validator:
```bash
anna-app validate --strict
```

### Run Local Development Server
Launch the Anna development harness:
```bash
anna-app dev
```
*(Or specify `--port 5181` if port 5180 is already in use by another instance).*

Open the dashboard harness in your browser at:
`http://localhost:5180/` (or `http://localhost:5181/`)

---

## Manifest Capabilities & Permissions

This application follows the principle of least privilege:
- `tools`: `["tool-dev-ai-proposal-writer-anna"]` — Pinned exclusively to the app's bundled Executa plugin.
- `storage`: `["get", "set", "delete", "list"]` — App-scoped durable KV store for proposals and form drafts.
- `window`: `["set_title", "ready"]` — Standard window lifecycle and title management.

No external provider credentials or broad permissions are required.

---

## Migration Mapping from Original Next.js App

| Original Next.js Path | Target Anna App Path | Description |
|---|---|---|
| `src/lib/types.ts` | `ui/src/types.ts` | Data models and interfaces |
| `src/lib/defaults.ts` | `ui/src/defaults.ts` | Form options, sections, demo proposals |
| `src/lib/utils.ts` | `ui/src/utils.ts` | Utilities, currency formatting, table parsing |
| `src/app/api/generate/route.ts` | `executas/.../ai_proposal_writer_anna_plugin.py` | AI proposal generation and prompt logic |
| `src/lib/store.ts` | `ui/src/anna-bridge.ts` + `App.tsx` | Durable state management via Anna Host Storage |
| `src/app/proposals/page.tsx` | `ui/src/views/DashboardView.tsx` | Proposal dashboard and metrics |
| `src/app/proposals/new/page.tsx` | `ui/src/views/NewProposalView.tsx` | 4-step proposal scoping wizard |
| `src/app/proposals/[id]/page.tsx` | `ui/src/views/ProposalDetailView.tsx` | Proposal viewer, editor, and actions |
| `src/components/proposal/proposal-pdf.tsx` | `ui/src/pdf-generator.ts` | Vector A4 PDF generator |

---

## Known Platform Behaviors & Notes

1. **Local Dev LLM Sampling**: In local development without `--llm` or an active user session PAT, the Executa employs an intelligent fallback synthesizer that produces rich, contextual proposals matching the exact form inputs, ensuring zero disruption during offline testing.
2. **Zero Hardcoded Secrets**: All AI operations utilize Anna platform sampling; no API keys are packaged or required.
