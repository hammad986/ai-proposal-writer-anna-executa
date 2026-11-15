import { useState, useMemo } from 'react'
import {
  Kanban,
  Table as TableIcon,
  FileText,
  DollarSign,
  Calendar,
  Building,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { GeneratedProposal, ProposalStatus } from '@/types'
import { StatusBadge } from '@/components/ui/status-badge'
import { currencyToNumber, formatCurrency } from '@/utils'
import { AetherionLogo } from '@/components/branding/AetherionLogo'

interface DealPipelineViewProps {
  proposals: GeneratedProposal[]
  onUpdateProposal: (updated: GeneratedProposal) => void
  onNavigateToStudio: (proposalId: string) => void
  toast: {
    success: (msg: string) => void
    error: (msg: string) => void
  }
}

const COLUMNS: Array<{ status: ProposalStatus; label: string; color: string }> = [
  { status: 'draft', label: 'Drafting', color: 'border-zinc-400' },
  { status: 'review', label: 'Internal Review', color: 'border-amber-500' },
  { status: 'sent', label: 'Sent to Client', color: 'border-blue-500' },
  { status: 'accepted', label: 'Won / Accepted', color: 'border-emerald-500' },
  { status: 'rejected', label: 'Declined', color: 'border-rose-500' },
]

export function DealPipelineView({
  proposals,
  onUpdateProposal,
  onNavigateToStudio,
  toast,
}: DealPipelineViewProps) {
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredProposals = useMemo(() => {
    if (!searchQuery.trim()) return proposals
    const q = searchQuery.toLowerCase()
    return proposals.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.formData?.step1?.clientCompany || '').toLowerCase().includes(q) ||
        (p.formData?.step1?.projectName || '').toLowerCase().includes(q)
    )
  }, [proposals, searchQuery])

  // Real aggregate financial metrics per stage
  const columnMetrics = useMemo(() => {
    const metrics: Record<ProposalStatus, { count: number; total: number }> = {
      draft: { count: 0, total: 0 },
      review: { count: 0, total: 0 },
      sent: { count: 0, total: 0 },
      accepted: { count: 0, total: 0 },
      rejected: { count: 0, total: 0 },
      archived: { count: 0, total: 0 },
    }

    for (const p of filteredProposals) {
      const val = currencyToNumber(p.totalValue)
      if (metrics[p.status]) {
        metrics[p.status].count += 1
        metrics[p.status].total += val
      }
    }
    return metrics
  }, [filteredProposals])

  const totalActivePipeline = useMemo(() => {
    return filteredProposals
      .filter((p) => p.status !== 'archived' && p.status !== 'rejected')
      .reduce((sum, p) => sum + currencyToNumber(p.totalValue), 0)
  }, [filteredProposals])

  const handleStatusChange = (proposal: GeneratedProposal, newStatus: ProposalStatus) => {
    const updated = {
      ...proposal,
      status: newStatus,
      statusHistory: [
        ...(proposal.statusHistory || []),
        { status: newStatus, timestamp: new Date().toISOString() },
      ],
      updatedAt: new Date().toISOString(),
    }
    onUpdateProposal(updated)
    toast.success(`Moved '${proposal.title}' to ${newStatus}`)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary flex items-center gap-1.5">
              <Kanban className="h-3.5 w-3.5" />
              Deal Pipeline CRM 3.0
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {filteredProposals.length} Proposals Tracked
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-foreground">
            Commercial Deal Pipeline
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Visualize deal velocity and commercial value from initial scoping to won contract.
          </p>
        </div>

        {/* View Switcher & Search */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search deals..."
              className="w-48 rounded-lg border bg-background pl-8 pr-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          </div>

          <div className="flex items-center rounded-lg border bg-card p-0.5 shadow-2xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Kanban className="h-3.5 w-3.5" />
              Kanban
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              Table
            </button>
          </div>
        </div>
      </div>

      {/* Pipeline Summary Bar */}
      <div className="rounded-xl border bg-card p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Active Pipeline Value
            </span>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalActivePipeline, 'USD')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] text-muted-foreground font-semibold">In Review</span>
            <p className="font-bold text-foreground">
              {formatCurrency(columnMetrics.review.total, 'USD')} ({columnMetrics.review.count})
            </p>
          </div>
          <div className="h-8 w-[1px] bg-border" />
          <div className="space-y-0.5">
            <span className="text-[10px] text-muted-foreground font-semibold">Won Revenue</span>
            <p className="font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(columnMetrics.accepted.total, 'USD')} ({columnMetrics.accepted.count})
            </p>
          </div>
        </div>
      </div>

      {/* KANBAN VIEW */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const colProposals = filteredProposals.filter((p) => p.status === col.status)
            const stageTotal = columnMetrics[col.status]?.total || 0
            return (
              <div
                key={col.status}
                className="flex flex-col rounded-xl border bg-muted/20 p-3 min-w-[230px] space-y-3"
              >
                {/* Column Header */}
                <div className="flex flex-col pb-2 border-b space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          col.status === 'accepted'
                            ? 'bg-emerald-500'
                            : col.status === 'sent'
                            ? 'bg-blue-500'
                            : col.status === 'review'
                            ? 'bg-amber-500'
                            : col.status === 'rejected'
                            ? 'bg-rose-500'
                            : 'bg-zinc-400'
                        }`}
                      />
                      <span className="text-xs font-bold text-foreground">{col.label}</span>
                    </div>
                    <span className="rounded-full bg-card px-2 py-0.5 text-[10px] font-bold text-muted-foreground border">
                      {colProposals.length}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    Vol: {formatCurrency(stageTotal, 'USD')}
                  </span>
                </div>

                {/* Cards List */}
                <div className="flex-1 space-y-2.5">
                  {colProposals.map((prop) => (
                    <Card
                      key={prop.id}
                      className="p-3.5 border bg-card hover:border-primary/50 hover:shadow-md transition cursor-pointer space-y-2.5 group"
                      onClick={() => onNavigateToStudio(prop.id)}
                    >
                      <div>
                        <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition line-clamp-1">
                          {prop.title}
                        </h4>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {prop.formData?.step1?.clientCompany || 'Client Partner'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">
                          {prop.totalValue}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {prop.generatedDate}
                        </span>
                      </div>

                      {/* Move stage quick actions */}
                      <div className="flex items-center justify-between pt-1 border-t text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition">
                        <span>Move:</span>
                        <select
                          value={prop.status}
                          onChange={(e) => {
                            e.stopPropagation()
                            handleStatusChange(prop, e.target.value as ProposalStatus)
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border bg-background px-1 py-0.5 text-[10px] font-semibold"
                        >
                          {COLUMNS.map((c) => (
                            <option key={c.status} value={c.status}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </Card>
                  ))}

                  {colProposals.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-6 text-center text-xs text-muted-foreground border border-dashed rounded-lg bg-card/40">
                      <span>No deals in this stage</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <Card className="border shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-muted/30 text-muted-foreground font-semibold">
                <tr>
                  <th className="py-3 px-4">Proposal Title</th>
                  <th className="py-3 px-4">Client Partner</th>
                  <th className="py-3 px-4">Value</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4">Valid Until</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredProposals.map((prop) => (
                  <tr key={prop.id} className="hover:bg-muted/10 transition">
                    <td className="py-3.5 px-4 font-bold text-foreground max-w-xs truncate">
                      {prop.title}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      {prop.formData?.step1?.clientCompany || 'Client Partner'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {prop.totalValue}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={prop.status} />
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground font-mono text-[11px]">
                      {prop.generatedDate}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground font-mono text-[11px]">
                      {prop.validUntil}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        size="sm"
                        onClick={() => onNavigateToStudio(prop.id)}
                        className="h-7 text-xs font-semibold gap-1"
                      >
                        <span>Open Studio</span>
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
