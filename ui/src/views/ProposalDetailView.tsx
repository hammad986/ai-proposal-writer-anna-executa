import { useState } from 'react'
import {
  ArrowLeft,
  Download,
  Eye,
  History,
  PenLine,
  Plus,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  DollarSign,
  Tag,
  CheckCircle2,
  Clock,
  Layers,
  FileText,
  BarChart3,
  Lock,
  BookOpen,
  GitCompare,
  Globe,
  TrendingUp,
  ShieldAlert,
  Presentation,
  FileQuestion,
  MessageSquare,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { SectionCard } from '@/components/proposal/section-card'
import { StatusBadge } from '@/components/ui/status-badge'
import { QualityAuditModal } from '@/components/proposal/quality-audit-modal'
import { ClientPreviewModal } from '@/components/proposal/client-preview-modal'
import { VersionHistoryModal } from '@/components/proposal/version-history-modal'
import { PricingBuilder } from '@/components/proposal/pricing-builder'
import { AnalyticsDrawer } from '@/components/proposal/analytics-drawer'
import { ContentLibraryModal } from '@/components/proposal/content-library-modal'
import { VersionDiffModal } from '@/components/proposal/version-diff-modal'
import { SecuritySettingsModal } from '@/components/proposal/security-settings-modal'
import { DealHealthModal } from '@/components/proposal/deal-health-modal'
import { RiskScannerModal } from '@/components/proposal/risk-scanner-modal'
import { PitchDeckModal } from '@/components/proposal/pitch-deck-modal'
import { DiscoveryQuestionsModal } from '@/components/proposal/discovery-questions-modal'
import { ClientCommentsDrawer } from '@/components/proposal/client-comments-drawer'
import { invokeExecutaTool } from '@/anna-bridge'
import { generateProposalPdf } from '@/pdf-generator'
import {
  calculatePricingTotals,
  formatCurrency,
  exportProposalAsHtml,
  exportProposalAsMarkdown,
  downloadFile,
} from '@/utils'
import type { GeneratedProposal, ProposalSection, ProposalStatus } from '@/types'

const STATUS_OPTIONS: Array<{ value: ProposalStatus; label: string }> = [
  { value: 'draft', label: 'Draft' },
  { value: 'review', label: 'In Review' },
  { value: 'sent', label: 'Sent to Client' },
  { value: 'accepted', label: 'Accepted / Won' },
  { value: 'rejected', label: 'Declined' },
  { value: 'archived', label: 'Archived' },
]

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
  const [showAuditModal, setShowAuditModal] = useState(false)
  const [showClientModal, setShowClientModal] = useState(false)
  const [showVersionModal, setShowVersionModal] = useState(false)
  const [showPricingBuilder, setShowPricingBuilder] = useState(false)
  const [showAddSectionModal, setShowAddSectionModal] = useState(false)
  const [showAnalyticsDrawer, setShowAnalyticsDrawer] = useState(false)
  const [showLibraryModal, setShowLibraryModal] = useState(false)
  const [showDiffModal, setShowDiffModal] = useState(false)
  const [showSecurityModal, setShowSecurityModal] = useState(false)
  const [showDealHealthModal, setShowDealHealthModal] = useState(false)
  const [showRiskScannerModal, setShowRiskScannerModal] = useState(false)
  const [showPitchDeckModal, setShowPitchDeckModal] = useState(false)
  const [showDiscoveryModal, setShowDiscoveryModal] = useState(false)
  const [showCommentsDrawer, setShowCommentsDrawer] = useState(false)
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [newSectionType, setNewSectionType] = useState<ProposalSection['type']>('text')

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

  const handleSaveSection = (
    sectionId: string,
    newContent: string,
    type?: ProposalSection['type']
  ) => {
    const updatedSections = proposal.sections.map((s) =>
      s.id === sectionId
        ? {
            ...s,
            content: newContent,
            type: type || s.type,
            isEdited: true,
          }
        : s
    )
    const updated: GeneratedProposal = {
      ...proposal,
      sections: updatedSections,
      updatedAt: new Date().toISOString(),
    }
    onUpdateProposal(updated)
    toast.success('Section saved')
  }

  const handleUpdateSectionTitle = (sectionId: string, newTitle: string) => {
    const updatedSections = proposal.sections.map((s) =>
      s.id === sectionId ? { ...s, title: newTitle, isEdited: true } : s
    )
    const updated: GeneratedProposal = {
      ...proposal,
      sections: updatedSections,
      updatedAt: new Date().toISOString(),
    }
    onUpdateProposal(updated)
    toast.success('Section title updated')
  }

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= proposal.sections.length) return

    const newSections = [...proposal.sections]
    const temp = newSections[index]
    newSections[index] = newSections[targetIndex]
    newSections[targetIndex] = temp

    const updated: GeneratedProposal = {
      ...proposal,
      sections: newSections,
      updatedAt: new Date().toISOString(),
    }
    onUpdateProposal(updated)
  }

  const handleDeleteSection = (sectionId: string) => {
    const target = proposal.sections.find((s) => s.id === sectionId)
    if (!target) return
    const updatedSections = proposal.sections.filter((s) => s.id !== sectionId)
    const updated: GeneratedProposal = {
      ...proposal,
      sections: updatedSections,
      updatedAt: new Date().toISOString(),
    }
    onUpdateProposal(updated)
    toast.success(`Removed section "${target.title}"`)
  }

  const handleAddSection = () => {
    if (!newSectionTitle.trim()) {
      toast.error('Section title is required.')
      return
    }

    const secId = `sec_${Date.now()}`
    const newSection: ProposalSection = {
      id: secId,
      title: newSectionTitle.trim(),
      content: `Add your custom content for ${newSectionTitle.trim()} here.`,
      type: newSectionType,
      isEdited: true,
    }

    const updated: GeneratedProposal = {
      ...proposal,
      sections: [...proposal.sections, newSection],
      updatedAt: new Date().toISOString(),
    }
    onUpdateProposal(updated)
    setNewSectionTitle('')
    setShowAddSectionModal(false)
    toast.success(`Added new section "${newSection.title}"`)
  }

  const handleStatusChange = (newStatus: ProposalStatus) => {
    const nowIso = new Date().toISOString()
    const historyEntry = {
      status: newStatus,
      timestamp: nowIso,
      note: `Status updated to ${newStatus}`,
    }

    const updated: GeneratedProposal = {
      ...proposal,
      status: newStatus,
      statusHistory: [...(proposal.statusHistory || []), historyEntry],
      updatedAt: nowIso,
    }
    onUpdateProposal(updated)
    toast.success(`Proposal status updated to ${newStatus}`)
  }

  const handleRegenerateSection = async (sectionId: string, customInstruction?: string) => {
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
          instruction: customInstruction || '',
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
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              Proposals
            </button>
            <span className="text-muted-foreground/40">/</span>
            <h1 className="max-w-[280px] sm:max-w-md truncate text-xs sm:text-sm font-bold text-foreground">
              {proposal.title}
            </h1>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* QA Audit Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAuditModal(true)}
              title="Run AI Quality Assurance Audit"
            >
              <ShieldCheck className="h-4 w-4 text-primary mr-1.5" />
              QA Score
              {proposal.qualityAudit?.overallScore && (
                <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.2 text-[11px] font-bold text-primary">
                  {proposal.qualityAudit.overallScore}
                </span>
              )}
            </Button>

            {/* AI Deal Health & Win Rate */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowDealHealthModal(true)}
              title="AI Deal Health & Win Predictor"
            >
              <TrendingUp className="h-4 w-4 text-emerald-500 mr-1.5" />
              Win Rate
              {proposal.dealHealth?.winProbability && (
                <span className="ml-1.5 rounded-full bg-emerald-500/10 px-1.5 py-0.2 text-[10px] font-bold text-emerald-500">
                  {proposal.dealHealth.winProbability}%
                </span>
              )}
            </Button>

            {/* AI Contract Risk Scanner */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowRiskScannerModal(true)}
              title="AI Contract Red-Flag & Scope-Creep Scanner"
            >
              <ShieldAlert className="h-4 w-4 text-rose-500 mr-1.5" />
              Risks
              {proposal.riskReport?.risks && proposal.riskReport.risks.length > 0 && (
                <span className="ml-1.5 rounded-full bg-rose-500/10 px-1.5 py-0.2 text-[10px] font-bold text-rose-500">
                  {proposal.riskReport.risks.length}
                </span>
              )}
            </Button>

            {/* Client Presentation Mode */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowClientModal(true)}
              title="Open Client Presentation & Acceptance Mode"
            >
              <Eye className="h-4 w-4 mr-1.5" />
              Client Preview
            </Button>

            {/* Fullscreen Pitch Slide Deck */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowPitchDeckModal(true)}
              title="Fullscreen Slide Presentation Deck"
            >
              <Presentation className="h-4 w-4 mr-1.5 text-indigo-400" />
              Pitch Deck
            </Button>

            {/* Discovery Intake Form */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowDiscoveryModal(true)}
              title="AI Discovery & Intake Questionnaire"
            >
              <FileQuestion className="h-4 w-4 mr-1.5 text-blue-400" />
              Intake
            </Button>

            {/* Client Feedback Q&A */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowCommentsDrawer(true)}
              title="Client Feedback & Q&A Hub"
            >
              <MessageSquare className="h-4 w-4 mr-1.5 text-cyan-400" />
              Q&amp;A
              {proposal.comments && proposal.comments.length > 0 && (
                <span className="ml-1.5 rounded-full bg-cyan-500/10 px-1.5 py-0.2 text-[10px] font-bold text-cyan-500">
                  {proposal.comments.length}
                </span>
              )}
            </Button>

            {/* Version Snapshots */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowVersionModal(true)}
              title="View Revision History & Snapshots"
            >
              <History className="h-4 w-4 mr-1.5" />
              Versions
              {proposal.versions && proposal.versions.length > 0 && (
                <span className="ml-1 text-[11px] text-muted-foreground">
                  ({proposal.versions.length})
                </span>
              )}
            </Button>

            {/* Visual Diff */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowDiffModal(true)}
              title="Visual Version Diff & Changelog"
            >
              <GitCompare className="h-4 w-4 mr-1.5 text-zinc-400" />
              Diff
            </Button>

            {/* Content Library */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowLibraryModal(true)}
              title="Insert Agency Content Blocks"
            >
              <BookOpen className="h-4 w-4 mr-1.5 text-indigo-400" />
              Library
            </Button>

            {/* Client Telemetry */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAnalyticsDrawer(true)}
              title="Client Telemetry & Section Heatmap"
            >
              <BarChart3 className="h-4 w-4 mr-1.5 text-purple-400" />
              Telemetry
              {proposal.analytics && proposal.analytics.totalViews > 0 && (
                <span className="ml-1.5 rounded-full bg-purple-500/20 px-1.5 py-0.2 text-[10px] font-bold text-purple-400">
                  {proposal.analytics.totalViews}
                </span>
              )}
            </Button>

            {/* Security & Access Controls */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowSecurityModal(true)}
              title="Proposal Security & Passcode Settings"
            >
              <Lock className="h-4 w-4 mr-1.5 text-amber-400" />
              Security
              {proposal.security?.requirePasscode && (
                <span className="ml-1.5 w-2 h-2 rounded-full bg-amber-400" />
              )}
            </Button>

            {/* Edit Pricing Builder */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowPricingBuilder(!showPricingBuilder)}
            >
              <DollarSign className="h-4 w-4 mr-1.5" />
              {showPricingBuilder ? 'Hide Pricing' : 'Pricing Builder'}
            </Button>

            {/* Export Markdown */}
            <Button
              size="sm"
              variant="outline"
              title="Download clean Markdown file"
              onClick={() => {
                try {
                  const md = exportProposalAsMarkdown(proposal)
                  downloadFile(md, `${proposal.title.replace(/[^a-zA-Z0-9]/g, '_')}.md`, 'text/markdown')
                  toast.success('Markdown file downloaded')
                } catch {
                  toast.error('Failed to export Markdown')
                }
              }}
            >
              <FileText className="h-3.5 w-3.5 mr-1" />
              Markdown
            </Button>

            {/* Export Standalone HTML Pitch Deck */}
            <Button
              size="sm"
              variant="outline"
              title="Download standalone HTML Pitch Deck"
              onClick={() => {
                try {
                  const html = exportProposalAsHtml(proposal)
                  downloadFile(html, `${proposal.title.replace(/[^a-zA-Z0-9]/g, '_')}.html`, 'text/html')
                  toast.success('Standalone HTML deck downloaded')
                } catch {
                  toast.error('Failed to export HTML')
                }
              }}
            >
              <Globe className="h-3.5 w-3.5 mr-1" />
              HTML
            </Button>

            {/* Download PDF */}
            <Button size="sm" onClick={handleDownloadPdf} disabled={isPdfGenerating}>
              <Download className="h-4 w-4 mr-1.5" />
              {isPdfGenerating ? 'Preparing PDF...' : 'Download PDF'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main viewer grid */}
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[240px_1fr] md:px-8">
        {/* Table of contents sticky sidebar */}
        <aside className="hidden lg:block space-y-4">
          <div className="sticky top-20 rounded-xl border bg-card p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Document Sections
              </p>
              <span className="text-xs text-muted-foreground">{proposal.sections.length}</span>
            </div>

            <nav className="space-y-1">
              {proposal.sections.map((section, idx) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="block rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground truncate"
                >
                  <span className="mr-1.5 text-muted-foreground/60">{idx + 1}.</span>
                  {section.title}
                </a>
              ))}
            </nav>

            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs"
              onClick={() => setShowAddSectionModal(true)}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Custom Section
            </Button>
          </div>
        </aside>

        {/* Content sections column */}
        <div className="space-y-5 min-w-0">
          {/* Metadata Card with Status Lifecycle & Client Info */}
          <Card className="p-6 shadow-2xs space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-foreground">
                  {proposal.title}
                </h2>
                <p className="text-xs md:text-sm text-muted-foreground">{proposal.subtitle}</p>
              </div>

              {/* Status Workflow Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">Status:</span>
                <select
                  value={proposal.status}
                  onChange={(e) => handleStatusChange(e.target.value as ProposalStatus)}
                  className="rounded-md border bg-background px-3 py-1 text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary"
                >
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.label}
                    </option>
                  ))}
                </select>
                <StatusBadge status={proposal.status} />
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid gap-3 text-xs md:text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4 border-t pt-4">
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-muted-foreground/80">
                  Proposal Date
                </span>
                <span className="font-semibold text-foreground">{proposal.generatedDate}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-muted-foreground/80">
                  Valid Until
                </span>
                <span className="font-semibold text-foreground">{proposal.validUntil}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-muted-foreground/80">
                  Client &amp; Org
                </span>
                <span className="font-semibold text-foreground truncate block">
                  {proposal.formData.step1.clientName || 'Client'} (
                  {proposal.formData.step1.clientCompany || 'Company'})
                </span>
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-muted-foreground/80">
                  Total Investment
                </span>
                <span className="font-bold text-primary">{proposal.totalValue}</span>
              </div>
            </div>
          </Card>

          {/* Pricing Builder Section (Toggled) */}
          {showPricingBuilder && proposal.pricingStructure && (
            <Card className="p-6 shadow-sm border-primary/30 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <h3 className="text-base font-bold text-foreground">
                    Deterministic Scope &amp; Pricing Builder
                  </h3>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setShowPricingBuilder(false)}>
                  Close Pricing
                </Button>
              </div>

              <PricingBuilder
                pricing={proposal.pricingStructure}
                onChange={(updatedPricing) => {
                  const totals = calculatePricingTotals(updatedPricing)
                  const newTotalStr = formatCurrency(totals.grandTotal, updatedPricing.currency)
                  onUpdateProposal({
                    ...proposal,
                    pricingStructure: updatedPricing,
                    totalValue: newTotalStr,
                    updatedAt: new Date().toISOString(),
                  })
                }}
              />
            </Card>
          )}

          {/* Sections List */}
          <div className="space-y-4">
            {proposal.sections.map((section, idx) => (
              <SectionCard
                key={section.id}
                section={section}
                index={idx}
                totalSections={proposal.sections.length}
                onSave={(content, type) => handleSaveSection(section.id, content, type)}
                onUpdateTitle={(newTitle) => handleUpdateSectionTitle(section.id, newTitle)}
                onRegenerate={(instruction) => handleRegenerateSection(section.id, instruction)}
                onMoveUp={() => handleMoveSection(idx, 'up')}
                onMoveDown={() => handleMoveSection(idx, 'down')}
                onDelete={() => handleDeleteSection(section.id)}
                isRegenerating={regeneratingSectionId === section.id}
                toast={toast}
              />
            ))}
          </div>

          {/* Bottom Add Section Button */}
          <div className="pt-2 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddSectionModal(true)}
              className="text-xs"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add Custom Section to Proposal
            </Button>
          </div>
        </div>
      </main>

      {/* Add Custom Section Modal */}
      {showAddSectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-foreground">Add Custom Section</h3>
            <p className="text-xs text-muted-foreground">
              Define a new section to append to this proposal workbench.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Section Title
                </label>
                <input
                  type="text"
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  placeholder="e.g. Security & Compliance, Client References, Case Studies..."
                  className="w-full rounded-md border bg-background px-3 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Format Type
                </label>
                <select
                  value={newSectionType}
                  onChange={(e) => setNewSectionType(e.target.value as ProposalSection['type'])}
                  className="w-full rounded-md border bg-background px-3 py-1.5 text-xs text-foreground"
                >
                  <option value="text">Paragraph Prose</option>
                  <option value="table">Table (Markdown)</option>
                  <option value="phases">Phased Roadmap</option>
                  <option value="list">Bullet List</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={() => setShowAddSectionModal(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddSection}>
                Add Section
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showAuditModal && (
        <QualityAuditModal
          proposal={proposal}
          onUpdateProposal={onUpdateProposal}
          onClose={() => setShowAuditModal(false)}
          toast={toast}
        />
      )}

      {showClientModal && (
        <ClientPreviewModal
          proposal={proposal}
          onUpdateProposal={onUpdateProposal}
          onClose={() => setShowClientModal(false)}
          toast={toast}
        />
      )}

      {showVersionModal && (
        <VersionHistoryModal
          proposal={proposal}
          onUpdateProposal={onUpdateProposal}
          onClose={() => setShowVersionModal(false)}
          toast={toast}
        />
      )}

      {/* Analytics Drawer */}
      <AnalyticsDrawer
        isOpen={showAnalyticsDrawer}
        onClose={() => setShowAnalyticsDrawer(false)}
        proposal={proposal}
        onUpdateAnalytics={(updatedAnalytics) => {
          onUpdateProposal({
            ...proposal,
            analytics: updatedAnalytics,
          })
          toast.success('Engagement telemetry recorded')
        }}
      />

      {/* Content Library Modal */}
      <ContentLibraryModal
        isOpen={showLibraryModal}
        onClose={() => setShowLibraryModal(false)}
        onInsertSection={(newSection) => {
          const updatedSections = [...proposal.sections, newSection]
          onUpdateProposal({
            ...proposal,
            sections: updatedSections,
            updatedAt: new Date().toISOString(),
          })
          toast.success(`Inserted "${newSection.title}" into proposal`)
        }}
      />

      {/* Version Diff Modal */}
      <VersionDiffModal
        isOpen={showDiffModal}
        onClose={() => setShowDiffModal(false)}
        currentProposal={proposal}
        versions={proposal.versions || []}
      />

      {/* Security Settings Modal */}
      <SecuritySettingsModal
        isOpen={showSecurityModal}
        onClose={() => setShowSecurityModal(false)}
        security={
          proposal.security || {
            requirePasscode: false,
            requireNdaAgreement: false,
            expiryNoticeDays: 7,
            watermarkConfidential: false,
          }
        }
        onSave={(updatedSecurity) => {
          onUpdateProposal({
            ...proposal,
            security: updatedSecurity,
            updatedAt: new Date().toISOString(),
          })
          toast.success('Security settings updated')
        }}
      />

      {/* AI Deal Health Modal */}
      {showDealHealthModal && (
        <DealHealthModal
          proposal={proposal}
          onUpdateProposal={onUpdateProposal}
          onClose={() => setShowDealHealthModal(false)}
          toast={toast}
        />
      )}

      {/* AI Contract Risk Scanner Modal */}
      {showRiskScannerModal && (
        <RiskScannerModal
          proposal={proposal}
          onUpdateProposal={onUpdateProposal}
          onClose={() => setShowRiskScannerModal(false)}
          toast={toast}
        />
      )}

      {/* Fullscreen Pitch Slide Deck Modal */}
      {showPitchDeckModal && (
        <PitchDeckModal
          proposal={proposal}
          onClose={() => setShowPitchDeckModal(false)}
          toast={toast}
        />
      )}

      {/* AI Discovery Intake Questions Modal */}
      {showDiscoveryModal && (
        <DiscoveryQuestionsModal
          proposal={proposal}
          onUpdateProposal={onUpdateProposal}
          onClose={() => setShowDiscoveryModal(false)}
          toast={toast}
        />
      )}

      {/* Client Feedback Q&A Drawer */}
      {showCommentsDrawer && (
        <ClientCommentsDrawer
          proposal={proposal}
          onUpdateProposal={onUpdateProposal}
          onClose={() => setShowCommentsDrawer(false)}
          toast={toast}
        />
      )}
    </div>
  )
}
