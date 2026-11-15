import { useState, useRef } from 'react'
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Download,
  Search,
  HelpCircle,
  TrendingUp,
  AlertCircle,
  FileCheck,
  Check,
  Eye,
  SlidersHorizontal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  analyzeRfpDocument,
  autoAnswerRfpRequirements,
  type ComprehensiveRfpMatrix,
  type TraceableRfpRequirement,
  type RfpComplianceStatus,
  type AutoAnsweredQAResult,
} from '@/rfp-intelligence-engine'
import { downloadFile, formatLocalDate, addDaysToIso } from '@/utils'
import type { GeneratedProposal, ProposalFormData } from '@/types'
import { emptyFormData, normalizeProposal } from '@/defaults'
import { AetherionLogo } from '@/components/branding/AetherionLogo'

interface RfpIntelligenceViewProps {
  onProposalCreated: (proposal: GeneratedProposal) => void
  onNavigateToStudio: (proposalId: string) => void
  toast: {
    success: (msg: string) => void
    error: (msg: string) => void
    info: (msg: string) => void
  }
}

export function RfpIntelligenceView({
  onProposalCreated,
  onNavigateToStudio,
  toast,
}: RfpIntelligenceViewProps) {
  const [rfpText, setRfpText] = useState('')
  const [sourceName, setSourceName] = useState('Enterprise_RFP.txt')
  const [isShredding, setIsShredding] = useState(false)
  const [isAutoAnswering, setIsAutoAnswering] = useState(false)
  const [matrix, setMatrix] = useState<ComprehensiveRfpMatrix | null>(null)
  const [activeTab, setActiveTab] = useState<'traceability' | 'qa_responder' | 'risks'>('traceability')
  const [qaResults, setQaResults] = useState<AutoAnsweredQAResult[]>([])
  const [selectedReq, setSelectedReq] = useState<TraceableRfpRequirement | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('all')
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
        toast.success(`Loaded RFP document: ${file.name}`)
      }
    }
    reader.readAsText(file)
  }

  const handleShred = () => {
    if (!rfpText.trim()) {
      toast.error('Please upload an RFP or paste solicitation text first.')
      return
    }

    setIsShredding(true)
    setTimeout(() => {
      try {
        const result = analyzeRfpDocument(rfpText, sourceName)
        setMatrix(result)
        toast.success(`Parsed ${result.totalClauses} traceable requirements with Bid/No-Bid assessment!`)
      } catch (e: any) {
        toast.error('Shredding failed: ' + e.message)
      } finally {
        setIsShredding(false)
      }
    }, 400)
  }

  const handleAutoAnswerRfp = () => {
    if (!matrix) return
    setIsAutoAnswering(true)
    setTimeout(() => {
      try {
        const { updatedMatrix, qaResults: newQa } = autoAnswerRfpRequirements(matrix)
        setMatrix(updatedMatrix)
        setQaResults(newQa)
        setActiveTab('qa_responder')
        toast.success(`✨ Auto-answered ${newQa.length} RFP questions grounded with Knowledge Base citations!`)
      } catch (err: any) {
        toast.error('Auto-answer failed: ' + (err?.message || 'Unknown error'))
      } finally {
        setIsAutoAnswering(false)
      }
    }, 450)
  }

  const handleExportCsv = () => {
    if (!matrix || matrix.requirements.length === 0) return

    const headers = [
      'Code',
      'Category',
      'Priority',
      'Requirement Text',
      'Source Section',
      'Source Line',
      'Target Proposal Section',
      'Compliance Status',
      'Evidence / Response',
      'Approved',
    ]

    const rows = matrix.requirements.map((r) => [
      `"${r.code}"`,
      `"${r.category}"`,
      `"${r.priority}"`,
      `"${r.requirementText.replace(/"/g, '""')}"`,
      `"${r.sourceSection}"`,
      r.sourceLine,
      `"${r.targetProposalSection}"`,
      `"${r.complianceStatus}"`,
      `"${(r.evidenceOrResponse || '').replace(/"/g, '""')}"`,
      r.isApproved ? 'YES' : 'NO',
    ])

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    downloadFile(csvContent, `${sourceName.replace(/\.[^/.]+$/, '')}_compliance_matrix.csv`, 'text/csv')
    toast.success('RFP Compliance Matrix CSV exported!')
  }

  const handleUpdateRequirementStatus = (id: string, newStatus: RfpComplianceStatus) => {
    if (!matrix) return
    const updated = {
      ...matrix,
      requirements: matrix.requirements.map((r) =>
        r.id === id ? { ...r, complianceStatus: newStatus } : r
      ),
    }
    setMatrix(updated)
  }

  const handleToggleApproval = (id: string) => {
    if (!matrix) return
    const updated = {
      ...matrix,
      requirements: matrix.requirements.map((r) =>
        r.id === id ? { ...r, isApproved: !r.isApproved } : r
      ),
    }
    setMatrix(updated)
  }

  const handleCreateProposalFromMatrix = () => {
    if (!matrix) return

    const todayStr = formatLocalDate(new Date())
    const validUntilStr = addDaysToIso(todayStr, 30)

    const approvedRequirements = matrix.requirements.filter((r) => r.isApproved)
    const mandatoryFeatures = approvedRequirements
      .map((r, i) => `${i + 1}. [${r.code}] ${r.requirementText}`)
      .join('\n')

    const commercialReq = matrix.requirements.find((r) => r.category === 'commercial')
    const budgetEstimate = commercialReq?.requirementText.match(/\$[\d,]+(?:\s*-\s*\$[\d,]+)?/)?.[0] || '$35,000 – $60,000'

    const formData: ProposalFormData = {
      step1: {
        ...emptyFormData.step1,
        agencyName: 'Aetherion Labs',
        projectName: sourceName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
        clientCompany: 'RFP Evaluation Committee',
        problemStatement: `Formal solicitation response fulfilling ${approvedRequirements.length} discrete compliance, technical, and governance criteria detailed in ${sourceName}.`,
      },
      step2: {
        ...emptyFormData.step2,
        keyFeatures: mandatoryFeatures || 'Production architecture specifications meeting all solicitation criteria.',
      },
      step3: {
        ...emptyFormData.step3,
        budgetRange: budgetEstimate,
      },
      step4: {
        ...emptyFormData.step4,
        tone: 'technical',
      },
    }

    const proposal: GeneratedProposal = normalizeProposal({
      id: `prop_${Date.now()}`,
      title: `RFP Response: ${formData.step1.projectName}`,
      subtitle: `Formal Solicitation Response & Compliance Traceability Matrix`,
      generatedDate: todayStr,
      validUntil: validUntilStr,
      totalValue: budgetEstimate,
      status: 'review',
      formData,
      sections: [
        {
          id: 'sec_1',
          title: 'Executive Summary & Bid Alignment',
          content: `Aetherion Labs is pleased to submit this formal proposal in response to the ${sourceName} solicitation.\n\nOur proposed architecture demonstrates ${matrix.assessment.score}% alignment with stated criteria, backed by verifiable engineering standards and rigorous delivery governance.`,
          type: 'text',
          isEdited: false,
        },
        {
          id: 'sec_2',
          title: 'RFP Compliance & Traceability Matrix',
          content:
            `### Requirements Traceability Overview\n` +
            `This proposal directly addresses all ${approvedRequirements.length} approved solicitation requirements with verifiable commitments:\n\n` +
            approvedRequirements
              .map(
                (r) =>
                  `- **[${r.code}] (${r.category.toUpperCase()} - Line ${r.sourceLine})**: ${r.requirementText}\n  *Status: ${r.complianceStatus.replace(/_/g, ' ').toUpperCase()}* &mdash; ${r.evidenceOrResponse}`
              )
              .join('\n\n'),
          type: 'text',
          isEdited: false,
        },
        {
          id: 'sec_3',
          title: 'Scope of Work & Technical Deliverables',
          content: mandatoryFeatures || 'Core software engineering deliverables matching all functional requirements.',
          type: 'text',
          isEdited: false,
        },
        {
          id: 'sec_4',
          title: 'Implementation Timeline & Milestone Governance',
          content: `Delivery schedule structured around agile 2-week verification sprints to ensure deadline compliance without scope slippage.`,
          type: 'text',
          isEdited: false,
        },
        {
          id: 'sec_5',
          title: 'Commercial Terms & Investment Schedule',
          content: `Authorized investment: ${budgetEstimate}.\n\nPayment schedule tied to milestone UAT sign-off with clear acceptance gates.`,
          type: 'text',
          isEdited: false,
        },
      ],
    })

    onProposalCreated(proposal)
    onNavigateToStudio(proposal.id)
    toast.success('RFP Proposal generated and loaded into Proposal Studio!')
  }

  const filteredRequirements = matrix?.requirements.filter((r) => {
    if (filterCategory === 'all') return true
    return r.category === filterCategory
  }) || []

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <FileCheck className="h-3.5 w-3.5" />
              Advanced RFP Intelligence 3.0
            </span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              Traceability Matrix &amp; Bid/No-Bid
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-foreground">
            AI RFP Shredder &amp; Compliance Matrix
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Ingest complex RFP solicitations, extract mandatory clauses, evaluate Bid/No-Bid viability, and generate 100% traceable proposal responses.
          </p>
        </div>

        {matrix && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleAutoAnswerRfp}
              disabled={isAutoAnswering}
              className="gap-1.5 text-xs font-bold text-primary border-primary/30 hover:bg-primary/10 cursor-pointer shadow-xs"
            >
              {isAutoAnswering ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Auto-Answering with RAG...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Auto-Answer with RAG
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportCsv}
              className="gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
            <Button
              size="sm"
              onClick={handleCreateProposalFromMatrix}
              className="gap-1.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-md"
            >
              <span>Build Proposal in Studio</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Ingestion & Document Drop Zone */}
      <Card className="border-2 shadow-sm overflow-hidden">
        <CardContent className="p-6 space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/5 hover:bg-muted/10 p-6 text-center transition cursor-pointer"
          >
            <Upload className="h-8 w-8 text-primary mb-2" />
            <h4 className="text-sm font-bold text-foreground">Drop Client RFP or SOW Document Here</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Supports .txt, .md, .docx text extracts, and raw solicitation specifications
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.json,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Or Paste RFP Solicitation Text Directly
            </label>
            <textarea
              rows={5}
              value={rfpText}
              onChange={(e) => setRfpText(e.target.value)}
              placeholder="Paste client RFP requirements, technical specifications, deadlines, evaluation criteria, and terms here..."
              className="w-full rounded-xl border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between border-t pt-3">
            <span className="text-[11px] text-muted-foreground">
              Source Name: <strong className="text-foreground">{sourceName}</strong>
            </span>
            <Button
              onClick={handleShred}
              disabled={isShredding || !rfpText.trim()}
              className="gap-2 font-semibold"
            >
              {isShredding ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Shredding Document...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Shred RFP &amp; Analyze Viability
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results View */}
      {matrix && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
          {/* Bid / No-Bid Assessment Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border p-4 bg-card shadow-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Bid / No-Bid Verdict
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-black tracking-tight ${
                    matrix.assessment.verdict === 'STRONG_BID'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : matrix.assessment.verdict === 'BID_WITH_CLARIFICATIONS'
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : 'bg-rose-500/10 text-rose-600'
                  }`}
                >
                  {matrix.assessment.verdict.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground pt-1">
                Win Probability: <strong className="text-foreground">{matrix.assessment.winProbability}%</strong>
              </p>
            </Card>

            <Card className="border p-4 bg-card shadow-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Viability Score
              </span>
              <p className="text-2xl font-black text-primary">{matrix.assessment.score}/100</p>
              <p className="text-[11px] text-muted-foreground">
                Compliance Alignment: {matrix.complianceScore}%
              </p>
            </Card>

            <Card className="border p-4 bg-card shadow-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Traceable Clauses
              </span>
              <p className="text-2xl font-black text-foreground">{matrix.totalClauses}</p>
              <p className="text-[11px] text-muted-foreground">
                Mandatory: {matrix.assessment.mandatoryCount} items
              </p>
            </Card>

            <Card className="border p-4 bg-card shadow-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Open Action Gaps
              </span>
              <p className="text-2xl font-black text-amber-500">
                {matrix.clarificationCount + matrix.unaddressedCount}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Clarifications: {matrix.clarificationCount}
              </p>
            </Card>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-border text-xs font-bold gap-2">
            <button
              onClick={() => setActiveTab('traceability')}
              className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'traceability'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileCheck className="h-4 w-4" />
              Traceability Matrix ({filteredRequirements.length})
            </button>
            <button
              onClick={() => setActiveTab('qa_responder')}
              className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'qa_responder'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sparkles className="h-4 w-4 text-primary" />
              Smart Q&amp;A Auto-Responder ({qaResults.length > 0 ? qaResults.length : matrix.requirements.length})
            </button>
            <button
              onClick={() => setActiveTab('risks')}
              className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'risks'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Bidding Risks &amp; Clarifications
            </button>
          </div>

          {/* TAB 1: Traceability Matrix Table */}
          {activeTab === 'traceability' && (
            <Card className="border shadow-md overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b bg-muted/20 px-4 py-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-foreground">
                    Traceable Requirements &amp; Compliance Matrix ({filteredRequirements.length})
                  </h3>
                </div>

                {/* Category Filter */}
                <div className="flex items-center gap-2 text-xs">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="rounded-lg border bg-background px-2.5 py-1 text-xs font-semibold text-foreground focus:outline-none"
                  >
                    <option value="all">All Categories ({matrix.requirements.length})</option>
                    <option value="mandatory">Mandatory</option>
                    <option value="security">Security</option>
                    <option value="timeline">Timeline</option>
                    <option value="commercial">Commercial</option>
                    <option value="functional">Functional</option>
                    <option value="integration">Integration</option>
                    <option value="deliverables">Deliverables</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b bg-muted/30 text-muted-foreground font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Approve</th>
                      <th className="py-2.5 px-3">Code</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Requirement &amp; Source Location</th>
                      <th className="py-2.5 px-3">Compliance Status</th>
                      <th className="py-2.5 px-3">Proposed Commitment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredRequirements.map((req) => (
                      <tr
                        key={req.id}
                        className={`hover:bg-muted/10 transition ${
                          !req.isApproved ? 'opacity-40 line-through' : ''
                        }`}
                      >
                        <td className="py-3 px-3">
                          <input
                            type="checkbox"
                            checked={req.isApproved}
                            onChange={() => handleToggleApproval(req.id)}
                            className="h-4 w-4 rounded text-primary cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-primary">{req.code}</td>
                        <td className="py-3 px-3">
                          <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            {req.category}
                          </span>
                        </td>
                        <td className="py-3 px-3 max-w-md">
                          <p className="font-medium text-foreground">{req.requirementText}</p>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            Source: {req.sourceSection} (Line {req.sourceLine})
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <select
                            value={req.complianceStatus}
                            onChange={(e) =>
                              handleUpdateRequirementStatus(req.id, e.target.value as RfpComplianceStatus)
                            }
                            className="rounded-lg border bg-background px-2 py-1 text-[11px] font-semibold text-foreground focus:outline-none"
                          >
                            <option value="addressed_with_evidence">Addressed with Evidence</option>
                            <option value="partially_addressed">Partially Addressed</option>
                            <option value="requires_clarification">Requires Clarification</option>
                            <option value="not_addressed">Not Addressed</option>
                            <option value="not_applicable">Not Applicable</option>
                          </select>
                        </td>
                        <td className="py-3 px-3 text-muted-foreground text-[11px] max-w-xs truncate">
                          {req.evidenceOrResponse || 'Direct commitment in proposal'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* TAB 2: Smart Q&A Auto-Responder */}
          {activeTab === 'qa_responder' && (
            <div className="space-y-4">
              {qaResults.length === 0 ? (
                <Card className="p-8 text-center border-dashed border-2 bg-muted/10 space-y-4">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div className="max-w-md mx-auto space-y-1">
                    <h3 className="text-base font-bold text-foreground">
                      Auto-Answer RFP Questions with Verified Knowledge
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Match every extracted RFP requirement against Aetherion Labs corporate knowledge base using Okapi-BM25 retrieval to generate verifiable answers with exact citations.
                    </p>
                  </div>
                  <Button
                    onClick={handleAutoAnswerRfp}
                    disabled={isAutoAnswering}
                    className="gap-2 font-bold cursor-pointer"
                  >
                    {isAutoAnswering ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating Grounded Answers...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        ⚡ Run Auto-Answer on All {matrix.requirements.length} Requirements
                      </>
                    )}
                  </Button>
                </Card>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-xl p-4">
                    <div>
                      <h4 className="text-sm font-bold text-foreground">
                        {qaResults.length} Verified RFP Responses Grounded
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        All responses include source document citations and have been auto-injected into the active compliance matrix.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        const updated = matrix.requirements.map((r) => ({ ...r, isApproved: true }))
                        setMatrix({ ...matrix, requirements: updated })
                        toast.success('All Q&A responses approved!')
                      }}
                      className="text-xs font-semibold gap-1.5"
                    >
                      <Check className="h-3.5 w-3.5" /> Approve All Responses
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {qaResults.map((qa) => (
                      <Card key={qa.requirementId} className="border p-4 bg-card shadow-xs space-y-3">
                        <div className="flex items-center justify-between border-b pb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-primary">{qa.code}</span>
                            <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              {qa.category}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            {qa.confidenceScore}% Confidence
                          </span>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Solicitation Requirement:
                          </label>
                          <p className="text-xs font-medium text-foreground mt-0.5 leading-snug">
                            {qa.questionText}
                          </p>
                        </div>

                        <div className="rounded-lg border bg-muted/15 p-2.5 space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-primary">
                              Grounded Aetherion Commitment:
                            </label>
                            <span className="text-[9px] font-mono text-muted-foreground">
                              {qa.citationLabel}
                            </span>
                          </div>
                          <p className="text-xs text-foreground leading-relaxed">
                            {qa.answerText}
                          </p>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Bidding Risks & Clarifications */}
          {activeTab === 'risks' && (
            <div className="space-y-4">
              {matrix.assessment.criticalRisks.length > 0 && (
                <Card className="border border-rose-500/30 bg-rose-500/5 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-700 dark:text-rose-300">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Identified Contractual Risks &amp; Scope Liabilities:</span>
                  </div>
                  <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
                    {matrix.assessment.criticalRisks.map((risk, idx) => (
                      <li key={idx}>{risk}</li>
                    ))}
                  </ul>
                </Card>
              )}

              {matrix.assessment.clarificationQuestions.length > 0 && (
                <Card className="border border-blue-500/30 bg-blue-500/5 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-300">
                    <HelpCircle className="h-4 w-4" />
                    <span>Recommended Clarification Questions for Procurement Contact:</span>
                  </div>
                  <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
                    {matrix.assessment.clarificationQuestions.map((q, idx) => (
                      <li key={idx}>{q}</li>
                    ))}
                  </ul>
                </Card>
              )}

              {matrix.assessment.keyStrengths.length > 0 && (
                <Card className="border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Key Competitive Win Themes:</span>
                  </div>
                  <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
                    {matrix.assessment.keyStrengths.map((str, idx) => (
                      <li key={idx}>{str}</li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
