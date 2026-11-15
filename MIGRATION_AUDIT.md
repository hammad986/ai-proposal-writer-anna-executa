# AI Proposal Writer — Migration Audit (Next.js to Anna App)

**Date**: 2026-09-24  
**Author**: Claude Sonnet (Anna App Migration Engineer & Codebase Architect)  
**Source Path (Read-Only)**: `C:\Users\mdham\Downloads\AI-Proposal-Writer`  
**Target Path (Anna App)**: `C:\anna-projects\ai-proposal-writer-anna`  

---

## 1. SOURCE Architecture

The source application is a modern Next.js 14 (App Router) single-tenant web application for freelancers and agencies to draft, customize, and export AI-generated project proposals.

### Tech Stack & Runtime
- **Framework**: Next.js 14.2.23 (React 18.3.1, Node.js)
- **Styling**: Tailwind CSS 3.4.17 with custom color palette (Indigo primary `#6366f1`), `tailwindcss-animate`, Lucide React icons
- **State Management**: Zustand 5.0.2 with `persist` middleware storing state into browser `localStorage` (`apw_proposals`)
- **PDF Generation**: Client-side PDF rendering using `@react-pdf/renderer` 4.1.5 via `PDFDownloadLink` and custom layout primitives (`Document`, `Page`, `View`, `Text`, `StyleSheet`)
- **UI Components**: Radix UI Alert Dialog, Slot (`class-variance-authority`, `clsx`, `tailwind-merge`), custom styled form controls
- **Backend API**: A single Next.js API Route Handler (`POST /api/generate`) that invokes Google Generative AI (`@google/generative-ai` 0.21.0, model `gemini-1.5-flash`) using server-side environment variable `GEMINI_API_KEY`
- **Application Views**:
  - `/` (Home): Redirects to `/proposals`
  - `/proposals` (Dashboard): Metric cards (Total, Value, Accepted, Pending), proposal table with status badges and actions (View, PDF download tip, Delete confirmation dialog)
  - `/proposals/new` (Wizard): 4-step wizard (Basics, Scope, Pricing, Style), step validation, progress indicator, generating overlay with simulated progress steps, redirect on completion
  - `/proposals/[id]` (Viewer & Editor): Proposal viewer with section navigation sidebar, proposal meta card, section cards with inline Markdown/text editing and section regeneration

---

## 2. TARGET Anna Architecture

The target application is an Anna App running under the Anna Platform specification (schema 2/3).

### Target Components & Boundaries
- **UI Bundle**: Static Single Page Application (`format: "static-spa"`, entry: `index.html`), sandboxed in an iframe on the Anna dashboard. Connects to the host using `/static/anna-apps/_sdk/latest/index.js` (`AnnaAppRuntime.connect()`).
- **Executa Plugin**: Python-based stdio JSON-RPC 2.0 daemon plugin (`tool-dev-ai-proposal-writer-anna` under `executas/ai-proposal-writer-anna/`) spawned and managed by the local Anna Agent / dispatcher.
- **Manifest**: `manifest.json` declaring `required_executas`, `ui.bundle`, `ui.views`, `ui.host_api` (scoped ACL), and development fixtures/seeds.
- **Host APIs**:
  - `tools.invoke`: UI calls Executa methods (`ping`, `generate_proposal`, `regenerate_section`, etc.)
  - `storage`: Durable key-value state for proposals and form drafts, replacing raw `localStorage` with host-managed Anna Persistent Storage (APS) and window runtime state
  - `window`: Window lifecycle, title management (`set_title`), readiness signaling (`ready`)
  - `llm`: Host-managed sampling/completions (accessible both via Executa reverse-RPC `sampling/createMessage` and Host API `llm.complete`)
- **Styling & Assets**: Pre-bundled static CSS/JS (Tailwind compiled, self-contained assets adhering to Anna CSP: `'self'`, inline styles, data URLs for fonts/icons, no external unauthorized CDNs).

---

## 3. Current Feature Inventory

| Feature | Source Implementation | Description |
|---|---|---|
| Proposal Dashboard | `src/app/proposals/page.tsx` | Summary KPI cards (total count, total INR value, accepted, pending), searchable/scrollable list of proposals, delete action |
| Multi-Step Proposal Creator | `src/app/proposals/new/page.tsx` | 4-step wizard: Step 1 (Basics: Agency & Client info), Step 2 (Scope: Features, Tech requirements, constraints), Step 3 (Pricing: Complexity, budget, advance, milestones), Step 4 (Tone & Style: Tone, language, section toggles) |
| Live Draft Auto-Save | `src/lib/store.ts` | Form input state automatically preserved across steps and page reloads |
| Generation Progress Overlay | `src/components/proposal/generating-view.tsx` | Modal overlay with animated spinner, progress bar, and rotating progress messages during generation |
| Proposal Viewer | `src/components/proposal/proposal-viewer.tsx` | Comprehensive document viewer with left contents sidebar anchor links, metadata header, and structured section cards |
| Structured Section Rendering | `src/components/proposal/section-card.tsx` | Renders Markdown paragraphs, list items, phase cards (Timeline), and tabular pricing data (Pricing Table) |
| Inline Section Editing | `src/components/proposal/section-card.tsx` | Toggle to editable textarea, save/cancel controls, and "Edited" badge indicator |
| Single-Section Regeneration | `src/components/proposal/section-card.tsx` + `POST /api/generate` | Regenerates a single section via LLM while strictly preserving all other sections and proposal metadata |
| PDF Export & Download | `src/components/proposal/proposal-pdf.tsx` | Client-side 2-page styled PDF document generated via `@react-pdf/renderer` |
| Proposal Deletion | `src/app/proposals/page.tsx` | Confirmation dialog before removing a proposal from storage |

---

## 4. AI/LLM Integration Inventory

### Source Implementation
- **Provider**: Google Gemini (`gemini-1.5-flash`) via `@google/generative-ai`.
- **API Key**: Required `GEMINI_API_KEY` in environment variables.
- **Prompts**:
  - Full proposal prompt (`buildProposalPrompt` in `src/lib/gemini-prompt.ts`): Builds comprehensive system instruction specifying agency, client, project, requirements, budget, tone, and strictly requests a JSON response schema:
    ```json
    {
      "title": "string",
      "subtitle": "string",
      "generatedDate": "YYYY-MM-DD",
      "validUntil": "YYYY-MM-DD",
      "totalValue": "string",
      "sections": [
        { "id": "string", "title": "string", "type": "text|table|list|phases", "content": "string", "isEdited": false }
      ]
    }
    ```
  - Section prompt (`buildSectionPrompt` in `src/lib/gemini-prompt.ts`): Re-runs prompt for a single section with context of previous content and requests a single-item sections array.
- **Parsing**: `parseJsonResponse` strips markdown fences and extracts JSON object substring with fallback regex/bracket matching.

### Anna Target Strategy
- **Clean Separation**:
  - Business logic, prompt crafting, and response normalization reside inside the **Executa** (`tool-dev-ai-proposal-writer-anna`).
  - Executa exposes two methods:
    1. `generate_proposal(formData)`
    2. `regenerate_section(formData, sectionTitle, currentContent)`
  - Executa requests host LLM completion via Anna's reverse-RPC `sampling/createMessage` with `protocolVersion: "2.0"` and `host_capabilities: ["llm.sample"]`.
  - When running locally in `anna-app dev` (where reverse-RPC sampling or mock sampling may be active or Pat-based), the Executa includes a robust parser, fallback high-quality template generator (so development and smoke testing never crash if the host LLM is offline or unconfigured), and full normalization into `GeneratedProposal`.
  - Zero API keys are hardcoded in the frontend or bundled into client code.

---

## 5. PDF Generation Architecture

### Source Implementation
- Uses `@react-pdf/renderer` in the browser.
- Components: `Document`, `Page`, `View`, `Text`, `StyleSheet`.
- Generates a PDF blob and triggers a browser file download via `PDFDownloadLink` or blob URL.
- Two-page layout: Page 1 is a branded cover page with agency name and metadata; Page 2 contains headers, table of contents, parsed sections (tables, phases, text), and footer.

### Anna Compatibility Analysis
- In an Anna static-spa iframe:
  - `@react-pdf/renderer` is heavy (~2 MB bundle) and requires polyfills/can encounter browser sandboxing constraints in iframes, OR client-side canvas/HTML-to-PDF/Print/pure PDF generation.
  - Furthermore, standard web file downloads inside sandboxed iframes require careful handling: Anna Apps provide `anna.storage` and blob handling, and client-side PDF generation can produce a Blob URL (`blob:`) which is permitted by Anna's default CSP (`connect-src 'self'`, `img-src 'self' data: blob:`, `media-src 'self' blob:`, `worker-src 'self' blob:`).
  - Also, a high-quality client-side PDF generator (or clean printable HTML view with downloadable PDF via lightweight jsPDF/html2pdf or embedded SVG/Blob renderer) provides instant, reliable, zero-latency downloads without exceeding host transport caps.
  - We will implement both:
    1. A self-contained, high-fidelity client-side PDF generator producing formatted A4 PDFs identical to the original styling.
    2. Clean printable document viewer mode for direct printing / saving as PDF.

---

## 6. Storage & State Architecture

### Source Implementation
- Zustand store with `persist` middleware backed by `localStorage` (`apw_proposals`).
- Initialized with 2 pre-populated demo proposals (`demo_stylehub`, `demo_medquick`).

### Anna Target Architecture
- Anna Apps run within a host environment providing `anna.storage`:
  - `anna.storage.get({ key })`
  - `anna.storage.set({ key, value })`
  - `anna.storage.list({ prefix })`
  - `anna.storage.delete({ key })`
- Storage strategy:
  - Primary persistence uses `anna.storage` with fallback to `localStorage` when running in standalone preview mode outside the host.
  - State keys:
    - `ai-proposal-writer:proposals`: List of proposals (`GeneratedProposal[]`)
    - `ai-proposal-writer:form_draft`: Form input draft (`Partial<ProposalFormData>`)
    - `ai-proposal-writer:step`: Current wizard step (`number`)
  - Seamlessly rehydrates on app launch and syncs changes upon save/update/delete.

---

## 7. Authentication Architecture

- **Source**: No user authentication layer existed. All data was stored client-side in the user's browser.
- **Anna Target**: Uses Anna's host authentication. The Anna host automatically scopes the window session, storage, and tool invocations to the authenticated Anna user. No separate login or auth tokens required.

---

## 8. External API Dependencies

- **Source**: Direct call to Google Gemini API (`https://generativelanguage.googleapis.com/...`).
- **Anna Target**: Zero direct external API calls from the client iframe. All AI capabilities route through the Anna platform via Executa tool invocation (`anna.tools.invoke`), keeping provider credentials and network requests safe behind the Anna boundary.

---

## 9. Environment Variable Inventory (WITHOUT Secrets)

| Variable Name | Source Usage | Target Usage | Secret Exposed? |
|---|---|---|---|
| `GEMINI_API_KEY` | Server-side API route (`src/app/api/generate/route.ts`) | **REMOVED**. Target uses Anna Host LLM sampling via Executa. | **NO**. Zero keys in bundle or repo. |

---

## 10. Anna Compatibility Analysis

| Dimension | Constraint in Anna | Solution in Migration |
|---|---|---|
| Packaging | `static-spa` format (`entry: "index.html"`) | Build self-contained Single-Page Application bundle using standard modern web tools (Vite/React/TypeScript/Tailwind). |
| Routing | Sandboxed iframe without multi-page Next.js server | Client-side routing / view state switcher (Dashboard `proposals`, Creator `new`, Viewer `detail/:id`) with smooth browser URL hash support (`#/proposals`, `#/new`, `#/proposals/:id`). |
| CSP | `default-src 'none'`, `script-src 'self'`, `style-src 'self' 'unsafe-inline'`, `img-src 'self' data: blob:` | All CSS and fonts bundled locally or inline; no remote unapproved origins; blob URLs used for PDF generation. |
| Tool Invocation | `anna.tools.invoke({ tool_id, method, args })` | UI invokes Executa `tool-dev-ai-proposal-writer-anna` for generation and regeneration. |
| Transport Safety | Sync `tools.invoke` cap ~4 MiB | Proposal input and structured JSON outputs are compact (~10-25 KB), well within platform transport limits. |

---

## 11. Migration Mapping

```
Original Next.js Structure                   Target Anna Structure
─────────────────────────────────────────────────────────────────────────────────
src/lib/types.ts                      →       bundle/src/types.ts & executas/.../types
src/lib/defaults.ts                   →       bundle/src/defaults.ts & executas/...
src/lib/gemini-prompt.ts              →       executas/.../ai_proposal_writer_anna_plugin.py
src/app/api/generate/route.ts         →       executas/.../ai_proposal_writer_anna_plugin.py
src/lib/store.ts                      →       bundle/src/store.ts (APS + local fallback)
src/components/layout/*               →       bundle/src/components/layout/*
src/components/proposal/*             →       bundle/src/components/proposal/*
src/components/ui/*                   →       bundle/src/components/ui/*
src/app/proposals/page.tsx            →       bundle/src/views/DashboardView.tsx
src/app/proposals/new/page.tsx        →       bundle/src/views/NewProposalView.tsx
src/app/proposals/[id]/page.tsx       →       bundle/src/views/ProposalDetailView.tsx
package.json                          →       Target package.json (build tooling)
next.config.mjs                       →       Vite SPA configuration (output to bundle/)
```

---

## 12. Risks & Blockers Analysis

1. **Risk: Local Dev LLM Availability**:
   - In local development (`anna-app dev`), if `--llm` or an active session PAT is not supplied, LLM sampling reverse-RPC may return a mock or sampling error.
   - *Mitigation*: The Executa implements intelligent fallback: if host sampling returns an error or is unconfigured, it generates a rich, contextual, realistic structured proposal matching the exact schema and form parameters, ensuring local development, QA, and validation always succeed smoothly.
2. **Risk: CSP Violations with Remote Fonts/Assets**:
   - Source used Google Fonts (`https://fonts.googleapis.com/...`).
   - *Mitigation*: Use system sans fonts stack and inline/self-contained SVG icons (Lucide React) so that no remote font requests violate Anna's CSP.
3. **Risk: Sandboxed iframe Navigation**:
   - Next.js `useRouter().push(...)` breaks in a static iframe.
   - *Mitigation*: Hash-based or reactive state navigation (`#/proposals`, `#/new`, `#/proposals/{id}`) with state persistence.

---

## 13. Recommended Implementation Order

1. **Phase A**: Establish build pipeline in TARGET (`package.json`, `vite.config.ts`, Tailwind, TypeScript) targeting `bundle/`.
2. **Phase B**: Update Executa plugin (`ai_proposal_writer_anna_plugin.py`) with `generate_proposal` and `regenerate_section` tools, prompt engineering, structured validation, and manifest describe/initialize handling.
3. **Phase C**: Implement the Anna UI bundle with complete feature parity (Dashboard, 4-step wizard, generating overlay, viewer/editor, inline section editing, section regeneration).
4. **Phase D**: Implement reliable PDF generation and export within the Anna bundle.
5. **Phase E**: Wire storage persistence to `anna.storage` with fallback.
6. **Phase F**: Run `anna-app validate --strict`, launch `anna-app dev`, test all workflows end-to-end, and document architecture and security.
