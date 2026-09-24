import { useState } from 'react'
import { ArrowLeft, Download, PenLine, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { SectionCard } from '@/components/proposal/section-card'
import { StatusBadge } from '@/components/ui/status-badge'
import { invokeExecutaTool } from '@/anna-bridge'
import { generateProposalPdf } from '@/pdf-generator'
import type { GeneratedProposal, ProposalSection } from '@/types'

export function ProposalDetailView({
  proposal,
  onUpdateProposal,
  onNavigate,
  onEditInputs,
  toast,
}: {
  proposal: GeneratedProposal
  onUpdateProposal: (updated: GeneratedProposal) => void
  onNavigate: (route: string) => void
  onEditInputs: (proposal: GeneratedProposal) => void
  toast: {
    success: (msg: string) => void
    error: (msg: string) => void
  }
}) {
  const [regeneratingSectionId, setRegeneratingSectionId] = useState<string | null>(null)
  const [isPdfGenerating, setIsPdfGenerating] = useState(false)

  const handleDownloadPdf = () => {
    setIsPdfGenerating(true)
    try {
      generateProposalPdf(proposal)
      toast.success('Proposal PDF downloaded')
    } catch (e: any) {
      toast.error('Failed to download PDF: ' + (e?.message || 'Unknown error'))
    } finally {
      setIsPdfGenerating(false)
    }
  }

  const handleSaveSection = (sectionId: string, newContent: string) => {
    const updatedSections = proposal.sections.map((s) =>
      s.id === sectionId ? { ...s, content: newContent, isEdited: true } : s
    )
    const updated: GeneratedProposal = {
      ...proposal,
      sections: updatedSections,
      updatedAt: new Date().toISOString(),
    }
    onUpdateProposal(updated)
    toast.success('Section saved')
  }

  const handleRegenerateSection = async (sectionId: string) => {
    const section = proposal.sections.find((s) => s.id === sectionId)
    if (!section) return

    setRegeneratingSectionId(sectionId)
    try {
      const response = await invokeExecutaTool<{ section: ProposalSection }>(
        'regenerate_section',
        {
          formData: proposal.formData,
          sectionTitle: section.title,
          currentContent: section.content,
        }
      )

      if (!response?.section) {
        throw new Error('Executa did not return a valid regenerated section.')
      }

      const updatedSections = proposal.sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              ...response.section,
              id: s.id,
              isEdited: false,
            }
          : s
      )

      const updated: GeneratedProposal = {
        ...proposal,
        sections: updatedSections,
        updatedAt: new Date().toISOString(),
      }

      onUpdateProposal(updated)
      toast.success(`"${section.title}" regenerated successfully!`)
    } catch (err: any) {
      console.error('Section regeneration failed:', err)
      toast.error(err.message || 'Failed to regenerate section')
    } finally {
      setRegeneratingSectionId(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top action header */}
      <header className="sticky top-0 z-20 border-b bg-background/95 px-4 py-3 backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Proposals
          </button>

          <h1 className="max-w-md truncate text-sm font-semibold md:text-base text-foreground">
            {proposal.title}
          </h1>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => onEditInputs(proposal)}>
              <PenLine className="h-4 w-4" />
              Edit Inputs
            </Button>
            <Button size="sm" onClick={handleDownloadPdf} disabled={isPdfGenerating}>
              <Download className="h-4 w-4" />
              {isPdfGenerating ? 'Preparing PDF...' : 'Download PDF'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => onNavigate('new')}>
              <Sparkles className="h-4 w-4" />
              New Proposal
            </Button>
          </div>
        </div>
      </header>

      {/* Main viewer grid */}
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[240px_1fr] md:px-8">
        {/* Table of contents sticky sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 rounded-lg border bg-card p-4 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Contents
            </p>
            <nav className="space-y-1">
              {proposal.sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="block rounded-md px-2.5 py-1.5 text-xs md:text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  {section.title}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content sections column */}
        <div className="space-y-5 min-w-0">
          {/* Metadata card */}
          <Card className="p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                  {proposal.title}
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground">{proposal.subtitle}</p>
              </div>
              <StatusBadge status={proposal.status} />
            </div>

            <div className="mt-6 grid gap-3 text-xs md:text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4 border-t pt-4">
              <div>
                <span className="block text-xs uppercase text-muted-foreground/80">Generated</span>
                <span className="font-medium text-foreground">{proposal.generatedDate}</span>
              </div>
              <div>
                <span className="block text-xs uppercase text-muted-foreground/80">Valid until</span>
                <span className="font-medium text-foreground">{proposal.validUntil}</span>
              </div>
              <div>
                <span className="block text-xs uppercase text-muted-foreground/80">Client</span>
                <span className="font-medium text-foreground">
                  {proposal.formData.step1.clientName || 'Client'},{' '}
                  {proposal.formData.step1.clientCompany || 'Company'}
                </span>
              </div>
              <div>
                <span className="block text-xs uppercase text-muted-foreground/80">Investment</span>
                <span className="font-semibold text-primary">{proposal.totalValue}</span>
              </div>
            </div>
          </Card>

          {/* Section cards */}
          {proposal.sections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              onSave={(content) => handleSaveSection(section.id, content)}
              onRegenerate={() => handleRegenerateSection(section.id)}
              isRegenerating={regeneratingSectionId === section.id}
            />
          ))}
        </div>
      </main>
    </div>
  )
}
