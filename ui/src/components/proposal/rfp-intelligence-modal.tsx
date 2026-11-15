import { useState, useRef } from 'react'
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sparkles,
  X,
  ShieldAlert,
  Clock,
  DollarSign,
  Wrench,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { invokeExecutaTool } from '@/anna-bridge'
import { shredRfpDocumentLocally } from '@/utils'
import type { FormStep1, FormStep2, FormStep3, RfpComplianceMatrix, RfpRequirement } from '@/types'

const PRESET_RFPS = [
  {
    title: 'Enterprise Fintech Mobile App RFP',
    filename: 'Fintech_App_RFP_2026.txt',
    text: `REQUEST FOR PROPOSAL: Next-Generation Mobile Banking & Wealth Platform
Client: Apex Global Financial Services
Submission Deadline: November 30, 2026
Budget Range: $45,000 to $70,000

1. MANDATORY REQUIREMENTS:
- The contractor SHALL implement biometric authentication (FaceID, fingerprint) with 2FA fallback.
- The platform MUST comply strictly with PCI-DSS Level 1 and GDPR data privacy standards.
- Real-time stock portfolio and balance synchronization via Plaid / OpenBanking APIs is MANDATORY.
- The mobile app MUST support offline caching for transaction histories.

2. TECHNICAL DELIVERABLES:
- Cross-platform iOS and Android codebase using React Native or Flutter.
- Microservices backend running on AWS ECS with PostgreSQL and Redis caching.
- Automated CI/CD pipelines deploying to Apple App Store and Google Play internal tracks.

3. TIMELINE & MILESTONES:
- Delivery window MUST NOT exceed 12 calendar weeks from contract execution.
- Phase 1 (Architecture & Wireframes): 3 weeks.
- Phase 2 (Core Banking Integrations): 5 weeks.
- Phase 3 (Beta Testing & Security Audit): 4 weeks.

4. COMMERCIAL TERMS:
- Fixed-price commercial milestones with 30% advance on signing, 40% on UAT milestone, 30% upon store release.
- 90-day post-launch critical bugfix warranty MUST be included.`,
  },
  {
    title: 'Healthcare AI Patient Portal RFP',
    filename: 'Healthcare_Portal_RFP.txt',
    text: `SOLICITATION FOR HEALTHCARE AI CLINICAL PORTAL
Client: BioHealth Regional Medical Center
Project: AI-Powered Clinical Intake & Patient Scheduling System
Budget Target: $35,000 - $50,000

MANDATORY COMPLIANCE:
- The system MUST be fully HIPAA compliant with BAA executed prior to development.
- End-to-end AES-256 encryption at rest and in transit is strictly REQUIRED.
- All patient medical record queries SHALL log immutable audit events for compliance inspection.

FUNCTIONAL SCOPE:
- Conversational AI triage agent to gather patient symptoms prior to doctor appointment.
- EHR/EMR bidirectional synchronization (HL7 FHIR standard).
- Telehealth video consultation room with WebRTC integration.
- Target delivery window is 8 to 10 weeks with 60-day post-launch warranty.`,
  },
]

export function RfpIntelligenceModal({
  onExtractSuccess,
  onClose,
  toast,
}: {
  onExtractSuccess: (data: {
    step1Patch: Partial<FormStep1>
    step2Patch: Partial<FormStep2>
    step3Patch: Partial<FormStep3>
    complianceMatrix: RfpComplianceMatrix
  }) => void
  onClose: () => void
  toast: {
    success: (msg: string) => void
    error: (msg: string) => void
  }
}) {
  const [rfpText, setRfpText] = useState('')
  const [sourceName, setSourceName] = useState('Client_RFP.txt')
  const [isShredding, setIsShredding] = useState(false)
  const [shreddedMatrix, setShreddedMatrix] = useState<RfpComplianceMatrix | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSourceName(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      if (content) {
        setRfpText(content)
        toast.success(`Loaded file: ${file.name}`)
      }
    }
    reader.onerror = () => {
      toast.error('Failed to read uploaded file.')
    }
    reader.readAsText(file)
  }

  const handleShred = async () => {
    if (!rfpText.trim()) {
      toast.error('Please upload an RFP document or paste solicitation text.')
      return
    }

    setIsShredding(true)
    try {
      let matrix: RfpComplianceMatrix | null = null

      try {
        const resp = await invokeExecutaTool<{ matrix: RfpComplianceMatrix }>('extract_rfp_matrix', {
          rfpText,
          sourceName,
        })
        if (resp?.matrix && Array.isArray(resp.matrix.requirements)) {
          matrix = resp.matrix
        }
      } catch {
        // Fallback to local shredder
        matrix = shredRfpDocumentLocally(rfpText, sourceName)
      }

      if (!matrix) {
        matrix = shredRfpDocumentLocally(rfpText, sourceName)
      }

      setShreddedMatrix(matrix)
      toast.success(`Extracted ${matrix.requirements.length} structured RFP requirements!`)
    } catch (err: any) {
      toast.error('Shredding failed: ' + (err?.message || 'Unknown error'))
    } finally {
      setIsShredding(false)
    }
  }

  const handleApplyToWizard = () => {
    if (!shreddedMatrix) return

    // Derive scoping wizard patches
    const mandatoryReqs = shreddedMatrix.requirements
      .filter((r) => r.category === 'mandatory' || r.category === 'technical')
      .map((r) => `- ${r.requirementText}`)
      .join('\n')

    const commercialReq = shreddedMatrix.requirements.find((r) => r.category === 'commercial')
    const budgetEstimate = commercialReq?.requirementText.match(/\$[\d,]+(?:\s*-\s*\$[\d,]+)?/)?.[0] || '$25,000 – $45,000'

    onExtractSuccess({
      step1Patch: {
        projectName: sourceName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
        problemStatement: `Client solicitation requires fulfillment of ${shreddedMatrix.requirements.length} discrete requirements across compliance, technical architecture, and milestones.`,
      },
      step2Patch: {
        keyFeatures: mandatoryReqs || 'Enterprise portal specifications from RFP solicitation.',
      },
      step3Patch: {
        budgetRange: budgetEstimate,
      },
      complianceMatrix: shreddedMatrix,
    })

    toast.success('RFP Compliance Matrix linked to proposal scoping wizard!')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl border bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground">AI RFP Shredder & Requirements Intelligence</h2>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary uppercase tracking-wider">
                  2.0 Intelligence
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Shred multi-page client briefs, PDFs, or RFPs to extract mandatory compliance clauses (`shall`, `must`) and generate a live compliance matrix.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {!shreddedMatrix ? (
            <>
              {/* File Upload Banner */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 bg-muted/10 hover:bg-muted/20 p-6 transition cursor-pointer text-center"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".txt,.md,.json,.doc,.docx"
                  className="hidden"
                />
                <Upload className="h-8 w-8 text-muted-foreground group-hover:text-primary transition mb-2" />
                <p className="text-xs font-semibold text-foreground">
                  Drop client RFP document here or click to browse
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Supports .txt, .md, .docx text extract, and client emails
                </p>
              </div>

              {/* Textarea */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Or Paste RFP / Scope Text Directly
                </label>
                <textarea
                  rows={8}
                  value={rfpText}
                  onChange={(e) => setRfpText(e.target.value)}
                  placeholder="Paste multi-page solicitation, client scope document, or statement of work (SOW)..."
                  className="w-full rounded-lg border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                />
              </div>

              {/* Sample Presets */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Or test with verified sample solicitations:</p>
                <div className="flex flex-wrap gap-2">
                  {PRESET_RFPS.map((p) => (
                    <button
                      key={p.title}
                      type="button"
                      onClick={() => {
                        setRfpText(p.text)
                        setSourceName(p.filename)
                      }}
                      className="rounded-md border bg-muted/40 hover:bg-muted px-3 py-1.5 text-xs font-medium text-foreground transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      {p.title}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Shredded Results View */
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-muted/30 p-4 rounded-xl border">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Shredded Requirements: {shreddedMatrix.requirements.length} Line Items
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Source: {shreddedMatrix.sourceDocumentName} &bull; Compliance Ready:{' '}
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {shreddedMatrix.overallComplianceScore}%
                    </span>
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShreddedMatrix(null)}>
                  Reshred Different Document
                </Button>
              </div>

              {/* Matrix Table */}
              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-muted/50 border-b text-muted-foreground font-semibold">
                    <tr>
                      <th className="p-3 w-24">Category</th>
                      <th className="p-3">Requirement Excerpt</th>
                      <th className="p-3 w-40">Target Section</th>
                      <th className="p-3 w-28 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {shreddedMatrix.requirements.map((req) => (
                      <tr key={req.id} className="hover:bg-muted/20">
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                              req.category === 'mandatory'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                : req.category === 'compliance'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                            }`}
                          >
                            {req.category}
                          </span>
                        </td>
                        <td className="p-3 text-foreground font-medium">
                          {req.requirementText}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {req.targetSectionTitle}
                        </td>
                        <td className="p-3 text-center">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <Check className="h-3 w-3" /> Covered
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-6 py-4 bg-muted/20">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>

          {!shreddedMatrix ? (
            <Button onClick={handleShred} disabled={isShredding || !rfpText.trim()}>
              {isShredding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Shredding RFP & Extracting Clauses...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Shred Document & Build Compliance Matrix
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleApplyToWizard} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Apply to Scoping Wizard & Generate Proposal
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
