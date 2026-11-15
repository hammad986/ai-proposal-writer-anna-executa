import { useMemo, useState } from 'react'
import {
  Mic,
  FileCheck,
  LayoutTemplate,
  Plus,
  Search,
  Filter,
  Sparkles,
  TrendingUp,
  Clock,
  ArrowRight,
  Eye,
  FileText,
  Trash2,
  Copy,
  DollarSign,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { AetherionLogo } from '@/components/branding/AetherionLogo'
import { ClientPreviewModal } from '@/components/proposal/client-preview-modal'
import { generateProposalPdf } from '@/pdf-generator'
import { generateProposalDocx } from '@/docx-generator'
import type { BrandConfig, GeneratedProposal, ProposalStatus } from '@/types'
import { currencyToNumber, formatCurrency, uid, downloadFile } from '@/utils'

type FilterTab = 'all' | 'draft' | 'review' | 'sent' | 'accepted' | 'rejected'

interface DashboardViewProps {
  proposals: GeneratedProposal[]
  brandConfig: BrandConfig
  onNavigate: (route: string, proposalId?: string) => void
  onDeleteProposal: (id: string) => void
  onUpdateProposal: (updated: GeneratedProposal) => void
  toast: {
    success: (msg: string) => void
    info: (msg: string) => void
    error: (msg: string) => void
  }
}

export function DashboardView({
  proposals,
  brandConfig,
  onNavigate,
  onDeleteProposal,
  onUpdateProposal,
  toast,
}: DashboardViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [previewProposal, setPreviewProposal] = useState<GeneratedProposal | null>(null)

  // Derived KPI Stats
  const stats = useMemo(() => {
    const active = proposals.filter((p) => p.status !== 'archived')
    const totalPipeline = active.reduce((sum, p) => sum + currencyToNumber(p.totalValue), 0)
    const won = active.filter((p) => p.status === 'accepted')
    const wonValue = won.reduce((sum, p) => sum + currencyToNumber(p.totalValue), 0)
    const winRate = active.length > 0 ? Math.round((won.length / active.length) * 100) : 0

    return {
      totalCount: active.length,
      totalPipeline: formatCurrency(totalPipeline, brandConfig.defaultCurrency),
      wonValue: formatCurrency(wonValue, brandConfig.defaultCurrency),
      winRate: `${winRate}%`,
    }
  }, [proposals, brandConfig])

  // Filtered proposals
  const filteredProposals = useMemo(() => {
    return proposals.filter((p) => {
      const matchesTab = activeTab === 'all' || p.status === activeTab
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        p.title.toLowerCase().includes(query) ||
        (p.formData?.step1?.clientCompany || '').toLowerCase().includes(query) ||
        (p.formData?.step1?.projectName || '').toLowerCase().includes(query)
      return matchesTab && matchesSearch
    })
  }, [proposals, activeTab, searchQuery])

  const handleDuplicate = (prop: GeneratedProposal) => {
    const clone: GeneratedProposal = {
      ...prop,
      id: `prop_${Date.now()}`,
      title: `${prop.title} (Copy)`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    onUpdateProposal(clone)
    toast.success(`Duplicated '${prop.title}'`)
  }

  const handleDownloadDocx = async (prop: GeneratedProposal) => {
    try {
      const blob = await generateProposalDocx(prop)
      const cleanFilename = (prop.title || 'proposal').toLowerCase().replace(/[^a-z0-9]+/g, '-')
      downloadFile(blob as any, `${cleanFilename}.docx`, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      toast.success('Word docx downloaded!')
    } catch (e: any) {
      toast.error('Export error: ' + e.message)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
      {/* Top Welcome & KPIs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <AetherionLogo variant="horizontal" size="md" />
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              AI Proposal Studio 3.0
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Enterprise Proposal &amp; RFP Intelligence Workspace. Engineered by Aetherion Labs.
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border bg-card p-3 shadow-2xs space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active Deals</span>
            <p className="text-lg font-black text-foreground">{stats.totalCount}</p>
          </div>
          <div className="rounded-xl border bg-card p-3 shadow-2xs space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active Pipeline</span>
            <p className="text-lg font-black text-primary truncate">{stats.totalPipeline}</p>
          </div>
          <div className="rounded-xl border bg-card p-3 shadow-2xs space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Won Value</span>
            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 truncate">{stats.wonValue}</p>
          </div>
          <div className="rounded-xl border bg-card p-3 shadow-2xs space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Win Rate</span>
            <p className="text-lg font-black text-foreground">{stats.winRate}</p>
          </div>
        </div>
      </div>

      {/* 4 Quick Start Action Cards */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Create New Proposal &mdash; Choose Modality
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Voice */}
          <Card
            onClick={() => onNavigate('voice')}
            className="group border-2 hover:border-rose-500/50 bg-card hover:shadow-lg transition cursor-pointer p-5 space-y-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition">
              <Mic className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground group-hover:text-rose-500 transition">
                Voice-to-Proposal
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                Speak your project idea naturally. AI transcribes and extracts structured scope.
              </p>
            </div>
            <span className="text-xs font-bold text-rose-500 flex items-center gap-1 pt-1">
              Start Speaking <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Card>

          {/* Card 2: RFP Shredder */}
          <Card
            onClick={() => onNavigate('rfp')}
            className="group border-2 hover:border-emerald-500/50 bg-card hover:shadow-lg transition cursor-pointer p-5 space-y-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground group-hover:text-emerald-600 transition">
                AI RFP Shredder
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                Upload or paste client RFPs to extract clauses and build a live compliance matrix.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 pt-1">
              Shred Document <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Card>

          {/* Card 3: Templates */}
          <Card
            onClick={() => onNavigate('templates')}
            className="group border-2 hover:border-primary/50 bg-card hover:shadow-lg transition cursor-pointer p-5 space-y-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition">
              <LayoutTemplate className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition">
                Template Gallery
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                Choose from 8+ battle-tested blueprints tailored for web, AI, and consulting.
              </p>
            </div>
            <span className="text-xs font-bold text-primary flex items-center gap-1 pt-1">
              Browse Gallery <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Card>

          {/* Card 4: Guided Scoping */}
          <Card
            onClick={() => onNavigate('new')}
            className="group border-2 hover:border-indigo-500/50 bg-card hover:shadow-lg transition cursor-pointer p-5 space-y-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground group-hover:text-indigo-500 transition">
                Guided Scoping Wizard
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                Configure deliverables, tech stacks, and CPQ pricing step-by-step.
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-500 flex items-center gap-1 pt-1">
              Step-by-Step <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Card>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 text-xs">
            {(['all', 'draft', 'review', 'sent', 'accepted', 'rejected'] as FilterTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-lg px-3 py-1.5 font-bold uppercase tracking-wider transition cursor-pointer whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {tab === 'all' ? 'All Proposals' : tab}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by proposal or client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border bg-background pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Proposals List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProposals.map((prop) => (
            <Card
              key={prop.id}
              className="group flex flex-col justify-between border bg-card hover:border-primary/50 hover:shadow-lg transition p-5 space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <StatusBadge status={prop.status} />
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    {prop.totalValue}
                  </span>
                </div>

                <div>
                  <h4
                    onClick={() => onNavigate('studio', prop.id)}
                    className="text-sm font-bold text-foreground group-hover:text-primary transition cursor-pointer line-clamp-1"
                  >
                    {prop.title}
                  </h4>
                  <p className="text-xs text-muted-foreground truncate">
                    Client: <strong className="text-foreground">{prop.formData?.step1?.clientCompany || 'Client Partner'}</strong>
                  </p>
                </div>

                <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1">
                  <span>Sections: {prop.sections.length}</span>
                  <span>Valid: {prop.validUntil}</span>
                </div>
              </div>

              {/* Action Toolbar on Card */}
              <div className="flex items-center justify-between border-t pt-3">
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDownloadDocx(prop)}
                    className="h-7 px-2 text-[11px] text-blue-600 hover:text-blue-700"
                    title="Export Word docx"
                  >
                    <FileText className="h-3 w-3 mr-1" /> Word
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => generateProposalPdf(prop)}
                    className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                    title="Export PDF"
                  >
                    <Download className="h-3 w-3 mr-1" /> PDF
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDuplicate(prop)}
                    className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                    title="Duplicate"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDeleteProposal(prop.id)}
                    className="h-7 px-2 text-[11px] text-muted-foreground hover:text-rose-600"
                    title="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                <Button
                  size="sm"
                  onClick={() => onNavigate('studio', prop.id)}
                  className="h-7 text-xs font-semibold gap-1 bg-primary/90 hover:bg-primary text-primary-foreground"
                >
                  <span>Open Studio</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {filteredProposals.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-xl bg-card/40 space-y-3">
            <Sparkles className="h-8 w-8 text-muted-foreground" />
            <h4 className="text-sm font-bold text-foreground">No proposals found</h4>
            <p className="text-xs text-muted-foreground max-w-sm">
              Try adjusting your search criteria or create a proposal using Voice, RFP Shredding, or Templates.
            </p>
            <Button onClick={() => onNavigate('voice')} size="sm" className="text-xs font-semibold">
              🎙️ Speak Your First Proposal
            </Button>
          </div>
        )}
      </div>

      {previewProposal && (
        <ClientPreviewModal
          proposal={previewProposal}
          onUpdateProposal={onUpdateProposal}
          onClose={() => setPreviewProposal(null)}
          toast={toast}
        />
      )}
    </div>
  )
}
