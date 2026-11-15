# Privacy Policy — Aetherion Labs AI Proposal Writer

**Effective Date:** November 15, 2026  
**Product Version:** 3.0.0  
**Data Controller:** Aetherion Labs Inc.  
**Repository:** [https://github.com/hammad986/ai-proposal-writer-anna-executa](https://github.com/hammad986/ai-proposal-writer-anna-executa)  
**Anna App Listing:** [https://anna.partners/store/@hammad/ai-proposal-writer-anna](https://anna.partners/store/@hammad/ai-proposal-writer-anna)

---

## 1. Executive Summary & Privacy Principles

Aetherion Labs is committed to protecting the privacy, confidentiality, and competitive security of our users and their prospective clients. Enterprise proposals, bid strategies, pricing formulas, and corporate knowledge assets contain highly sensitive business secrets.

Our privacy architecture is built upon five non-negotiable principles:

1. **Zero Model Training on Customer Data:** Your proposal content, RFP solicitations, pricing tables, client briefs, and knowledge base documents are **never** used to train, fine-tune, or improve any public, third-party, or foundational machine learning models.
2. **Local Sandboxing & Host Isolation:** The application executes inside the hardened **Anna AI OS** sandboxed runtime (`static-spa`) with an isolated stdio JSON-RPC Executa plugin backend.
3. **Client-Side Data Ownership:** Proposal documents and company knowledge embeddings reside strictly in your Anna host environment (`anna.storage`) and your secure browser local state.
4. **Zero Ambient Audio Interception:** Voice recognition is 100% user-triggered, sessions terminate deterministically when you click Stop, and raw audio waveforms are never saved to disk or transmitted to audio data brokers.
5. **Deterministic Cryptographic Verification:** Digital signatures generated in the Client Portal utilize SHA-256 hashing for tamper-evident audit trails without storing biometric signature data.

---

## 2. Information We Process

### 2.1 Workspace & Proposal Configuration Data
- **Agency / Company Profiles:** Company legal name, brand colors, contact email, website, and industry focus.
- **Proposal Scoping Inputs:** Project title, client name, deliverables, technology stack requirements, milestone definitions, and pricing items.
- **Saved Documents:** Draft proposals, revision histories, compliance matrices, and exported deliverables (PDF, DOCX, CSV).

### 2.2 Corporate Knowledge Base (RAG System)
- Documents uploaded to the Aetherion Knowledge Base (e.g., past performance summaries, case studies, corporate certifications, security policies) are processed strictly into a local **Okapi-BM25 Inverted Index** within your workspace sandbox.
- Search index tokens and document chunks remain within your app storage and are never uploaded to public vector databases or shared multi-tenant stores.

### 2.3 RFP Solicitations & Bidding Documents
- Solicitation documents (PDF, DOCX, TXT, Markdown) uploaded for requirement shredding and compliance matrix generation are parsed ephemerally. Extracted line items and risk ratings belong exclusively to your workspace.

### 2.4 Voice & Speech Audio Streams
- When the Voice Proposal feature is activated, your browser's native Web Speech API (`SpeechRecognition`) processes spoken words in real time into text segments.
- No continuous listening occurs. No audio recordings, voice prints, or acoustic biometric data are captured, stored, or retained by Aetherion Labs.

---

## 3. How Data Is Processed & Architecture

The application communicates exclusively through documented, permission-bounded channels:

```
┌────────────────────────────────────────────────────────┐
│               Anna AI OS Host Environment              │
│                                                        │
│  ┌──────────────────────┐      ┌────────────────────┐  │
│  │ Iframe UI Bundle     │ ───► │ Anna App Host SDK  │  │
│  │ (Aetherion Labs 3.0) │ ◄─── │ anna.storage / rpc │  │
│  └──────────────────────┘      └────────────────────┘  │
│            ▲                             │             │
│            │ stdio JSON-RPC 2.0          ▼             │
│  ┌──────────────────────┐      ┌────────────────────┐  │
│  │ Executa Plugin       │      │ Local Browser KV   │  │
│  │ (Python Backend)     │      │ (IndexedDB Cache)  │  │
│  └──────────────────────┘      └────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

- **Manifest Capabilities:** Defined in `manifest.json`, restricting capabilities to:
  - `tools`: Bundled tool `tool-hammad-ai-proposal-writer-anna-84jkbu68` (or local development equivalent).
  - `storage`: Scoped key-value access (`get`, `set`, `delete`, `list`).
  - `window`: Standard window management (`set_title`, `ready`).
- No arbitrary external network requests (`fetch`/`xhr`) are made to third-party ad networks, telemetry trackers, or external marketing scripts.

---

## 4. Artificial Intelligence & LLM Data Protection

- **Reverse-RPC Sampling:** AI completions are brokered through the Anna Host's native LLM sampling interface (`sampling/createMessage`).
- **Prompt Sanitization:** The application automatically filters out system credentials and transient environment tokens prior to generating proposal sections.
- **Temporal Integrity Guard:** Date sanitization routines prevent historical model hallucination (e.g., guaranteeing proposal generation dates reflect the current operational date rather than stale training cutoff dates).

---

## 5. Security & Cryptographic Integrity

- **Transport & Storage Encryption:** In transit across Anna host IPC, communication is secured via memory-isolated message passing. Stored documents within Anna storage inherit host filesystem encryption.
- **Digital Signature Audit Trail:** The interactive Client Portal features an electronic acceptance block that calculates a SHA-256 digest of:
  - Proposal Document ID & Version
  - Final Agreed Commercial Total & Currency
  - Signer Name & Corporate Designation
  - UTC ISO-8601 Timestamp
- **No Third-Party Telemetry:** No Google Analytics, Segment, Meta Pixel, or behavioral tracking SDKs are bundled into the production release.

---

## 6. International Compliance & Data Rights

### 6.1 GDPR (General Data Protection Regulation — EU/UK)
Under the GDPR, Aetherion Labs acts as a software provider, and you remain the Data Controller of all client proposal data.
- **Right to Access & Portability:** You can export all proposal data, compliance matrices, and knowledge base entries at any time in standard formats (JSON, CSV, PDF, DOCX).
- **Right to Erasure (Right to be Forgotten):** Deleting a proposal from the Deal Pipeline or clearing the Knowledge Base permanently removes all associated keys from `anna.storage`.

### 6.2 CCPA / CPRA (California Consumer Privacy Act)
- We **do not sell** or **share** your personal or commercial business data for monetary or valuable consideration.
- We do not use sensitive personal information for inferring consumer characteristics.

---

## 7. Data Retention & Deletion

- **User Controlled:** Data persists in your Anna AI OS storage until you explicitly delete individual proposals, reset workspace settings, or uninstall the application.
- **Uninstallation:** Removing the application through the Anna Partners Store purges the application's scoped storage partition.

---

## 8. Changes to this Privacy Policy

We may update this Privacy Policy from time to time to reflect enhancements in product features or regulatory changes. Any updates will be committed to the official repository at:
[https://github.com/hammad986/ai-proposal-writer-anna-executa/blob/main/PRIVACY.md](https://github.com/hammad986/ai-proposal-writer-anna-executa/blob/main/PRIVACY.md)

---

## 9. Contact & Data Protection Officer

For privacy inquiries, audit questions, or enterprise data protection agreements, contact:

- **Organization:** Aetherion Labs Inc.
- **Data Protection Officer:** Hammad & Data Privacy Team
- **Email:** `privacy@aetherionlabs.com` / `support@anna.partners`
- **Security Incident Reporting:** `security@aetherionlabs.com`
