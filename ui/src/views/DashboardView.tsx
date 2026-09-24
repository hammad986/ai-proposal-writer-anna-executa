import { useMemo, useState } from 'react'
import { Download, Eye, Trash2, Plus, Sparkles } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { generateProposalPdf } from '@/pdf-generator'
import type { GeneratedProposal } from '@/types'
import { currencyToNumber, formatCurrencyINR } from '@/utils'

const metricClass = 'rounded-lg border bg-card p-5 shadow-sm'

export function DashboardView({
  proposals,
  onNavigate,
  onDeleteProposal,
  toast,
}: {
  proposals: GeneratedProposal[]
  onNavigate: (route: string, proposalId?: string) => void
  onDeleteProposal: (id: string) => void
  toast: {
    success: (msg: string) => void
    info: (msg: string) => void
    error: (msg: string) => void
  }
}) {
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const stats = useMemo(() => {
    const totalValue = proposals.reduce((sum, item) => sum + currencyToNumber(item.totalValue), 0)
    const accepted = proposals.filter((item) => item.status === 'accepted')
    const pending = proposals.filter((item) => item.status === 'sent' || item.status === 'draft')
    return {
      totalCount: proposals.length,
      totalValue: formatCurrencyINR(totalValue),
      acceptedCount: accepted.length,
      acceptedValue: formatCurrencyINR(
        accepted.reduce((sum, item) => sum + currencyToNumber(item.totalValue), 0)
      ),
      pendingCount: pending.length,
    }
  }, [proposals])

  const handleDownloadPdf = (proposal: GeneratedProposal) => {
    try {
      generateProposalPdf(proposal)
      toast.success('Proposal PDF downloaded')
    } catch (e) {
      toast.error('Failed to generate PDF')
    }
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
      title="Proposals"
      currentRoute="dashboard"
      onNavigate={onNavigate}
      onNewProposal={() => onNavigate('new')}
    >
      <div className="space-y-6">
        {/* KPI Metrics */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className={metricClass}>
            <p className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Total Proposals
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{stats.totalCount}</p>
          </div>
          <div className={metricClass}>
            <p className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Total Pipeline Value
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{stats.totalValue}</p>
          </div>
          <div className={metricClass}>
            <p className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Accepted Proposals
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {stats.acceptedCount}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{stats.acceptedValue}</p>
          </div>
          <div className={metricClass}>
            <p className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Pending / In Review
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
              {stats.pendingCount}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Sent and draft proposals</p>
          </div>
        </section>

        {/* Proposals List Card */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {proposals.length === 0 ? (
              <div className="py-16 text-center">
                <Sparkles className="mx-auto h-10 w-10 text-muted-foreground opacity-50" />
                <h3 className="mt-4 text-base font-semibold">No proposals yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Get started by generating your first AI-assisted client proposal.
                </p>
                <Button className="mt-5" onClick={() => onNavigate('new')}>
                  <Plus className="h-4 w-4 mr-1" />
                  Create First Proposal
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm text-left">
                  <thead className="border-b bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3.5 font-semibold">Project Title</th>
                      <th className="px-5 py-3.5 font-semibold">Client Company</th>
                      <th className="px-5 py-3.5 font-semibold">Date</th>
                      <th className="px-5 py-3.5 font-semibold">Budget</th>
                      <th className="px-5 py-3.5 font-semibold">Status</th>
                      <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {proposals.map((proposal) => (
                      <tr key={proposal.id} className="transition hover:bg-muted/40">
                        <td className="px-5 py-4">
                          <button
                            onClick={() => onNavigate('detail', proposal.id)}
                            className="font-medium text-foreground hover:text-primary transition text-left cursor-pointer"
                          >
                            {proposal.title}
                          </button>
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">
                          {proposal.formData.step1.clientCompany || '—'}
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">
                          {proposal.generatedDate || proposal.createdAt.slice(0, 10)}
                        </td>
                        <td className="px-5 py-4 font-medium text-foreground">{proposal.totalValue}</td>
                        <td className="px-5 py-4">
                          <StatusBadge status={proposal.status} />
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              title="View and edit proposal"
                              onClick={() => onNavigate('detail', proposal.id)}
                            >
                              <Eye className="h-4 w-4" />
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
                              title="Delete proposal"
                              onClick={() => setDeleteTargetId(proposal.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
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
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs px-4">
          <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-semibold tracking-tight">Delete proposal?</h3>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this proposal? This removes it permanently from your Anna storage workspace.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDeleteTargetId(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={confirmDelete}>
                Delete Proposal
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
