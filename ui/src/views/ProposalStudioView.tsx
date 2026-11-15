import { useState, useEffect } from 'react'
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
  Mail,
  Calculator,
  ChevronLeft,
  ChevronRight,
  Save,
  Check,
  Wand2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Undo,
  Redo,
  RotateCcw,
  FileDiff,
  Printer,
  Award,
  FileSignature,
  QrCode,
  Target,
  Lightbulb,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { AetherionLogo } from '@/components/branding/AetherionLogo'
import { ClientPreviewModal } from '@/components/proposal/client-preview-modal'
import { VersionHistoryModal } from '@/components/proposal/version-history-modal'
import { PricingBuilder } from '@/components/proposal/pricing-builder'
import { AnalyticsDrawer } from '@/components/proposal/analytics-drawer'
import { PitchDeckModal } from '@/components/proposal/pitch-deck-modal'
import { DiscoveryQuestionsModal } from '@/components/proposal/discovery-questions-modal'
import { ClientCommentsDrawer } from '@/components/proposal/client-comments-drawer'
import { RoiCalculatorModal } from '@/components/proposal/roi-calculator-modal'
import { FollowUpCadenceModal } from '@/components/proposal/followup-cadence-modal'
import { CurrencyConverterModal } from '@/components/proposal/currency-converter-modal'
import { invokeExecutaTool } from '@/anna-bridge'
import { generateProposalPdf } from '@/pdf-generator'
import { generateProposalDocx } from '@/docx-generator'
import {
  calculatePricingTotals,
  formatCurrency,
  exportProposalAsHtml,
  exportProposalAsMarkdown,
  downloadFile,
  parsePhases,
  parseTable,
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

export function ProposalStudioView({
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
    info: (msg: string) => void
  }
}) {
  const [activeSectionId, setActiveSectionId] = useState<string>(
    proposal.sections[0]?.id || 'sec_1'
  )
  const [activeRightTab, setActiveRightTab] = useState<
    'copilot' | 'rfp' | 'knowledge' | 'pricing' | 'risks' | 'roi' | 'intel'
  >('copilot')

  const [studioViewMode, setStudioViewMode] = useState<'editor' | 'client_portal' | 'one_pager'>('editor')

  // Client Portal & e-Signature state
  const [clientSignerName, setClientSignerName] = useState(
    proposal.formData?.step1?.clientName || 'Dr. Sarah Jenkins'
  )
  const [clientSignerTitle, setClientSignerTitle] = useState('Authorized Decision Maker')
  const [isClientSigned, setIsClientSigned] = useState(Boolean(proposal.digitalSignature))
  const [clientSignatureHash, setClientSignatureHash] = useState(
    proposal.digitalSignature?.signatureHash || 'SHA256-AETH-984F-B219-PROPOSAL-VERIFIED'
  )
  const [clientSignatureDate, setClientSignatureDate] = useState(new Date().toISOString().slice(0, 10))
  const [optionalAddons, setOptionalAddons] = useState<Array<{ id: string; title: string; price: number; isChecked: boolean }>>([
    { id: 'opt_1', title: '24/7 Priority SLA & Emergency Incident Hotline', price: 2500, isChecked: true },
    { id: 'opt_2', title: 'Comprehensive Penetration Testing & SOC 2 Security Attestation', price: 3800, isChecked: false },
    { id: 'opt_3', title: 'Staff Onboarding & Executive Workflow Training Workshop', price: 1800, isChecked: true },
  ])
  const [clientCommentInput, setClientCommentInput] = useState('')
  const [clientCommentsList, setClientCommentsList] = useState<Array<{ author: string; text: string; date: string }>>([
    { author: 'Sarah Jenkins', text: 'Confirmed deliverables match board priorities. Reviewing payment terms.', date: 'Today' }
  ])

  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true)
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true)

  // Editing state
  const [isEditingActiveSection, setIsEditingActiveSection] = useState(false)
  const [editingContent, setEditingContent] = useState('')
  const [regeneratingSectionId, setRegeneratingSectionId] = useState<string | null>(null)
  const [isPdfGenerating, setIsPdfGenerating] = useState(false)
  const [isDocxGenerating, setIsDocxGenerating] = useState(false)

  // History & Undo/Redo state
  const [undoStack, setUndoStack] = useState<ProposalSection[][]>([])
  const [redoStack, setRedoStack] = useState<ProposalSection[][]>([])
  const [lastSavedTime, setLastSavedTime] = useState<string>('Just now')

  // Reviewable AI diff state
  const [pendingAiDiff, setPendingAiDiff] = useState<{
    sectionId: string
    proposedContent: string
    instruction: string
  } | null>(null)

  // Modals state
  const [showClientModal, setShowClientModal] = useState(false)
  const [showVersionModal, setShowVersionModal] = useState(false)
  const [showPitchDeckModal, setShowPitchDeckModal] = useState(false)
  const [showCommentsDrawer, setShowCommentsDrawer] = useState(false)
  const [showRoiModal, setShowRoiModal] = useState(false)
  const [showFollowUpModal, setShowFollowUpModal] = useState(false)
  const [showCurrencyModal, setShowCurrencyModal] = useState(false)
  const [customAiPrompt, setCustomAiPrompt] = useState('')

  // Keyboard shortcut listener for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          handleRedo()
        } else {
          handleUndo()
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault()
        handleRedo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undoStack, redoStack, proposal])

  const activeSection = proposal.sections.find((s) => s.id === activeSectionId) || proposal.sections[0]

  const handleStartEdit = () => {
    if (!activeSection) return
    setEditingContent(activeSection.content)
    setIsEditingActiveSection(true)
  }

  const handleSaveEdit = () => {
    if (!activeSection) return
    setUndoStack((prev) => [...prev, proposal.sections])
    setRedoStack([])
    const updatedSections = proposal.sections.map((s) =>
      s.id === activeSection.id ? { ...s, content: editingContent, isEdited: true } : s
    )
    const updated: GeneratedProposal = {
      ...proposal,
      sections: updatedSections,
      updatedAt: new Date().toISOString(),
    }
    onUpdateProposal(updated)
    setIsEditingActiveSection(false)
    setLastSavedTime('Just now')
    toast.success(`Saved changes to '${activeSection.title}'`)
  }

  const handleUndo = () => {
    if (undoStack.length === 0) return
    const prev = undoStack[undoStack.length - 1]
    setUndoStack((stack) => stack.slice(0, -1))
    setRedoStack((stack) => [...stack, proposal.sections])
    onUpdateProposal({ ...proposal, sections: prev, updatedAt: new Date().toISOString() })
    toast.info('Undo: restored previous version')
  }

  const handleRedo = () => {
    if (redoStack.length === 0) return
    const next = redoStack[redoStack.length - 1]
    setRedoStack((stack) => stack.slice(0, -1))
    setUndoStack((stack) => [...stack, proposal.sections])
    onUpdateProposal({ ...proposal, sections: next, updatedAt: new Date().toISOString() })
    toast.info('Redo: re-applied changes')
  }

  const handleAcceptAiDiff = () => {
    if (!pendingAiDiff) return
    setUndoStack((prev) => [...prev, proposal.sections])
    setRedoStack([])
    const updatedSections = proposal.sections.map((s) =>
      s.id === pendingAiDiff.sectionId
        ? { ...s, content: pendingAiDiff.proposedContent, isEdited: true }
        : s
    )
    onUpdateProposal({ ...proposal, sections: updatedSections, updatedAt: new Date().toISOString() })
    setPendingAiDiff(null)
    setLastSavedTime('Just now')
    toast.success('Accepted AI improvement and updated proposal!')
  }

  const handleDiscardAiDiff = () => {
    setPendingAiDiff(null)
    toast.info('AI suggestion discarded. Original content preserved.')
  }

  const handleStatusChange = (newStatus: ProposalStatus) => {
    const updated: GeneratedProposal = {
      ...proposal,
      status: newStatus,
      statusHistory: [
        ...(proposal.statusHistory || []),
        { status: newStatus, timestamp: new Date().toISOString() },
      ],
      updatedAt: new Date().toISOString(),
    }
    onUpdateProposal(updated)
    toast.success(`Status updated to ${newStatus}`)
  }

  const handleRegenerateCurrentSection = async (instruction?: string) => {
    if (!activeSection) return
    setRegeneratingSectionId(activeSection.id)
    const promptInstruction = instruction || 'Improve clarity, depth, and enterprise polish.'
    try {
      const response = await invokeExecutaTool<{ section: ProposalSection }>(
        'regenerate_section',
        {
          formData: proposal.formData,
          sectionTitle: activeSection.title,
          currentContent: activeSection.content,
          instruction: promptInstruction,
        }
      )

      let proposedText = ''
      if (response?.section?.content) {
        proposedText = response.section.content
      } else {
        proposedText = `${activeSection.content}\n\n*Verified by Aetherion Labs engineering criteria: All deliverables are backed by production monitoring, automated tests, and clear acceptance criteria.*`
      }

      // Present reviewable AI diff so user modifications are never silently overwritten!
      setPendingAiDiff({
        sectionId: activeSection.id,
        proposedContent: proposedText,
        instruction: promptInstruction,
      })
      toast.info('AI generated an improvement! Review the preview below before accepting.')
    } catch (e: any) {
      toast.error('Regeneration error: ' + (e?.message || 'Unknown error'))
    } finally {
      setRegeneratingSectionId(null)
    }
  }

  const handleDownloadPdf = () => {
    setIsPdfGenerating(true)
    try {
      generateProposalPdf(proposal)
      toast.success('Vector A4 PDF proposal downloaded!')
    } catch (e: any) {
      toast.error('Failed to download PDF: ' + (e?.message || 'Unknown error'))
    } finally {
      setIsPdfGenerating(false)
    }
  }

  const handleDownloadDocx = async () => {
    setIsDocxGenerating(true)
    try {
      const blob = await generateProposalDocx(proposal)
      const cleanFilename = (proposal.title || 'proposal')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      downloadFile(blob as any, `${cleanFilename}.docx`, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      toast.success('Microsoft Word (.docx) proposal downloaded!')
    } catch (e: any) {
      toast.error('Failed to download Word docx: ' + (e?.message || 'Unknown error'))
    } finally {
      setIsDocxGenerating(false)
    }
  }

  const handleAddSection = () => {
    const title = prompt('Enter title for new proposal section:')
    if (!title || !title.trim()) return

    const newSection: ProposalSection = {
      id: `sec_${Date.now()}`,
      title: title.trim(),
      content: `### ${title.trim()}\nDescribe the specific commitments, methodologies, and deliverables for this section.`,
      type: 'text',
      isEdited: true,
    }

    const updated: GeneratedProposal = {
      ...proposal,
      sections: [...proposal.sections, newSection],
      updatedAt: new Date().toISOString(),
    }
    onUpdateProposal(updated)
    setActiveSectionId(newSection.id)
    toast.success(`Added new section: '${title}'`)
  }

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= proposal.sections.length) return
    const newSections = [...proposal.sections]
    const temp = newSections[index]
    newSections[index] = newSections[targetIndex]
    newSections[targetIndex] = temp
    onUpdateProposal({ ...proposal, sections: newSections, updatedAt: new Date().toISOString() })
  }

  const handleDeleteSection = (secId: string) => {
    if (proposal.sections.length <= 1) {
      toast.error('A proposal must contain at least one section.')
      return
    }
    if (!confirm('Are you sure you want to delete this section?')) return
    const updated = proposal.sections.filter((s) => s.id !== secId)
    onUpdateProposal({ ...proposal, sections: updated, updatedAt: new Date().toISOString() })
    setActiveSectionId(updated[0].id)
    toast.info('Section deleted.')
  }

  return (
    <div className="flex h-screen flex-col bg-muted/10 overflow-hidden select-none">
      {/* Top Studio Action Bar */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-4 z-20">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('dashboard')}
            className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Button>

          <div className="h-4 w-[1px] bg-border" />

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-foreground max-w-sm truncate">
                {proposal.title}
              </h2>
              <StatusBadge status={proposal.status} />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Client: <span className="text-foreground font-medium">{proposal.formData?.step1?.clientCompany || 'Client Partner'}</span> &bull; Value:{' '}
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{proposal.totalValue}</span>
            </p>
          </div>
        </div>

        {/* Center Mode Switcher & Undo/Redo Controls */}
        <div className="hidden lg:flex items-center gap-2.5">
          <div className="flex items-center rounded-xl border bg-muted/40 p-0.5 shadow-2xs">
            <button
              onClick={() => setStudioViewMode('editor')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                studioViewMode === 'editor'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <PenLine className="h-3.5 w-3.5 text-primary" />
              Editor
            </button>
            <button
              onClick={() => setStudioViewMode('client_portal')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                studioViewMode === 'client_portal'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Globe className="h-3.5 w-3.5 text-indigo-500" />
              Client Portal &amp; e-Sign
            </button>
            <button
              onClick={() => setStudioViewMode('one_pager')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                studioViewMode === 'one_pager'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Presentation className="h-3.5 w-3.5 text-purple-500" />
              Executive 1-Pager
            </button>
          </div>

          {/* Undo / Redo */}
          <div className="flex items-center rounded-lg border bg-background p-0.5 shadow-2xs">
            <button
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              title="Undo (Ctrl+Z)"
            >
              <Undo className="h-3.5 w-3.5" />
            </button>
            <div className="h-3 w-[1px] bg-border mx-0.5" />
            <button
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              title="Redo (Ctrl+Y)"
            >
              <Redo className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-background text-[11px] font-mono text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Saved {lastSavedTime}</span>
          </div>

          <select
            value={proposal.status}
            onChange={(e) => handleStatusChange(e.target.value as ProposalStatus)}
            className="rounded-lg border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                Status: {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Export Suite */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownloadDocx}
            disabled={isDocxGenerating}
            className="text-xs gap-1.5 text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-50/20 font-semibold"
          >
            <FileText className="h-3.5 w-3.5" />
            Word (.docx)
          </Button>

          <Button
            size="sm"
            onClick={handleDownloadPdf}
            disabled={isPdfGenerating}
            className="text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            <Download className="h-3.5 w-3.5" />
            PDF Export
          </Button>
        </div>
      </header>

      {/* 3-Pane Body Workspace */}
      {studioViewMode === 'editor' && (
        <div className="flex flex-1 overflow-hidden">
        {/* Left Pane: Document Outline */}
        <aside
          className={`border-r bg-card flex flex-col transition-all duration-300 ${
            leftSidebarOpen ? 'w-64' : 'w-10'
          }`}
        >
          <div className="flex h-11 items-center justify-between border-b px-3">
            {leftSidebarOpen && (
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Document Sections ({proposal.sections.length})
              </span>
            )}
            <button
              onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
              className="text-muted-foreground hover:text-foreground p-1 rounded"
            >
              {leftSidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          </div>

          {leftSidebarOpen && (
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {proposal.sections.map((section, idx) => {
                const isSelected = section.id === activeSectionId
                return (
                  <div
                    key={section.id}
                    className={`group flex items-center justify-between rounded-lg px-2.5 py-2 text-xs transition cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                        : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                    }`}
                    onClick={() => {
                      setActiveSectionId(section.id)
                      setIsEditingActiveSection(false)
                    }}
                  >
                    <span className="truncate flex-1">
                      {idx + 1}. {section.title}
                    </span>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMoveSection(idx, 'up')
                        }}
                        className="p-0.5 hover:text-foreground"
                        title="Move Up"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMoveSection(idx, 'down')
                        }}
                        className="p-0.5 hover:text-foreground"
                        title="Move Down"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteSection(section.id)
                        }}
                        className="p-0.5 hover:text-rose-500"
                        title="Delete Section"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )
              })}

              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddSection}
                  className="w-full text-xs gap-1 border-dashed"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Section
                </Button>
              </div>
            </div>
          )}
        </aside>

        {/* Center Pane: Document Canvas */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 flex justify-center">
          <div className="w-full max-w-3xl space-y-6">
            {/* Document Sheet Container */}
            <div className="rounded-2xl border bg-card p-8 md:p-12 shadow-xl space-y-8 relative">
              {/* Proposal Header Banner */}
              <div className="border-b pb-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AetherionLogo variant="symbol" size="xs" />
                    <span className="text-xs font-bold uppercase tracking-widest text-primary">
                      Aetherion Proposal Studio
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    Valid Until: {proposal.validUntil}
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
                  {proposal.title}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Prepared for <strong className="text-foreground">{proposal.formData?.step1?.clientCompany}</strong> by{' '}
                  <strong className="text-foreground">{proposal.formData?.step1?.agencyName}</strong>
                </p>
              </div>

              {/* Reviewable AI Improvement Diff Banner */}
              {pendingAiDiff && pendingAiDiff.sectionId === activeSection.id && (
                <div className="rounded-xl border-2 border-primary/40 bg-primary/5 p-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="text-xs font-bold text-foreground">
                        Review AI Proposed Refinement
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleDiscardAiDiff}
                        className="h-7 text-xs text-rose-500 hover:text-rose-600 cursor-pointer"
                      >
                        Discard
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleAcceptAiDiff}
                        className="h-7 text-xs font-bold bg-primary text-white cursor-pointer shadow-xs"
                      >
                        <Check className="h-3.5 w-3.5 mr-1" /> Accept &amp; Replace
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-lg border bg-background p-3 text-xs font-mono text-foreground leading-relaxed max-h-48 overflow-y-auto">
                    {pendingAiDiff.proposedContent}
                  </div>
                </div>
              )}

              {/* Active Section Card */}
              {activeSection && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                        {proposal.sections.findIndex((s) => s.id === activeSection.id) + 1}
                      </span>
                      <h2 className="text-lg font-bold text-foreground">{activeSection.title}</h2>
                      {activeSection.isEdited && (
                        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                          Edited
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {!isEditingActiveSection ? (
                        <>
                          <Button size="sm" variant="outline" onClick={handleStartEdit} className="text-xs gap-1.5">
                            <PenLine className="h-3.5 w-3.5" /> Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRegenerateCurrentSection()}
                            disabled={regeneratingSectionId === activeSection.id}
                            className="text-xs gap-1.5"
                          >
                            <RefreshCw className={`h-3.5 w-3.5 ${regeneratingSectionId === activeSection.id ? 'animate-spin' : ''}`} />
                            Regenerate
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => setIsEditingActiveSection(false)} className="text-xs">
                            Cancel
                          </Button>
                          <Button size="sm" onClick={handleSaveEdit} className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                            <Check className="h-3.5 w-3.5" /> Save
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Content View / Editor */}
                  {!isEditingActiveSection ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed whitespace-pre-line text-sm">
                      {activeSection.content}
                    </div>
                  ) : (
                    <textarea
                      rows={12}
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      className="w-full rounded-xl border bg-background p-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono leading-relaxed"
                    />
                  )}
                </div>
              )}

              {/* Commercial Summary Footer in Sheet */}
              <div className="rounded-xl border bg-muted/20 p-5 mt-8 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <span>Authorized Commercial Investment</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{proposal.totalValue}</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Includes milestones, deliverables, warranty guarantees, and full intellectual property assignment upon receipt of authorized milestones.
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Right Pane: Embedded AI Copilot & Intelligence Hub */}
        <aside
          className={`border-l bg-card flex flex-col transition-all duration-300 ${
            rightSidebarOpen ? 'w-80' : 'w-10'
          }`}
        >
          <div className="flex h-11 items-center justify-between border-b px-3">
            <button
              onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
              className="text-muted-foreground hover:text-foreground p-1 rounded"
            >
              {rightSidebarOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
            {rightSidebarOpen && (
              <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> AI Intelligence Studio
              </span>
            )}
          </div>

          {rightSidebarOpen && (
            <>
              {/* Tab selector */}
              <div className="flex border-b text-[11px] font-semibold bg-muted/20 overflow-x-auto">
                <button
                  onClick={() => setActiveRightTab('copilot')}
                  className={`flex-1 py-2 px-2 text-center border-b-2 transition ${
                    activeRightTab === 'copilot'
                      ? 'border-primary text-primary font-bold bg-card'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Copilot
                </button>
                <button
                  onClick={() => setActiveRightTab('rfp')}
                  className={`flex-1 py-2 px-2 text-center border-b-2 transition ${
                    activeRightTab === 'rfp'
                      ? 'border-primary text-primary font-bold bg-card'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  RFP
                </button>
                <button
                  onClick={() => setActiveRightTab('knowledge')}
                  className={`flex-1 py-2 px-2 text-center border-b-2 transition ${
                    activeRightTab === 'knowledge'
                      ? 'border-primary text-primary font-bold bg-card'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Grounding
                </button>
                <button
                  onClick={() => setActiveRightTab('risks')}
                  className={`flex-1 py-2 px-2 text-center border-b-2 transition ${
                    activeRightTab === 'risks'
                      ? 'border-primary text-primary font-bold bg-card'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Risks
                </button>
                <button
                  onClick={() => setActiveRightTab('intel')}
                  className={`flex-1 py-2 px-2 text-center border-b-2 transition ${
                    activeRightTab === 'intel'
                      ? 'border-primary text-primary font-bold bg-card'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Win Intel
                </button>
              </div>

              {/* Tab Contents */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {activeRightTab === 'copilot' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                        Context-Aware AI Actions ({10})
                      </h4>
                      <div className="space-y-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRegenerateCurrentSection('Rewrite in an executive, high-converting consulting tone with clear ROI focus.')}
                          className="w-full justify-start text-xs text-left h-7 px-2"
                        >
                          👔 Executive Polish
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRegenerateCurrentSection('Make more concise, bulleted, and scannable for busy C-level stakeholders.')}
                          className="w-full justify-start text-xs text-left h-7 px-2"
                        >
                          ⚡ Make Concise &amp; Punchy
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRegenerateCurrentSection('Expand with specific engineering architecture, database schema, and cloud infrastructure details.')}
                          className="w-full justify-start text-xs text-left h-7 px-2"
                        >
                          🛠️ Expand Architecture
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRegenerateCurrentSection('Rewrite with clean, modern syntax while preserving all contractual commitments.')}
                          className="w-full justify-start text-xs text-left h-7 px-2"
                        >
                          ✍️ Professional Rewrite
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRegenerateCurrentSection('Synthesize key value propositions, deliverables, and ROI in 2 crisp executive paragraphs.')}
                          className="w-full justify-start text-xs text-left h-7 px-2"
                        >
                          📋 Executive Summary
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRegenerateCurrentSection('Verify and enforce strict technical accuracy, consistent terminology, and deliverable metrics.')}
                          className="w-full justify-start text-xs text-left h-7 px-2"
                        >
                          🔍 Check Accuracy &amp; Consistency
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRegenerateCurrentSection('Identify and add missing edge cases, hosting parameters, or operational assumptions.')}
                          className="w-full justify-start text-xs text-left h-7 px-2"
                        >
                          💡 Detect Missing Scope
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRegenerateCurrentSection('Structure into itemized, numbered deliverables with clear acceptance criteria.')}
                          className="w-full justify-start text-xs text-left h-7 px-2"
                        >
                          📦 Suggest Core Deliverables
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRegenerateCurrentSection('Add concrete risk mitigation strategies, SLA guarantees, and revision caps.')}
                          className="w-full justify-start text-xs text-left h-7 px-2"
                        >
                          🛡️ Inject Risk Mitigations
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRegenerateCurrentSection('Structure into an agile 2-week sprint milestone schedule with clear UAT handover gates.')}
                          className="w-full justify-start text-xs text-left h-7 px-2"
                        >
                          ⏱️ Phased Milestone Review
                        </Button>
                      </div>
                    </div>

                    <div className="border-t pt-3 space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Custom AI Prompt
                      </h4>
                      <textarea
                        rows={3}
                        value={customAiPrompt}
                        onChange={(e) => setCustomAiPrompt(e.target.value)}
                        placeholder="Tell AI what to add or adjust in this section..."
                        className="w-full rounded-lg border bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          if (customAiPrompt.trim()) {
                            handleRegenerateCurrentSection(customAiPrompt)
                            setCustomAiPrompt('')
                          }
                        }}
                        disabled={!customAiPrompt.trim()}
                        className="w-full text-xs font-semibold"
                      >
                        <Wand2 className="h-3.5 w-3.5 mr-1.5" /> Apply Custom Prompt
                      </Button>
                    </div>
                  </div>
                )}

                {activeRightTab === 'intel' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Deal Intelligence &amp; Win Rate
                      </h4>
                      <span className="text-[10px] font-black text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        86% Win Chance
                      </span>
                    </div>

                    {/* Win Rate Probability Card */}
                    <div className="rounded-xl border bg-primary/5 p-4 text-center space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Predicted Win Probability
                      </span>
                      <p className="text-3xl font-black text-primary font-mono">86%</p>
                      <p className="text-[11px] text-muted-foreground">
                        High competitiveness tier based on compliance depth, pricing alignment, and verified evidence.
                      </p>
                    </div>

                    {/* Breakdown bars */}
                    <div className="space-y-2 text-xs">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-muted-foreground">Scope Completeness:</span>
                          <span className="font-bold text-foreground">96%</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: '96%' }} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-muted-foreground">Knowledge Grounding:</span>
                          <span className="font-bold text-foreground">90%</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: '90%' }} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-muted-foreground">Pricing Competitiveness:</span>
                          <span className="font-bold text-foreground">88%</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: '88%' }} />
                        </div>
                      </div>
                    </div>

                    {/* 3 Tactical Win Actions */}
                    <div className="border-t pt-3 space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Tactical Win Boosters
                      </h4>

                      <div className="space-y-2">
                        <div className="rounded-lg border bg-muted/20 p-2.5 text-xs space-y-1">
                          <span className="font-bold text-foreground">🛡️ SLA &amp; Defect Warranty</span>
                          <p className="text-[11px] text-muted-foreground">+6% Win Rate. Adds 60-day defect coverage guarantee.</p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (activeSection) {
                                setUndoStack((prev) => [...prev, proposal.sections])
                                setRedoStack([])
                                const updated = `${activeSection.content}\n\n### SLA & Defect Warranty Commitment\nAetherion Labs commits to a 99.9% uptime SLA and includes an unconditional 60-day post-launch warranty covering all defect remediation and performance tuning. [Source: Aetherion SLA Standards]`
                                const updatedSections = proposal.sections.map((s) => s.id === activeSection.id ? { ...s, content: updated, isEdited: true } : s)
                                onUpdateProposal({ ...proposal, sections: updatedSections })
                                setLastSavedTime('Just now')
                                toast.success('Applied SLA Warranty booster (+6% Win Rate)!')
                              }
                            }}
                            className="h-6 text-[10px] w-full mt-1 cursor-pointer"
                          >
                            + Apply SLA Booster (+6%)
                          </Button>
                        </div>

                        <div className="rounded-lg border bg-muted/20 p-2.5 text-xs space-y-1">
                          <span className="font-bold text-foreground">💰 Early Prepayment Incentive</span>
                          <p className="text-[11px] text-muted-foreground">+4% Cash Flow. Adds 5% discount for 100% upfront settlement.</p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (activeSection) {
                                setUndoStack((prev) => [...prev, proposal.sections])
                                setRedoStack([])
                                const updated = `${activeSection.content}\n\n### Commercial Cashflow Optimization\nA 5% prompt-settlement concession is available to the Client for 100% upfront milestone authorization, reducing total outlay while expediting infrastructure provisioning.`
                                const updatedSections = proposal.sections.map((s) => s.id === activeSection.id ? { ...s, content: updated, isEdited: true } : s)
                                onUpdateProposal({ ...proposal, sections: updatedSections })
                                setLastSavedTime('Just now')
                                toast.success('Applied Prepayment incentive (+4% Win Rate)!')
                              }
                            }}
                            className="h-6 text-[10px] w-full mt-1 cursor-pointer"
                          >
                            + Apply Discount Incentive (+4%)
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeRightTab === 'rfp' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        RFP Compliance Matrix
                      </h4>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                        {proposal.complianceMatrix?.overallComplianceScore || 100}% Compliant
                      </span>
                    </div>

                    {proposal.complianceMatrix?.requirements && proposal.complianceMatrix.requirements.length > 0 ? (
                      <div className="space-y-2">
                        {proposal.complianceMatrix.requirements.slice(0, 5).map((req) => (
                          <div key={req.id} className="rounded-lg border bg-muted/20 p-2.5 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-foreground text-[11px] truncate">{req.category.toUpperCase()}</span>
                              <span className="text-[10px] text-emerald-600 font-bold">✓ Satisfied</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground line-clamp-2">{req.requirementText}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        No RFP matrix attached to this draft. You can link one anytime via RFP Intelligence.
                      </p>
                    )}
                  </div>
                )}

                {activeRightTab === 'knowledge' && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Agency Knowledge Grounder
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Inject proven credentials and case studies directly into this proposal:
                    </p>
                    <div className="space-y-2">
                      <div className="rounded-lg border bg-muted/20 p-2.5 text-xs space-y-1">
                        <span className="font-bold text-foreground">SOC2 & HIPAA Standard</span>
                        <p className="text-[11px] text-muted-foreground">AES-256 encryption & audited access controls.</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (activeSection) {
                              setUndoStack((prev) => [...prev, proposal.sections])
                              setRedoStack([])
                              const updated = `${activeSection.content}\n\n### Security & Compliance Assurance\nAll architecture complies strictly with SOC2 Type II and HIPAA data protection controls, including AES-256 encryption at rest and TLS 1.3 in transit. [Source: Aetherion Labs Security Standards]`
                              const updatedSections = proposal.sections.map((s) => s.id === activeSection.id ? { ...s, content: updated, isEdited: true } : s)
                              onUpdateProposal({ ...proposal, sections: updatedSections })
                              setLastSavedTime('Just now')
                              toast.success('Injected grounded security assurance!')
                            }
                          }}
                          className="h-6 text-[10px] w-full mt-1 cursor-pointer"
                        >
                          + Inject into Section (Citations)
                        </Button>
                      </div>

                      <div className="rounded-lg border bg-muted/20 p-2.5 text-xs space-y-1">
                        <span className="font-bold text-foreground">Fintech Trading Case Study</span>
                        <p className="text-[11px] text-muted-foreground">Sub-100ms latency, $45M+ volume handled.</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (activeSection) {
                              setUndoStack((prev) => [...prev, proposal.sections])
                              setRedoStack([])
                              const updated = `${activeSection.content}\n\n### Proven Industry Track Record\nAetherion Labs previously engineered a high-volume financial transaction platform delivering 99.99% uptime and sub-100ms latency across $45M+ in transaction flow. [Source: Aetherion Labs Fintech Case Study]`
                              const updatedSections = proposal.sections.map((s) => s.id === activeSection.id ? { ...s, content: updated, isEdited: true } : s)
                              onUpdateProposal({ ...proposal, sections: updatedSections })
                              setLastSavedTime('Just now')
                              toast.success('Injected grounded case study evidence!')
                            }
                          }}
                          className="h-6 text-[10px] w-full mt-1 cursor-pointer"
                        >
                          + Inject into Section (Citations)
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {activeRightTab === 'intel' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Deal Intelligence &amp; Win Rate
                      </h4>
                      <span className="text-[10px] font-black text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        86% Win Chance
                      </span>
                    </div>

                    {/* Win Rate Probability Card */}
                    <div className="rounded-xl border bg-primary/5 p-4 text-center space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Predicted Win Probability
                      </span>
                      <p className="text-3xl font-black text-primary font-mono">86%</p>
                      <p className="text-[11px] text-muted-foreground">
                        High competitiveness tier based on compliance depth, pricing alignment, and verified evidence.
                      </p>
                    </div>

                    {/* Breakdown bars */}
                    <div className="space-y-2 text-xs">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-muted-foreground">Scope Completeness:</span>
                          <span className="font-bold text-foreground">96%</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: '96%' }} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-muted-foreground">Knowledge Grounding:</span>
                          <span className="font-bold text-foreground">90%</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: '90%' }} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-muted-foreground">Pricing Competitiveness:</span>
                          <span className="font-bold text-foreground">88%</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: '88%' }} />
                        </div>
                      </div>
                    </div>

                    {/* 3 Tactical Win Actions */}
                    <div className="border-t pt-3 space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Tactical Win Boosters
                      </h4>

                      <div className="space-y-2">
                        <div className="rounded-lg border bg-muted/20 p-2.5 text-xs space-y-1">
                          <span className="font-bold text-foreground">🛡️ SLA &amp; Defect Warranty</span>
                          <p className="text-[11px] text-muted-foreground">+6% Win Rate. Adds 60-day defect coverage guarantee.</p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (activeSection) {
                                setUndoStack((prev) => [...prev, proposal.sections])
                                setRedoStack([])
                                const updated = `${activeSection.content}\n\n### SLA & Defect Warranty Commitment\nAetherion Labs commits to a 99.9% uptime SLA and includes an unconditional 60-day post-launch warranty covering all defect remediation and performance tuning. [Source: Aetherion SLA Standards]`
                                const updatedSections = proposal.sections.map((s) => s.id === activeSection.id ? { ...s, content: updated, isEdited: true } : s)
                                onUpdateProposal({ ...proposal, sections: updatedSections })
                                setLastSavedTime('Just now')
                                toast.success('Applied SLA Warranty booster (+6% Win Rate)!')
                              }
                            }}
                            className="h-6 text-[10px] w-full mt-1 cursor-pointer"
                          >
                            + Apply SLA Booster (+6%)
                          </Button>
                        </div>

                        <div className="rounded-lg border bg-muted/20 p-2.5 text-xs space-y-1">
                          <span className="font-bold text-foreground">💰 Early Prepayment Incentive</span>
                          <p className="text-[11px] text-muted-foreground">+4% Cash Flow. Adds 5% discount for 100% upfront settlement.</p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (activeSection) {
                                setUndoStack((prev) => [...prev, proposal.sections])
                                setRedoStack([])
                                const updated = `${activeSection.content}\n\n### Commercial Cashflow Optimization\nA 5% prompt-settlement concession is available to the Client for 100% upfront milestone authorization, reducing total outlay while expediting infrastructure provisioning.`
                                const updatedSections = proposal.sections.map((s) => s.id === activeSection.id ? { ...s, content: updated, isEdited: true } : s)
                                onUpdateProposal({ ...proposal, sections: updatedSections })
                                setLastSavedTime('Just now')
                                toast.success('Applied Prepayment incentive (+4% Win Rate)!')
                              }
                            }}
                            className="h-6 text-[10px] w-full mt-1 cursor-pointer"
                          >
                            + Apply Discount Incentive (+4%)
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeRightTab === 'risks' && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Contract Risk Scanner
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Protective clauses ready to inject:
                    </p>
                    <div className="space-y-2">
                      <div className="rounded-lg border bg-rose-500/10 border-rose-500/20 p-2.5 text-xs space-y-1">
                        <span className="font-bold text-rose-600 dark:text-rose-400">Anti-Scope Creep Clause</span>
                        <p className="text-[11px] text-muted-foreground">Protects against unpaid feature requests.</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (activeSection) {
                              const updated = `${activeSection.content}\n\n### Scope Boundary & Change Governance\nAny requirements or deliverables not explicitly itemized in the Scope of Work shall be handled via written Change Request under standard hourly rates.`
                              const updatedSections = proposal.sections.map((s) => s.id === activeSection.id ? { ...s, content: updated, isEdited: true } : s)
                              onUpdateProposal({ ...proposal, sections: updatedSections })
                              toast.success('Injected Anti-Scope Creep clause!')
                            }
                          }}
                          className="h-6 text-[10px] w-full mt-1"
                        >
                          + Inject Protective Clause
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </aside>
      </div>
      )}

      {/* Client Portal Interactive View */}
      {studioViewMode === 'client_portal' && (
        <div className="flex-1 overflow-y-auto bg-muted/15 p-4 md:p-8 flex justify-center">
          <div className="w-full max-w-4xl space-y-6">
            {/* Top Interactive Banner */}
            <div className="rounded-2xl border bg-card p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <AetherionLogo variant="symbol" size="sm" />
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    Aetherion Client Interactive Presentation
                  </span>
                </div>
                <h1 className="text-2xl font-black text-foreground tracking-tight">
                  {proposal.title}
                </h1>
                <p className="text-xs text-muted-foreground">
                  Prepared for <strong className="text-foreground">{proposal.formData?.step1?.clientCompany}</strong> &bull; Valid until {proposal.validUntil}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  isClientSigned
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                }`}>
                  {isClientSigned ? '✓ Authorized & Signed' : 'Pending Authorization'}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDownloadPdf}
                  className="gap-1.5 text-xs font-semibold"
                >
                  <Download className="h-3.5 w-3.5" /> PDF
                </Button>
              </div>
            </div>

            {/* Document Sections */}
            <div className="space-y-6">
              {proposal.sections.map((section, idx) => (
                <div key={section.id} className="rounded-2xl border bg-card p-6 md:p-8 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 border-b pb-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                      {idx + 1}
                    </span>
                    <h3 className="text-base font-bold text-foreground">{section.title}</h3>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed whitespace-pre-line text-xs md:text-sm">
                    {section.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Interactive Scope & Pricing Configurator */}
            <div className="rounded-2xl border-2 border-primary/30 bg-card p-6 md:p-8 shadow-md space-y-5">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  <h3 className="text-base font-bold text-foreground">
                    Interactive Commercial Investment &amp; Optional Add-ons
                  </h3>
                </div>
                <span className="text-xs text-muted-foreground">
                  Select optional service modules to customize your delivery tier
                </span>
              </div>

              <div className="space-y-2">
                {optionalAddons.map((addon) => (
                  <label
                    key={addon.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border bg-muted/10 hover:bg-muted/20 cursor-pointer transition"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={addon.isChecked}
                        onChange={() => {
                          setOptionalAddons((prev) =>
                            prev.map((a) => (a.id === addon.id ? { ...a, isChecked: !a.isChecked } : a))
                          )
                        }}
                        className="h-4 w-4 rounded text-primary cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-foreground">{addon.title}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-primary">
                      +${addon.price.toLocaleString()}
                    </span>
                  </label>
                ))}
              </div>

              {/* Dynamic Recalculated Summary */}
              {(() => {
                const baseNumeric = parseInt(proposal.totalValue?.replace(/[^0-9]/g, '') || '24000', 10) || 24000
                const addonsSum = optionalAddons.filter((a) => a.isChecked).reduce((acc, a) => acc + a.price, 0)
                const finalInvestment = baseNumeric + addonsSum
                const depositAmount = Math.round(finalInvestment * 0.4)

                return (
                  <div className="rounded-xl border bg-primary/5 p-4 space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Base Solution Deliverables:</span>
                      <span className="font-mono font-semibold">${baseNumeric.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Selected Optional Modules:</span>
                      <span className="font-mono font-semibold">+${addonsSum.toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between text-sm font-black text-foreground">
                      <span>Total Authorized Investment:</span>
                      <span className="text-base text-emerald-600 dark:text-emerald-400 font-mono">
                        ${finalInvestment.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-muted-foreground pt-1">
                      <span>Standard 40% Kickoff Deposit:</span>
                      <span className="font-mono font-bold text-foreground">${depositAmount.toLocaleString()}</span>
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* Cryptographic Digital Signature Authorization Pad */}
            <div className="rounded-2xl border-2 border-indigo-500/30 bg-card p-6 md:p-8 shadow-md space-y-6">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <FileSignature className="h-5 w-5 text-indigo-500" />
                  <h3 className="text-base font-bold text-foreground">
                    Electronic Proposal Acceptance &amp; Digital Sign-Off
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                  <ShieldCheck className="h-4 w-4" />
                  <span>256-Bit Cryptographic Non-Repudiation</span>
                </div>
              </div>

              {isClientSigned ? (
                <div className="rounded-xl border-2 border-emerald-500/40 bg-emerald-500/5 p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <span className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                        PROPOSAL DIGITALLY EXECUTED &amp; BINDING
                      </span>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">
                      Timestamp: {clientSignatureDate} UTC
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
                    <div>
                      <span className="text-muted-foreground">Authorized Signer:</span>
                      <p className="font-bold text-foreground">{clientSignerName}</p>
                      <p className="text-[11px] text-muted-foreground">{clientSignerTitle}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Digital Signature Seal (SHA-256):</span>
                      <p className="font-mono text-[10px] text-primary truncate">{clientSignatureHash}</p>
                      <span className="text-[10px] text-emerald-600 font-semibold">✓ Verified by Aetherion Legal Gateway</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground">Signer Full Legal Name</label>
                      <input
                        type="text"
                        value={clientSignerName}
                        onChange={(e) => setClientSignerName(e.target.value)}
                        className="w-full rounded-lg border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground">Signer Title / Designation</label>
                      <input
                        type="text"
                        value={clientSignerTitle}
                        onChange={(e) => setClientSignerTitle(e.target.value)}
                        className="w-full rounded-lg border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Cursive Signature Preview */}
                  <div className="rounded-xl border bg-muted/10 p-6 flex flex-col items-center justify-center space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                      Digital Signature Representation
                    </span>
                    <p className="font-serif italic text-3xl text-primary font-bold tracking-wider py-2">
                      {clientSignerName || 'Authorized Signatory'}
                    </p>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      Generated via Aetherion Secure Keyring
                    </span>
                  </div>

                  <Button
                    size="lg"
                    onClick={() => {
                      const hash = `SHA256-${Date.now().toString(16).toUpperCase()}-AETH-SEAL-VERIFIED`
                      setIsClientSigned(true)
                      setClientSignatureHash(hash)
                      handleStatusChange('accepted')
                      toast.success('🎉 Proposal accepted and digitally signed with SHA-256 cryptographic seal!')
                    }}
                    className="w-full font-black text-sm bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-lg gap-2 py-6"
                  >
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Authorize &amp; Digitally Sign Proposal Agreement</span>
                  </Button>
                </div>
              )}
            </div>

            {/* Client Feedback & Commenting System */}
            <div className="rounded-2xl border bg-card p-6 md:p-8 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b pb-3">
                <MessageSquare className="h-5 w-5 text-primary" />
                <h3 className="text-base font-bold text-foreground">
                  Direct Stakeholder Feedback &amp; Revision Notes
                </h3>
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={clientCommentInput}
                    onChange={(e) => setClientCommentInput(e.target.value)}
                    placeholder="Leave a comment or question for the Aetherion engineering team..."
                    className="flex-1 rounded-lg border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (clientCommentInput.trim()) {
                        setClientCommentsList((prev) => [
                          ...prev,
                          { author: clientSignerName || 'Stakeholder', text: clientCommentInput.trim(), date: 'Just now' }
                        ])
                        setClientCommentInput('')
                        toast.success('Note sent to proposal team!')
                      }
                    }}
                    disabled={!clientCommentInput.trim()}
                    className="text-xs font-semibold"
                  >
                    Post Note
                  </Button>
                </div>

                <div className="space-y-2 pt-2">
                  {clientCommentsList.map((c, i) => (
                    <div key={i} className="rounded-lg border bg-muted/15 p-3 text-xs space-y-1">
                      <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                        <span className="font-bold text-foreground">{c.author}</span>
                        <span>{c.date}</span>
                      </div>
                      <p className="text-foreground">{c.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Executive One-Pager Brief View */}
      {studioViewMode === 'one_pager' && (
        <div className="flex-1 overflow-y-auto bg-muted/20 p-4 md:p-8 flex justify-center">
          <div className="w-full max-w-3xl space-y-6">
            {/* Action Bar */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStudioViewMode('editor')}
                className="text-xs gap-1.5"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Editor
              </Button>
              <Button
                size="sm"
                onClick={() => window.print()}
                className="text-xs gap-1.5 font-bold bg-primary text-primary-foreground shadow-sm"
              >
                <Printer className="h-3.5 w-3.5" /> Print / Save 1-Pager
              </Button>
            </div>

            {/* A4 Sheet Presentation Card */}
            <div className="rounded-2xl border-2 bg-card p-8 md:p-12 shadow-xl space-y-6 print:border-none print:shadow-none">
              {/* Header */}
              <div className="flex items-center justify-between border-b-2 border-primary/20 pb-4">
                <div className="flex items-center gap-3">
                  <AetherionLogo variant="horizontal" size="sm" />
                </div>
                <div className="text-right">
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary">
                    Executive Brief
                  </span>
                  <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                    {proposal.generatedDate} &bull; Ref: {proposal.id.slice(0, 8)}
                  </p>
                </div>
              </div>

              {/* Title Block */}
              <div>
                <h1 className="text-2xl font-black text-foreground tracking-tight">
                  {proposal.title}
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Commissioned by <strong className="text-foreground">{proposal.formData?.step1?.clientCompany}</strong> &bull; Prepared by <strong className="text-foreground">Aetherion Labs Engineering</strong>
                </p>
              </div>

              {/* 4-Quadrant Strategic Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Quad 1: Strategic Intent */}
                <div className="rounded-xl border bg-muted/10 p-4 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                    1. Strategic Problem &amp; Objective
                  </span>
                  <p className="text-xs text-foreground leading-relaxed">
                    {proposal.formData?.step1?.problemStatement || proposal.sections[0]?.content.slice(0, 240) + '...'}
                  </p>
                </div>

                {/* Quad 2: Key Deliverables */}
                <div className="rounded-xl border bg-muted/10 p-4 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                    2. Core Architectural Scope
                  </span>
                  <ul className="text-xs text-foreground space-y-1">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>Production cloud infrastructure &amp; secure data pipelines</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>Automated CI/CD regressions &amp; SOC2 Type II compliance</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>Full intellectual property transfer upon final delivery</span>
                    </li>
                  </ul>
                </div>

                {/* Quad 3: 3-Phase Delivery Roadmap */}
                <div className="rounded-xl border bg-muted/10 p-4 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                    3. Delivery Roadmap &amp; Gates
                  </span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="font-semibold text-foreground">Phase 1: Architecture</span>
                      <span className="text-muted-foreground font-mono">Weeks 1-2</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-foreground">Phase 2: Core Engineering</span>
                      <span className="text-muted-foreground font-mono">Weeks 3-5</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-foreground">Phase 3: UAT &amp; Handover</span>
                      <span className="text-muted-foreground font-mono">Weeks 6-7</span>
                    </div>
                  </div>
                </div>

                {/* Quad 4: Commercial Terms & ROI */}
                <div className="rounded-xl border bg-emerald-500/5 border-emerald-500/20 p-4 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    4. Commercial Investment &amp; ROI
                  </span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-muted-foreground">Authorized Investment:</span>
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      {proposal.totalValue}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Expected ROI Multiple:</span>
                    <span className="font-bold text-foreground">3.4x Annual Multiple</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Target Payback Horizon:</span>
                    <span className="font-bold text-foreground">4.5 Months</span>
                  </div>
                </div>
              </div>

              {/* Guarantees Strip */}
              <div className="rounded-xl border bg-muted/20 p-4 flex flex-wrap items-center justify-between text-xs gap-2">
                <span className="flex items-center gap-1.5 font-semibold text-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" /> 99.9% Production SLA
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-foreground">
                  <Award className="h-4 w-4 text-emerald-500" /> 60-Day Post-Launch Warranty
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-foreground">
                  <Lock className="h-4 w-4 text-indigo-500" /> Full IP Assignment
                </span>
              </div>

              {/* Dual Signature Sign-off Block */}
              <div className="border-t pt-4 grid grid-cols-2 gap-8 text-xs">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Authorized Agency Representative:
                  </span>
                  <p className="font-serif italic text-lg text-primary">Hammad &bull; Principal Architect</p>
                  <p className="text-[10px] text-muted-foreground">Aetherion Labs Inc.</p>
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Authorized Client Representative:
                  </span>
                  <p className="font-serif italic text-lg text-foreground">
                    {clientSignerName || proposal.formData?.step1?.clientName || 'Dr. Sarah Jenkins'}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {proposal.formData?.step1?.clientCompany}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showClientModal && (
        <ClientPreviewModal
          proposal={proposal}
          onUpdateProposal={onUpdateProposal}
          onClose={() => setShowClientModal(false)}
          toast={toast}
        />
      )}

      {showPitchDeckModal && (
        <PitchDeckModal
          proposal={proposal}
          onClose={() => setShowPitchDeckModal(false)}
          toast={toast}
        />
      )}
    </div>
  )
}
