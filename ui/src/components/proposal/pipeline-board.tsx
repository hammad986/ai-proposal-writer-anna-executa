import React from 'react'
import {
  Clock,
  DollarSign,
  ChevronRight,
  ChevronLeft,
  Eye,
  ShieldCheck,
  Building2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Archive,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'
import type { GeneratedProposal, ProposalStatus } from '../../types'
import { formatCurrency, getDaysRemaining } from '../../utils'

interface PipelineBoardProps {
  proposals: GeneratedProposal[]
  onSelectProposal: (proposal: GeneratedProposal) => void
  onUpdateStatus: (id: string, newStatus: ProposalStatus) => void
}

const COLUMNS: Array<{
  status: ProposalStatus
  title: string
  color: string
  borderColor: string
  badgeBg: string
}> = [
  { status: 'draft', title: 'Drafting', color: 'text-amber-400', borderColor: 'border-amber-500/30', badgeBg: 'bg-amber-500/10' },
  { status: 'review', title: 'Internal Review', color: 'text-blue-400', borderColor: 'border-blue-500/30', badgeBg: 'bg-blue-500/10' },
  { status: 'sent', title: 'Sent to Client', color: 'text-purple-400', borderColor: 'border-purple-500/30', badgeBg: 'bg-purple-500/10' },
  { status: 'accepted', title: 'Won / Accepted', color: 'text-emerald-400', borderColor: 'border-emerald-500/30', badgeBg: 'bg-emerald-500/10' },
  { status: 'rejected', title: 'Declined', color: 'text-rose-400', borderColor: 'border-rose-500/30', badgeBg: 'bg-rose-500/10' },
  { status: 'archived', title: 'Archived', color: 'text-zinc-400', borderColor: 'border-zinc-700/40', badgeBg: 'bg-zinc-800' },
]

export const PipelineBoard: React.FC<PipelineBoardProps> = ({
  proposals,
  onSelectProposal,
  onUpdateStatus,
}) => {
  // Compute pipeline metrics
  const activeStatuses: ProposalStatus[] = ['draft', 'review', 'sent']
  const activeProposals = proposals.filter((p) => activeStatuses.includes(p.status))
  const wonProposals = proposals.filter((p) => p.status === 'accepted')
  const closedCount = proposals.filter((p) => p.status === 'accepted' || p.status === 'rejected').length

  const parseValue = (valStr: string) => {
    const num = parseFloat(valStr.replace(/[^0-9.]/g, ''))
    return isNaN(num) ? 0 : num
  }

  const pipelineValue = activeProposals.reduce((sum, p) => sum + parseValue(p.totalValue), 0)
  const wonRevenue = wonProposals.reduce((sum, p) => sum + parseValue(p.totalValue), 0)
  const winRate = closedCount > 0 ? Math.round((wonProposals.length / closedCount) * 100) : 0
  const avgDealSize = proposals.length > 0 ? Math.round((pipelineValue + wonRevenue) / proposals.length) : 0

  const getStatusOrder = (st: ProposalStatus) => {
    const order: ProposalStatus[] = ['draft', 'review', 'sent', 'accepted', 'rejected', 'archived']
    return order.indexOf(st)
  }

  const handleAdvance = (e: React.MouseEvent, p: GeneratedProposal) => {
    e.stopPropagation()
    const currentIdx = getStatusOrder(p.status)
    const nextStatuses: ProposalStatus[] = ['review', 'sent', 'accepted']
    if (currentIdx === 0) onUpdateStatus(p.id, 'review')
    else if (currentIdx === 1) onUpdateStatus(p.id, 'sent')
    else if (currentIdx === 2) onUpdateStatus(p.id, 'accepted')
  }

  const handleRegress = (e: React.MouseEvent, p: GeneratedProposal) => {
    e.stopPropagation()
    const currentIdx = getStatusOrder(p.status)
    if (currentIdx === 1) onUpdateStatus(p.id, 'draft')
    else if (currentIdx === 2) onUpdateStatus(p.id, 'review')
    else if (currentIdx >= 3) onUpdateStatus(p.id, 'sent')
  }

  return (
    <div className="space-y-6">
      {/* Top Pipeline KPI Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
        <div className="space-y-1">
          <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Active Pipeline</div>
          <div className="text-xl font-bold text-white flex items-center gap-1.5">
            <span className="text-indigo-400">$</span>
            {pipelineValue.toLocaleString()}
          </div>
          <div className="text-[11px] text-zinc-500">{activeProposals.length} active deals</div>
        </div>

        <div className="space-y-1">
          <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Won Revenue</div>
          <div className="text-xl font-bold text-emerald-400 flex items-center gap-1.5">
            <span>$</span>
            {wonRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-500/80">{wonProposals.length} closed won</div>
        </div>

        <div className="space-y-1">
          <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Win Rate</div>
          <div className="text-xl font-bold text-amber-400 flex items-center gap-1">
            {winRate}%
          </div>
          <div className="text-[11px] text-zinc-500">Based on closed deals</div>
        </div>

        <div className="space-y-1">
          <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Avg Deal Size</div>
          <div className="text-xl font-bold text-blue-400 flex items-center gap-1.5">
            <span>$</span>
            {avgDealSize.toLocaleString()}
          </div>
          <div className="text-[11px] text-zinc-500">Across {proposals.length} proposals</div>
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const colProposals = proposals.filter((p) => p.status === col.status)
          const colTotal = colProposals.reduce((sum, p) => sum + parseValue(p.totalValue), 0)

          return (
            <div
              key={col.status}
              className={`flex flex-col rounded-xl bg-zinc-900/40 border ${col.borderColor} min-w-[240px] max-w-[320px]`}
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-zinc-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.badgeBg} ring-1 ring-current ${col.color}`} />
                  <span className="text-xs font-semibold text-zinc-200">{col.title}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-400">
                    {colProposals.length}
                  </span>
                </div>
                <span className="text-[11px] font-medium text-zinc-400">
                  ${colTotal >= 1000 ? `${(colTotal / 1000).toFixed(1)}k` : colTotal}
                </span>
              </div>

              {/* Cards List */}
              <div className="p-2 space-y-2.5 flex-1 min-h-[300px] overflow-y-auto max-h-[650px]">
                {colProposals.length === 0 ? (
                  <div className="h-28 flex items-center justify-center border border-dashed border-zinc-800/60 rounded-lg text-[11px] text-zinc-600">
                    No proposals
                  </div>
                ) : (
                  colProposals.map((p) => {
                    const daysLeft = getDaysRemaining(p.validUntil)
                    const isExpiringSoon = daysLeft <= 7 && daysLeft > 0
                    const isExpired = daysLeft <= 0
                    const qaScore = p.qualityAudit?.overallScore

                    return (
                      <div
                        key={p.id}
                        onClick={() => onSelectProposal(p)}
                        className="group relative p-3.5 rounded-lg bg-zinc-900 border border-zinc-800/80 hover:border-indigo-500/50 hover:bg-zinc-850 cursor-pointer transition-all shadow-sm hover:shadow-md space-y-3"
                      >
                        {/* Title and Value */}
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-indigo-400 line-clamp-1 transition-colors">
                              {p.title.replace('Project Proposal: ', '')}
                            </h4>
                            <span className="text-xs font-bold text-white shrink-0">
                              {p.totalValue}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-1">
                            <Building2 className="w-3 h-3 text-zinc-500" />
                            <span className="truncate">{p.formData?.step1?.clientCompany || 'Client'}</span>
                          </div>
                        </div>

                        {/* Badges / Metrics */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-zinc-800/60 text-[10px]">
                          {qaScore !== undefined && (
                            <span
                              className={`px-1.5 py-0.5 rounded font-medium flex items-center gap-1 ${
                                qaScore >= 80
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : qaScore >= 60
                                  ? 'bg-amber-500/10 text-amber-400'
                                  : 'bg-rose-500/10 text-rose-400'
                              }`}
                            >
                              <ShieldCheck className="w-2.5 h-2.5" />
                              QA {qaScore}
                            </span>
                          )}

                          {p.dealHealth?.winProbability !== undefined && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium flex items-center gap-1">
                              <TrendingUp className="w-2.5 h-2.5" />
                              {p.dealHealth.winProbability}%
                            </span>
                          )}

                          <span
                            className={`px-1.5 py-0.5 rounded font-medium flex items-center gap-1 ${
                              isExpired
                                ? 'bg-rose-500/10 text-rose-400'
                                : isExpiringSoon
                                ? 'bg-amber-500/10 text-amber-400'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            <Clock className="w-2.5 h-2.5" />
                            {isExpired ? 'Expired' : `${daysLeft}d left`}
                          </span>

                          {p.analytics && p.analytics.totalViews > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 font-medium flex items-center gap-1">
                              <Eye className="w-2.5 h-2.5" />
                              {p.analytics.totalViews} views
                            </span>
                          )}
                        </div>

                        {/* Stage Controls */}
                        <div className="flex items-center justify-between pt-1 border-t border-zinc-800/40 text-[10px] text-zinc-500">
                          {col.status !== 'draft' ? (
                            <button
                              type="button"
                              onClick={(e) => handleRegress(e, p)}
                              className="hover:text-zinc-300 flex items-center gap-0.5 py-0.5 px-1 rounded hover:bg-zinc-800 transition-colors"
                              title="Move back"
                            >
                              <ChevronLeft className="w-3 h-3" />
                              Prev
                            </button>
                          ) : (
                            <span />
                          )}

                          {col.status !== 'accepted' && col.status !== 'archived' && (
                            <button
                              type="button"
                              onClick={(e) => handleAdvance(e, p)}
                              className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-0.5 py-0.5 px-1.5 rounded hover:bg-indigo-500/10 transition-colors ml-auto"
                              title="Advance stage"
                            >
                              Next
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
