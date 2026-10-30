import { useMemo, useState } from 'react'
import {
  Archive,
  ArrowUpDown,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  Filter,
  Layers,
  Palette,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  LayoutGrid,
  List,
} from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { BrandSettingsModal } from '@/components/layout/brand-settings-modal'
import { ClientPreviewModal } from '@/components/proposal/client-preview-modal'
import { TemplatePickerModal } from '@/components/proposal/template-picker'
import { PipelineBoard } from '@/components/proposal/pipeline-board'
import { generateProposalPdf } from '@/pdf-generator'
import type { BrandConfig, GeneratedProposal, ProposalStatus, ProposalTemplate } from '@/types'
import { currencyToNumber, formatCurrency, uid } from '@/utils'

type FilterTab = 'all' | 'draft' | 'review' | 'sent' | 'accepted' | 'rejected' | 'archived'
type SortOrder = 'date-desc' | 'date-asc' | 'value-desc' | 'value-asc' | 'client-asc'

const metricCardClass = 'rounded-xl border bg-card p-5 shadow-2xs space-y-2'

export function DashboardView({
  proposals,
  brandConfig,
  onUpdateBrandConfig,
  onNavigate,
  onDeleteProposal,
  onUpdateProposal,
  onCreateProposalFromTemplate,
  toast,
}: {
  proposals: GeneratedProposal[]
  brandConfig: BrandConfig
  onUpdateBrandConfig: (brand: BrandConfig) => void
  onNavigate: (route: string, proposalId?: string) => void
  onDeleteProposal: (id: string) => void
  onUpdateProposal: (updated: GeneratedProposal) => void
  onCreateProposalFromTemplate: (template: ProposalTemplate) => void
  toast: {
    success: (msg: string) => void
    info: (msg: string) => void
    error: (msg: string) => void
  }
}) {
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [sortOrder, setSortOrder] = useState<SortOrder>('date-desc')
  const [displayMode, setDisplayMode] = useState<'table' | 'pipeline'>('table')
  const [previewProposal, setPreviewProposal] = useState<GeneratedProposal | null>(null)
  const [showBrandModal, setShowBrandModal] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)

  // Derived KPI Stats
  const stats = useMemo(() => {
    const activeProposals = proposals.filter((p) => p.status !== 'archived')
    const totalCount = activeProposals.length
    const totalPipelineValue = activeProposals.reduce(
      (sum, item) => sum + currencyToNumber(item.totalValue),
      0
    )
    const acceptedList = activeProposals.filter((item) => item.status === 'accepted')
    const acceptedValue = acceptedList.reduce(
      (sum, item) => sum + currencyToNumber(item.totalValue),
      0
    )
    const pendingCount = activeProposals.filter(
      (item) => item.status === 'sent' || item.status === 'draft' || item.status === 'review'
    ).length
    const archivedCount = proposals.filter((p) => p.status === 'archived').length

    return {
      totalCount,
      totalPipelineValue: formatCurrency(totalPipelineValue, brandConfig.defaultCurrency),
      acceptedCount: acceptedList.length,
      acceptedValue: formatCurrency(acceptedValue, brandConfig.defaultCurrency),
      pendingCount,
      archivedCount,
    }
  }, [proposals, brandConfig])

  // Filtered & Sorted Proposal List
  const filteredProposals = useMemo(() => {
    return proposals
      .filter((p) => {
        // Tab filter
        if (activeTab === 'all') {
          return p.status !== 'archived'
        }
        return p.status === activeTab
      })
      .filter((p) => {
        // Search query filter
        if (!searchQuery.trim()) return true
        const q = searchQuery.toLowerCase()
        const titleMatch = (p.title || '').toLowerCase().includes(q)
        const clientMatch = (p.formData?.step1?.clientName || '').toLowerCase().includes(q)
        const companyMatch = (p.formData?.step1?.clientCompany || '').toLowerCase().includes(q)
        const industryMatch = (p.formData?.step1?.industry || '').toLowerCase().includes(q)
        return titleMatch || clientMatch || companyMatch || industryMatch
      })
      .sort((a, b) => {
        if (sortOrder === 'date-desc') {
          return (b.createdAt || '').localeCompare(a.createdAt || '')
        }
        if (sortOrder === 'date-asc') {
          return (a.createdAt || '').localeCompare(b.createdAt || '')
        }
        if (sortOrder === 'value-desc') {
          return currencyToNumber(b.totalValue) - currencyToNumber(a.totalValue)
        }
        if (sortOrder === 'value-asc') {
          return currencyToNumber(a.totalValue) - currencyToNumber(b.totalValue)
        }
        if (sortOrder === 'client-asc') {
          const nameA = a.formData?.step1?.clientCompany || a.formData?.step1?.clientName || ''
          const nameB = b.formData?.step1?.clientCompany || b.formData?.step1?.clientName || ''
          return nameA.localeCompare(nameB)
        }
        return 0
      })
  }, [proposals, activeTab, searchQuery, sortOrder])

  // Tab Counts
  const tabCounts = useMemo(() => {
    return {
      all: proposals.filter((p) => p.status !== 'archived').length,
      draft: proposals.filter((p) => p.status === 'draft').length,
      review: proposals.filter((p) => p.status === 'review').length,
      sent: proposals.filter((p) => p.status === 'sent').length,
      accepted: proposals.filter((p) => p.status === 'accepted').length,
      rejected: proposals.filter((p) => p.status === 'rejected').length,
      archived: proposals.filter((p) => p.status === 'archived').length,
    }
  }, [proposals])

  const handleDownloadPdf = (proposal: GeneratedProposal) => {
    try {
      generateProposalPdf(proposal, brandConfig.primaryColor)
      toast.success('Proposal PDF downloaded')
    } catch {
      toast.error('Failed to generate PDF')
    }
  }

  const handleDuplicateProposal = (original: GeneratedProposal) => {
    const nowIso = new Date().toISOString()
    const cloned: GeneratedProposal = {
      ...JSON.parse(JSON.stringify(original)),
      id: uid('proposal'),
      title: `${original.title} (Copy)`,
      status: 'draft',
      createdAt: nowIso,
      updatedAt: nowIso,
      signoff: undefined,
      statusHistory: [
        {
          status: 'draft',
          timestamp: nowIso,
          note: `Cloned from ${original.title}`,
        },
      ],
    }
    onUpdateProposal(cloned)
    toast.success('Proposal duplicated as draft')
  }

  const handleToggleArchive = (proposal: GeneratedProposal) => {
    const newStatus: ProposalStatus = proposal.status === 'archived' ? 'draft' : 'archived'
    const nowIso = new Date().toISOString()
    const updated: GeneratedProposal = {
      ...proposal,
      status: newStatus,
      statusHistory: [
        ...(proposal.statusHistory || []),
        {
          status: newStatus,
          timestamp: nowIso,
          note: `Proposal ${newStatus === 'archived' ? 'archived' : 'unarchived'}`,
        },
      ],
      updatedAt: nowIso,
    }
    onUpdateProposal(updated)
    toast.success(newStatus === 'archived' ? 'Proposal archived' : 'Proposal restored to draft')
  }

  const confirmDelete = () => {
    if (deleteTargetId) {
      onDeleteProposal(deleteTargetId)
      setDeleteTargetId(null)
      toast.success('Proposal deleted')
    }
  }

  return (
    <AppShell
      title="Proposals Management Workspace"
      currentRoute="dashboard"
      onNavigate={onNavigate}
      onNewProposal={() => onNavigate('new')}
      onOpenBrandSettings={() => setShowBrandModal(true)}
      extraActions={
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowTemplateModal(true)}
          title="Browse Proposal Templates"
        >
          <Layers className="h-4 w-4 mr-1.5 text-primary" />
          <span className="hidden sm:inline">Templates</span>
        </Button>
      }
    >
      <div className="space-y-6">
        {/* KPI Metrics Banner */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className={metricCardClass}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Active Proposals
            </p>
            <p className="text-3xl font-extrabold tracking-tight text-foreground">
              {stats.totalCount}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {stats.pendingCount} proposals in flight
            </p>
          </div>

          <div className={metricCardClass}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Pipeline Value
            </p>
            <p className="text-3xl font-extrabold tracking-tight text-foreground">
              {stats.totalPipelineValue}
            </p>
            <p className="text-[11px] text-muted-foreground">Active un-archived volume</p>
          </div>

          <div className={metricCardClass}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Won / Accepted
            </p>
            <p className="text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
              {stats.acceptedCount}
            </p>
            <p className="text-[11px] text-muted-foreground">{stats.acceptedValue} closed value</p>
          </div>

          <div className={metricCardClass}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Agency Brand &amp; Currency
            </p>
            <p className="text-xl font-bold tracking-tight text-primary truncate">
              {brandConfig.companyName}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Default: {brandConfig.defaultCurrency} · {stats.archivedCount} archived
            </p>
          </div>
        </section>

        {/* Proposals Filter Strip */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Tab buttons */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg border bg-card p-1">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'draft', label: 'Drafts' },
                { id: 'review', label: 'In Review' },
                { id: 'sent', label: 'Sent' },
                { id: 'accepted', label: 'Won' },
                { id: 'rejected', label: 'Declined' },
                { id: 'archived', label: 'Archived' },
              ] as const
            ).map((tab) => {
              const count = tabCounts[tab.id]
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    isActive
                      ? 'bg-primary text-white shadow-2xs'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                      isActive ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* View Mode & Search/Sort */}
          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 rounded-lg border bg-card p-1">
              <button
                type="button"
                onClick={() => setDisplayMode('table')}
                className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                  displayMode === 'table'
                    ? 'bg-primary text-white shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Table View"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
              <button
                type="button"
                onClick={() => setDisplayMode('pipeline')}
                className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                  displayMode === 'pipeline'
                    ? 'bg-primary text-white shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Kanban Pipeline View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Pipeline</span>
              </button>
            </div>

            <div className="relative flex-1 sm:w-60">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search project or client..."
                className="w-full rounded-md border bg-card pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary"
              />
            </div>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              className="rounded-md border bg-card px-2.5 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="value-desc">Value (High to Low)</option>
              <option value="value-asc">Value (Low to High)</option>
              <option value="client-asc">Client Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* View Toggle: Pipeline Kanban vs Table */}
        {displayMode === 'pipeline' ? (
          <PipelineBoard
            proposals={filteredProposals}
            onSelectProposal={(p) => onNavigate('detail', p.id)}
            onUpdateStatus={(id, newStatus) => {
              const target = proposals.find((p) => p.id === id)
              if (target) {
                const nowIso = new Date().toISOString()
                const updated: GeneratedProposal = {
                  ...target,
                  status: newStatus,
                  statusHistory: [
                    ...(target.statusHistory || []),
                    {
                      status: newStatus,
                      timestamp: nowIso,
                      note: `Stage updated to ${newStatus} via Kanban Pipeline`,
                    },
                  ],
                  updatedAt: nowIso,
                }
                onUpdateProposal(updated)
                toast.success(`Proposal moved to ${newStatus}`)
              }
            }}
          />
        ) : (
          <Card className="overflow-hidden">
          <CardContent className="p-0">
            {filteredProposals.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <Sparkles className="mx-auto h-10 w-10 text-muted-foreground opacity-40" />
                <h3 className="text-base font-bold text-foreground">No proposals matching criteria</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {searchQuery
                    ? 'No proposals matched your search query. Try clearing the search filter.'
                    : 'Get started by creating your first AI-assisted client proposal or choose an industry template.'}
                </p>
                <div className="flex justify-center gap-2 pt-2">
                  <Button size="sm" onClick={() => onNavigate('new')}>
                    <Plus className="h-4 w-4 mr-1" />
                    Create Proposal
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowTemplateModal(true)}>
                    <Layers className="h-4 w-4 mr-1" />
                    Use Template
                  </Button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-xs text-left">
                  <thead className="border-b bg-muted/60 uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3.5 font-semibold">Project Title</th>
                      <th className="px-5 py-3.5 font-semibold">Client Organization</th>
                      <th className="px-5 py-3.5 font-semibold">Date / Valid</th>
                      <th className="px-5 py-3.5 font-semibold">Value</th>
                      <th className="px-5 py-3.5 font-semibold">Status</th>
                      <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredProposals.map((proposal) => (
                      <tr key={proposal.id} className="transition hover:bg-muted/30">
                        <td className="px-5 py-4">
                          <button
                            onClick={() => onNavigate('detail', proposal.id)}
                            className="font-bold text-foreground hover:text-primary transition text-left cursor-pointer truncate max-w-xs block"
                          >
                            {proposal.title}
                          </button>
                          <span className="text-[11px] text-muted-foreground truncate block">
                            {proposal.formData?.step1?.projectType || 'Software Project'} ·{' '}
                            {proposal.sections.length} sections
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-medium text-foreground block">
                            {proposal.formData?.step1?.clientCompany || '—'}
                          </span>
                          <span className="text-[11px] text-muted-foreground block">
                            {proposal.formData?.step1?.clientName || ''}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">
                          <span className="block text-foreground font-medium">
                            {proposal.generatedDate || proposal.createdAt.slice(0, 10)}
                          </span>
                          <span className="text-[10px]">Valid: {proposal.validUntil}</span>
                        </td>
                        <td className="px-5 py-4 font-bold text-foreground">
                          {proposal.totalValue}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={proposal.status} />
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex justify-end items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Open proposal workbench"
                              onClick={() => onNavigate('detail', proposal.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Client preview & sign-off"
                              onClick={() => setPreviewProposal(proposal)}
                            >
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Duplicate proposal as draft"
                              onClick={() => handleDuplicateProposal(proposal)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Download PDF"
                              onClick={() => handleDownloadPdf(proposal)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              title={proposal.status === 'archived' ? 'Unarchive' : 'Archive'}
                              onClick={() => handleToggleArchive(proposal)}
                            >
                              {proposal.status === 'archived' ? (
                                <RotateCcw className="h-4 w-4 text-primary" />
                              ) : (
                                <Archive className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Delete proposal"
                              onClick={() => setDeleteTargetId(proposal.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-foreground">Permanently delete proposal?</h3>
            <p className="text-xs text-muted-foreground">
              Are you sure you want to delete this proposal? This operation permanently removes it from your Anna Host storage workspace.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={() => setDeleteTargetId(null)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={confirmDelete}>
                Delete Proposal
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {previewProposal && (
        <ClientPreviewModal
          proposal={previewProposal}
          onUpdateProposal={onUpdateProposal}
          onClose={() => setPreviewProposal(null)}
          toast={toast}
        />
      )}

      {showBrandModal && (
        <BrandSettingsModal
          brand={brandConfig}
          onSave={(updated) => {
            onUpdateBrandConfig(updated)
            toast.success('Agency brand settings saved!')
          }}
          onClose={() => setShowBrandModal(false)}
        />
      )}

      {showTemplateModal && (
        <TemplatePickerModal
          onSelectTemplate={(tpl) => {
            onCreateProposalFromTemplate(tpl)
            toast.success(`Started new proposal from template: ${tpl.name}`)
          }}
          onClose={() => setShowTemplateModal(false)}
        />
      )}
    </AppShell>
  )
}
