import { useState } from 'react'
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  X,
  ShieldCheck,
  Target,
  RefreshCw,
  Lightbulb,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { invokeExecutaTool } from '@/anna-bridge'
import { createDefaultDealHealth } from '@/defaults'
import type { GeneratedProposal, DealHealthAnalysis } from '@/types'

interface DealHealthModalProps {
  proposal: GeneratedProposal
  onUpdateProposal: (updated: GeneratedProposal) => void
  onClose: () => void
  toast: {
    success: (msg: string) => void
    error: (msg: string) => void
  }
}

export function DealHealthModal({
  proposal,
  onUpdateProposal,
  onClose,
  toast,
}: DealHealthModalProps) {
  const [health, setHealth] = useState<DealHealthAnalysis>(() => {
    return proposal.dealHealth || createDefaultDealHealth(proposal)
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleReanalyze = async () => {
    setIsAnalyzing(true)
    try {
      let result: DealHealthAnalysis = createDefaultDealHealth(proposal)
      try {
        const resp = await invokeExecutaTool<{ dealHealth: DealHealthAnalysis }>(
          'analyze_deal_health',
          { proposal }
        )
        if (resp?.dealHealth && typeof resp.dealHealth.winProbability === 'number') {
          result = resp.dealHealth
        }
      } catch (err) {
        // Fallback to local deterministic analysis
        result = createDefaultDealHealth(proposal)
      }

      setHealth(result)
      onUpdateProposal({
        ...proposal,
        dealHealth: result,
        updatedAt: new Date().toISOString(),
      })
      toast.success('Deal health and win-rate analysis updated!')
    } catch (e: any) {
      toast.error('Deal analysis failed: ' + (e?.message || 'Unknown error'))
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getScoreBadgeClass = (score: number) => {
    if (score >= 85) return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
    if (score >= 70) return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    if (score >= 55) return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
    return 'bg-red-500/10 text-red-500 border-red-500/20'
  }

  const getFactorBarClass = (impact: 'positive' | 'negative' | 'neutral') => {
    if (impact === 'positive') return 'bg-emerald-500'
    if (impact === 'negative') return 'bg-rose-500'
    return 'bg-amber-500'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border bg-card p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                AI Deal Health &amp; Win Predictor
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getScoreBadgeClass(health.winProbability)}`}>
                  {health.grade}
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Predictive sales analytics evaluating client close probability and commercial risks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Hero Scorecard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border bg-muted/20 p-4 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Projected Win Probability
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-extrabold text-foreground tracking-tight">
                {health.winProbability}%
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <Target className="h-3.5 w-3.5" /> High Confidence
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${health.winProbability}%` }}
              />
            </div>
          </div>

          <div className="rounded-xl border bg-muted/20 p-4 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Commercial Deal Score
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-extrabold text-primary tracking-tight">
                {health.overallHealthScore}/100
              </span>
              <span className="text-xs text-muted-foreground font-semibold">
                Status: {proposal.status.toUpperCase()}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-primary h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${health.overallHealthScore}%` }}
              />
            </div>
          </div>
        </div>

        {/* Deal Health Factors */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Scoring Dimensions &amp; Competitive Drivers
          </h3>
          <div className="space-y-2.5">
            {health.factors.map((factor, idx) => (
              <div key={idx} className="rounded-lg border bg-background/50 p-3 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    {factor.impact === 'positive' ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    ) : factor.impact === 'negative' ? (
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    )}
                    {factor.name}
                  </span>
                  <span className="font-bold text-muted-foreground">{factor.score}/100</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full ${getFactorBarClass(factor.impact)}`}
                    style={{ width: `${factor.score}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{factor.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Deal Killers & Win Recommendations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {health.dealKillers.length > 0 && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 space-y-2">
              <span className="font-bold text-rose-500 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" /> Deal Killers Detected
              </span>
              <ul className="space-y-1 text-muted-foreground list-disc pl-4 text-[11px]">
                {health.dealKillers.map((dk, i) => (
                  <li key={i}>{dk}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-2">
            <span className="font-bold text-primary flex items-center gap-1.5">
              <Lightbulb className="h-4 w-4" /> Win Strategy Actions
            </span>
            <ul className="space-y-1 text-muted-foreground list-disc pl-4 text-[11px]">
              {health.recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t">
          <Button
            size="sm"
            variant="outline"
            onClick={handleReanalyze}
            disabled={isAnalyzing}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? 'Analyzing Deal Signals...' : 'Re-Run Deal Health Analysis'}
          </Button>

          <Button size="sm" onClick={onClose} className="text-xs">
            Close Analysis
          </Button>
        </div>
      </div>
    </div>
  )
}
