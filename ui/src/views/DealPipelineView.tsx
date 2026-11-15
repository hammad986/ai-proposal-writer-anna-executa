import { useState } from 'react'
import {
  Kanban,
  FileText,
  DollarSign,
  Calendar,
  Building,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { GeneratedProposal, ProposalStatus } from '@/types'
import { StatusBadge } from '@/components/ui/status-badge'

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
  const getColumnProposals = (status: ProposalStatus) => {
    return proposals.filter((p) => p.status === status)
  }

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
    toast.success(`Moved to ${newStatus}`)
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
              {proposals.length} Total Deals Tracked
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-foreground">
            Commercial Deal Pipeline
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Visualize your deal stages from initial brief to formal contract acceptance and won revenue.
          </p>
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const colProposals = getColumnProposals(col.status)
          return (
            <div key={col.status} className="flex flex-col rounded-xl border bg-muted/20 p-3 min-w-[220px] space-y-3">
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 border-b">
                <div className="flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${
                    col.status === 'accepted' ? 'bg-emerald-500' : col.status === 'sent' ? 'bg-blue-500' : col.status === 'review' ? 'bg-amber-500' : col.status === 'rejected' ? 'bg-rose-500' : 'bg-zinc-400'
                  }`} />
                  <span className="text-xs font-bold text-foreground">{col.label}</span>
                </div>
                <span className="rounded-full bg-card px-2 py-0.5 text-[10px] font-bold text-muted-foreground border">
                  {colProposals.length}
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
                      <span>Move stage:</span>
                      <select
                        value={prop.status}
                        onChange={(e) => {
                          e.stopPropagation()
                          handleStatusChange(prop, e.target.value as ProposalStatus)
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border bg-background px-1 py-0.5 text-[10px]"
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
                    <span>No proposals</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
