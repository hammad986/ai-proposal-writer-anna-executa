import { useState } from 'react'
import {
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  X,
  PlusCircle,
  Download,
  Search,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { downloadFile } from '@/utils'
import type { GeneratedProposal, RfpComplianceMatrix, RfpRequirement } from '@/types'

export function RfpComplianceMatrixModal({
  proposal,
  onUpdateProposal,
  onClose,
  toast,
}: {
  proposal: GeneratedProposal
  onUpdateProposal: (updated: GeneratedProposal) => void
  onClose: () => void
  toast: {
    success: (msg: string) => void
    error: (msg: string) => void
  }
}) {
  const matrix = proposal.complianceMatrix
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  if (!matrix || !matrix.requirements || matrix.requirements.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
        <div className="relative w-full max-w-lg rounded-xl border bg-card p-6 shadow-2xl space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-600">
            <FileCheck className="h-6 w-6" />
          </div>
          <h2 className="text-base font-bold text-foreground">No RFP Matrix Linked</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            This proposal was generated without an ingested RFP document. You can attach an RFP specification or statement of work (SOW) anytime to initiate 2-way compliance tracking.
          </p>
          <div className="pt-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const filteredRequirements = matrix.requirements.filter((r) => {
    const matchesCat = filterCategory === 'all' || r.category === filterCategory
    const matchesSearch =
      r.requirementText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.targetSectionTitle && r.targetSectionTitle.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCat && matchesSearch
  })

  const handleInjectClause = (req: RfpRequirement) => {
    const targetTitle = req.targetSectionTitle || 'Scope of Work'
    const sectionIndex = proposal.sections.findIndex(
      (s) => s.title.toLowerCase() === targetTitle.toLowerCase() || s.id === req.targetSectionId
    )

    if (sectionIndex === -1) {
      toast.error(`Target section '${targetTitle}' not found in proposal.`)
      return
    }

    const currentSection = proposal.sections[sectionIndex]
    const complianceClause = `\n\n### RFP Compliance Affirmation [${req.category.toUpperCase()}]\n**Requirement:** ${req.requirementText}\n**Response & Deliverable:** Verified strictly fulfilled. Our technical implementation architecture adheres explicitly to this specification without deviation.\n`

    const updatedSections = [...proposal.sections]
    updatedSections[sectionIndex] = {
      ...currentSection,
      content: currentSection.content + complianceClause,
      isEdited: true,
    }

    // Update requirement status
    const updatedRequirements = matrix.requirements.map((r) =>
      r.id === req.id
        ? {
            ...r,
            complianceStatus: 'compliant' as const,
            responseSnippet: `Fulfilled via affirmative clause in '${currentSection.title}'.`,
          }
        : r
    )

    const compliantCount = updatedRequirements.filter((r) => r.complianceStatus === 'compliant').length
    const score = Math.round((compliantCount / updatedRequirements.length) * 100)

    const updatedProposal: GeneratedProposal = {
      ...proposal,
      sections: updatedSections,
      complianceMatrix: {
        ...matrix,
        requirements: updatedRequirements,
        overallComplianceScore: score,
        gapCount: updatedRequirements.filter((r) => r.complianceStatus !== 'compliant').length,
      },
      updatedAt: new Date().toISOString(),
    }

    onUpdateProposal(updatedProposal)
    toast.success(`Injected compliance clause into '${currentSection.title}'!`)
  }

  const handleExportCsv = () => {
    let csv = 'Category,Requirement,Target Section,Compliance Status,Response Snippet\n'
    for (const r of matrix.requirements) {
      csv += `"${r.category}","${r.requirementText.replace(/"/g, '""')}","${r.targetSectionTitle}","${r.complianceStatus}","${(r.responseSnippet || '').replace(/"/g, '""')}"\n`
    }
    downloadFile(csv, `${proposal.title.replace(/\s+/g, '_')}_RFP_Compliance_Matrix.csv`, 'text/csv')
    toast.success('RFP Compliance Matrix exported to CSV!')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col rounded-xl border bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground">RFP Requirements Compliance Matrix</h2>
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                  {matrix.overallComplianceScore}% Compliant
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Document: <span className="font-semibold text-foreground">{matrix.sourceDocumentName}</span> &bull;{' '}
                {matrix.requirements.length} Tracked Requirements &bull; {matrix.gapCount} Disqualification Gaps
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCsv} className="h-8 text-xs gap-1.5">
              <Download className="h-3.5 w-3.5" /> Export Matrix CSV
            </Button>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-3 bg-muted/10">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {['all', 'mandatory', 'technical', 'timeline', 'commercial', 'compliance'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${
                  filterCategory === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter requirement text..."
              className="w-full rounded-md border bg-background pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="border rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-muted/50 border-b text-muted-foreground font-semibold">
                <tr>
                  <th className="p-3 w-28">Category</th>
                  <th className="p-3">Buyer Requirement Clause</th>
                  <th className="p-3 w-36">Target Section</th>
                  <th className="p-3 w-32 text-center">Status</th>
                  <th className="p-3 w-36 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRequirements.map((req) => (
                  <tr key={req.id} className="hover:bg-muted/15 transition">
                    <td className="p-3 align-top">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
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
                    <td className="p-3 align-top">
                      <p className="font-semibold text-foreground text-xs">{req.requirementText}</p>
                      {req.responseSnippet && (
                        <p className="text-[11px] text-muted-foreground mt-1 bg-muted/30 p-1.5 rounded border border-border/50">
                          {req.responseSnippet}
                        </p>
                      )}
                    </td>
                    <td className="p-3 align-top font-medium text-muted-foreground">
                      {req.targetSectionTitle || 'Scope of Work'}
                    </td>
                    <td className="p-3 align-top text-center">
                      {req.complianceStatus === 'compliant' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" /> Fully Compliant
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="h-3 w-3" /> Gap Detected
                        </span>
                      )}
                    </td>
                    <td className="p-3 align-top text-right">
                      {req.complianceStatus !== 'compliant' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleInjectClause(req)}
                          className="h-7 text-[11px] gap-1 text-primary hover:text-primary hover:bg-primary/10 border-primary/30"
                        >
                          <PlusCircle className="h-3 w-3" /> Inject Clause
                        </Button>
                      ) : (
                        <span className="text-[11px] text-muted-foreground font-medium">Satisfied</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-6 py-4 bg-muted/20">
          <p className="text-xs text-muted-foreground">
            Compliance matrix is automatically packaged into Word (.docx) and PDF export appendices.
          </p>
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    </div>
  )
}
