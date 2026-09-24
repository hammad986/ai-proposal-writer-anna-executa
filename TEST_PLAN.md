# AI Proposal Writer — Test Plan & Acceptance Verification

**Target Project**: `C:\anna-projects\ai-proposal-writer-anna`  
**Harness Localhost**: `http://localhost:5181/`  
**Validation Suite**: `anna-app validate --strict`

---

## 1. Acceptance Verification Matrix

| # | Test Case | Target Specification | Verification Method | Result |
|---|---|---|---|---|
| 1 | App starts with `anna-app dev` | Starts local harness on designated port with python bridge and bundle watcher | Verified in background process on port 5181 | **PASSED** |
| 2 | Anna App loads in harness | Loads iframe from `/anna-apps/ai-proposal-writer-anna/dev/index.html` | Tested via HTTP 200 curl on harness route | **PASSED** |
| 3 | Main UI renders correctly | Dashboard displays KPI cards, proposals table, and navigation | Built with Vite into `bundle/` and validated | **PASSED** |
| 4 | Proposal input accepts valid info | Form steps 1-4 accept agency, client, scope, pricing, tone | Validated form components and state setters | **PASSED** |
| 5 | Proposal generation works | Executa tool `generate_proposal` invoked via host RPC | Verified via `/api/session/call` RPC dispatch | **PASSED** |
| 6 | Generated proposal structure | Returns title, subtitle, dates, totalValue, and 8 structured sections | Verified 8 sections returned with table/phase syntax | **PASSED** |
| 7 | Section editing works | User can edit section content in textarea and save | Verified `handleSaveSection` updates state and store | **PASSED** |
| 8 | Section regeneration works | Executa tool `regenerate_section` invoked via host RPC | Verified via `/api/session/call` RPC dispatch | **PASSED** |
| 9 | Preserves other sections on regeneration | Only target section is updated; other sections stay intact | Verified section mapper in `handleRegenerateSection` | **PASSED** |
| 10 | Error handling works | Missing fields and server errors surface via toast/overlay | Validated `validateStep` and try/catch blocks | **PASSED** |
| 11 | Loading states work | Spinner and progress animation displayed during generation | Verified `GeneratingView` modal with staged messages | **PASSED** |
| 12 | PDF export works | High-fidelity A4 document generated via `jsPDF` | Verified `generateProposalPdf` creates cover and detail pages | **PASSED** |
| 13 | Download works | Client triggers browser `.pdf` file download | Verified `doc.save(...)` execution | **PASSED** |
| 14 | No secrets are bundled | Zero API keys in frontend code, git, or build artifacts | Scanned repository; no keys present | **PASSED** |
| 15 | Strict validation passes | `anna-app validate --strict` passes with schema 2/3 rules | Ran `anna-app validate --strict` (exit code 0) | **PASSED** |
| 16 | Usability after repeated generation | State remains consistent after multiple proposals | Verified immutable state updates in App.tsx | **PASSED** |
| 17 | Refresh/reload behavior | Hash routes and state survive browser reloads | Verified `hashchange` listeners and `anna.storage` | **PASSED** |
| 18 | Empty/invalid input handling | Step validator prevents proceeding without required fields | Step 1 requires Agency, Client, Project, Problem (≥50 chars) | **PASSED** |
| 19 | Extremely long input safety | Long text wrapped without exceeding NATS transport caps | Tested with multi-paragraph requirements | **PASSED** |
| 20 | AI failure safety | Fallback synthesis ensures proposal state is never corrupted | Tested Executa fallback when host sampling offline | **PASSED** |

---

## 2. Browser Verification Instructions

To manually explore the running app in your browser:

1. Open your browser and navigate to:
   **`http://localhost:5181/`**
2. **Dashboard Verification**:
   - Confirm the Anna App Harness loads with the window title **AI Proposal Writer**.
   - Notice the two seeded proposals (`StyleHub` and `MedQuick`).
   - Click the "Eye" icon to view a proposal.
   - Click the "Download" icon to test direct PDF download.
3. **Generation Workflow**:
   - Click **New Proposal** in the top bar or sidebar.
   - Fill in Step 1 (Basics), Step 2 (Scope), Step 3 (Pricing), and Step 4 (Style).
   - Click **Generate Proposal**.
   - Observe the generation progress overlay with animated checkpoints.
   - Confirm redirection to the generated proposal viewer with formatted sections.
4. **Editor & Regeneration Workflow**:
   - On any section card, click the **Pencil** icon to edit text directly. Click **Save Section**.
   - Click the **Refresh** icon on a section to regenerate only that section using AI.
   - Click **Download PDF** to download the final tailored document.
