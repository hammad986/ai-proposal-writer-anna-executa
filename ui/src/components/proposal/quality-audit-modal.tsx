import { useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  Sparkles,
  X,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { invokeExecutaTool } from '@/anna-bridge'
import { auditProposalLocally } from '@/utils'
import type { GeneratedProposal, QualityAuditResult } from '@/types'

export function QualityAuditModal({
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
  const [audit, setAudit] = useState<QualityAuditResult>(() => {
    return proposal.qualityAudit || auditProposalLocally(proposal)
  })
  const [isAuditing, setIsAuditing] = useState(false)

  const handleRunAudit = async () => {
    setIsAuditing(true)
    try {
      let result: QualityAuditResult
      try {
        const resp = await invokeExecutaTool<{ audit: QualityAuditResult }>('audit_proposal', {
          proposal,
        })
        if (resp?.audit && typeof resp.audit.overallScore === 'number') {
          result = resp.audit
        } else {
          result = auditProposalLocally(proposal)
        }
      } catch (err) {
        result = auditProposalLocally(proposal)
      }

      setAudit(result)
      onUpdateProposal({
        ...proposal,
        qualityAudit: result,
        updatedAt: new Date().toISOString(),
      })
      toast.success('Proposal Quality Audit completed!')
    } catch (e: any) {
      toast.error('Audit failed: ' + (e?.message || 'Unknown error'))
    } finally {
      setIsAuditing(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600 dark:text-emerald-400 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
    if (score >= 75) return 'text-blue-600 dark:text-blue-400 border-blue-500 bg-blue-50 dark:bg-blue-950/30'
    if (score >= 60) return 'text-amber-600 dark:text-amber-400 border-amber-500 bg-amber-50 dark:bg-amber-950/30'
    return 'text-red-600 dark:text-red-400 border-red-500 bg-red-50 dark:bg-red-950/30'
  }

  const getBarColor = (score: number) => {
    if (score >= 90) return 'bg-emerald-500'
    if (score >= 75) return 'bg-blue-500'
    if (score >= 60) return 'bg-amber-500'
    return 'bg-red-500'
  }

  const metricLabels: Array<{ key: keyof QualityAuditResult['metrics']; label: string; desc: string }> = [
    { key: 'completeness', label: 'Completeness', desc: 'Coverage of all critical proposal sections' },
    { key: 'clarity', label: 'Clarity & Depth', desc: 'Readability, paragraph length, and structure' },
    { key: 'pricingIntegrity', label: 'Pricing Integrity', desc: 'Tabular itemization and milestone clarity' },
    { key: 'scopeSpecificity', label: 'Scope Specificity', desc: 'Granular deliverables and task breakdown' },
    { key: 'riskCoverage', label: 'Risk & Governance', desc: 'Warranties, contingencies, and IP provisions' },
    { key: 'actionability', label: 'Actionability', desc: 'Clear call-to-action and kickoff next steps' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-xl border bg-card p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">AI Proposal Quality Assurance</h2>
              <p className="text-xs text-muted-foreground">
                Automated audit evaluating completeness, clarity, pricing math, and commercial risk.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Score Hero Banner */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border p-5 bg-muted/30">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-20 w-20 flex-col items-center justify-center rounded-full border-4 font-bold ${getScoreColor(
                audit.overallScore
              )}`}
            >
              <span className="text-2xl leading-none">{audit.overallScore}</span>
              <span className="text-[10px] uppercase tracking-wider font-semibold">Score</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">Overall Rating: Grade</span>
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                  {audit.grade}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                {audit.overallScore >= 90
                  ? 'Client-ready proposal! Meets high agency standards for clarity, structure, and risk mitigation.'
                  : audit.overallScore >= 75
                  ? 'Solid foundation. A few refinements in scope or terms will make this highly persuasive.'
                  : 'Needs attention. Several essential sections or pricing details are missing or vague.'}
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={handleRunAudit}
            disabled={isAuditing}
            className="shrink-0"
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${isAuditing ? 'animate-spin' : ''}`} />
            {isAuditing ? 'Auditing...' : 'Re-run QA Audit'}
          </Button>
        </div>

        {/* Metrics Grid */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Audit Dimensions
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {metricLabels.map(({ key, label, desc }) => {
              const val = audit.metrics[key] ?? 70
              return (
                <div key={key} className="rounded-lg border bg-card p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{label}</span>
                    <span className="font-bold text-foreground">{val}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getBarColor(val)}`}
                      style={{ width: `${val}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">{desc}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Strengths */}
        {audit.strengths.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Verified Strengths
            </h3>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              {audit.strengths.map((str, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actionable Recommendations */}
        {audit.actionableRecommendations.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Actionable Recommendations
            </h3>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              {audit.actionableRecommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2 rounded-md bg-amber-500/5 p-2 border border-amber-500/20">
                  <Zap className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-foreground/90">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Missing Critical Items Warning */}
        {audit.missingCriticalItems.length > 0 && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-red-600 dark:text-red-400">
              <HelpCircle className="h-4 w-4" />
              Missing Key Sections Detected
            </div>
            <p className="text-muted-foreground">
              This proposal is currently missing:{' '}
              <strong className="text-foreground">{audit.missingCriticalItems.join(', ')}</strong>. Consider adding these sections from the proposal editor.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t">
          <Button onClick={onClose} variant="primary">
            Close Audit
          </Button>
        </div>
      </div>
    </div>
  )
}
