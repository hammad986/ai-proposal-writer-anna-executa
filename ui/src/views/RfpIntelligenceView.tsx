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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { invokeExecutaTool } from '@/anna-bridge'
import { shredRfpDocumentLocally, downloadFile, formatLocalDate, addDaysToIso } from '@/utils'
import type { GeneratedProposal, ProposalFormData, RfpComplianceMatrix } from '@/types'
import { emptyFormData, normalizeProposal } from '@/defaults'

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
  const [matrix, setMatrix] = useState<RfpComplianceMatrix | null>(null)
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
    reader.readAsText(file)
  }

  const handleShred = async () => {
    if (!rfpText.trim()) {
      toast.error('Please upload an RFP or paste solicitation text.')
      return
    }

    setIsShredding(true)
    try {
      let result: RfpComplianceMatrix | null = null
      try {
        const resp = await invokeExecutaTool<{ matrix: RfpComplianceMatrix }>('extract_rfp_matrix', {
          rfpText,
          sourceName,
        })
        if (resp?.matrix && Array.isArray(resp.matrix.requirements)) {
          result = resp.matrix
        }
      } catch {
        result = shredRfpDocumentLocally(rfpText, sourceName)
      }

      if (!result) {
        result = shredRfpDocumentLocally(rfpText, sourceName)
      }

      setMatrix(result)
      toast.success(`Shredded ${result.requirements.length} structured requirements from RFP!`)
    } catch (e: any) {
      toast.error('Shredding failed: ' + e.message)
    } finally {
      setIsShredding(false)
    }
  }

  const handleCreateProposalFromMatrix = () => {
    if (!matrix) return

    const todayStr = formatLocalDate(new Date())
    const validUntilStr = addDaysToIso(todayStr, 30)

    const mandatoryFeatures = matrix.requirements
      .filter((r) => r.category === 'mandatory' || r.category === 'technical')
      .map((r, i) => `${i + 1}. ${r.requirementText}`)
      .join('\n')

    const commercialReq = matrix.requirements.find((r) => r.category === 'commercial')
    const budgetEstimate = commercialReq?.requirementText.match(/\$[\d,]+(?:\s*-\s*\$[\d,]+)?/)?.[0] || '$35,000 – $60,000'

    const formData: ProposalFormData = {
      step1: {
        ...emptyFormData.step1,
        projectName: sourceName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
        clientCompany: 'RFP Solicitation Partner',
        problemStatement: `Formal RFP solicitation response fulfilling ${matrix.requirements.length} discrete compliance, technical, and governance requirements.`,
      },
      step2: {
        ...emptyFormData.step2,
        keyFeatures: mandatoryFeatures || 'Production architecture specifications meeting all RFP criteria.',
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
      subtitle: `Formal Solicitation Response & Compliance Traceability`,
      generatedDate: todayStr,
      validUntil: validUntilStr,
      totalValue: budgetEstimate,
      status: 'review',
      formData,
      complianceMatrix: matrix,
      sections: [
        {
          id: 'sec_1',
          title: 'Executive Summary',
          content: `We are pleased to submit our formal response to the ${sourceName} solicitation.\n\nOur proposed technical solution fully adheres to the mandatory architecture, security controls, and timeline constraints set forth by your evaluation committee.`,
          type: 'text',
          isEdited: false,
        },
        {
          id: 'sec_2',
          title: 'RFP Compliance & Traceability Matrix',
          content: `### Requirements Traceability Overview\nThis proposal affirms 100% compliance with all stated solicitation specifications:\n\n` +
            matrix.requirements.map((r) => `- **[${r.category.toUpperCase()}]** ${r.requirementText}: *${r.complianceStatus.toUpperCase()}* (${r.responseSnippet || 'Satisfied in technical specification'}).`).join('\n'),
          type: 'text',
          isEdited: false,
        },
        {
          id: 'sec_3',
          title: 'Technical Scope & Deliverables',
          content: mandatoryFeatures || 'Core software engineering deliverables matching all functional requirements.',
          type: 'text',
          isEdited: false,
        },
        {
          id: 'sec_4',
          title: 'Project Timeline & Milestones',
          content: 'The engagement is structured into clear phased deliverables with formal user acceptance testing (UAT) sign-off prior to production handover.',
          type: 'text',
          isEdited: false,
        },
        {
          id: 'sec_5',
          title: 'Investment Schedule & Terms',
          content: `Total authorized commercial investment: ${budgetEstimate}.\n\nMilestone payments tied strictly to verified deliverable handovers and testing sign-offs.`,
          type: 'text',
          isEdited: false,
        },
      ],
    })

    onProposalCreated(proposal)
    onNavigateToStudio(proposal.id)
    toast.success('Generated RFP proposal with 2-Way Compliance Matrix in Studio!')
  }

  const handleExportCsv = () => {
    if (!matrix) return
    let csv = 'Category,Requirement,Target Section,Compliance Status,Response Snippet\n'
    for (const r of matrix.requirements) {
      csv += `"${r.category}","${r.requirementText.replace(/"/g, '""')}","${r.targetSectionTitle}","${r.complianceStatus}","${(r.responseSnippet || '').replace(/"/g, '""')}"\n`
    }
    downloadFile(csv, `${sourceName}_Compliance_Matrix.csv`, 'text/csv')
    toast.success('Exported compliance matrix to CSV!')
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              RFP Intelligence 3.0
            </span>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
              Clause Shredder
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-foreground">
            AI RFP Shredder & Compliance Matrix
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Ingest complex solicitation documents, extract mandatory compliance clauses (`shall`, `must`), and build an immutable 2-way compliance matrix.
          </p>
        </div>

        {matrix && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCsv} className="text-xs gap-1.5">
              <Download className="h-3.5 w-3.5" /> Export Matrix CSV
            </Button>
            <Button onClick={handleCreateProposalFromMatrix} size="sm" className="text-xs font-bold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground">
              <span>Create Proposal in Studio</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {!matrix ? (
        <Card className="border shadow-lg overflow-hidden">
          <CardContent className="p-8 space-y-6">
            {/* File Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary bg-muted/10 hover:bg-muted/20 p-8 transition cursor-pointer text-center"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".txt,.md,.json,.doc,.docx"
                className="hidden"
              />
              <Upload className="h-10 w-10 text-muted-foreground group-hover:text-primary transition mb-2" />
              <p className="text-sm font-bold text-foreground">Drop client RFP or SOW document here</p>
              <p className="text-xs text-muted-foreground mt-0.5">Supports .txt, .md, .docx text extracts, and RFP specifications</p>
            </div>

            {/* Direct Paste */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Or Paste RFP Solicitation Text
              </label>
              <textarea
                rows={8}
                value={rfpText}
                onChange={(e) => setRfpText(e.target.value)}
                placeholder="Paste client RFP requirements, statements of work, or email specifications here..."
                className="w-full rounded-xl border bg-background p-4 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono leading-relaxed"
              />
            </div>

            {/* Action */}
            <div className="flex justify-end">
              <Button
                onClick={handleShred}
                disabled={isShredding || !rfpText.trim()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs gap-2"
              >
                {isShredding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                <span>{isShredding ? 'Shredding Document...' : 'Shred RFP & Build Compliance Matrix'}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Shredded Matrix Results Table */
        <Card className="border shadow-lg overflow-hidden">
          <div className="border-b bg-muted/20 p-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Extracted Requirements ({matrix.requirements.length} Clauses)
              </h3>
              <p className="text-xs text-muted-foreground">
                Document: <strong className="text-foreground">{matrix.sourceDocumentName}</strong> &bull; Compliance Ready:{' '}
                <strong className="text-emerald-600 dark:text-emerald-400">{matrix.overallComplianceScore}%</strong>
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setMatrix(null)} className="text-xs">
              Upload Another RFP
            </Button>
          </div>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-muted/40 border-b text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-3 w-28">Category</th>
                    <th className="p-3">Buyer Requirement</th>
                    <th className="p-3 w-36">Assigned Section</th>
                    <th className="p-3 w-28 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {matrix.requirements.map((req) => (
                    <tr key={req.id} className="hover:bg-muted/15">
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          req.category === 'mandatory' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                        }`}>
                          {req.category}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-foreground">{req.requirementText}</td>
                      <td className="p-3 text-muted-foreground font-semibold">{req.targetSectionTitle}</td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" /> Compliant
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
