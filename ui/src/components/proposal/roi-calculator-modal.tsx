import React, { useState } from 'react'
import {
  TrendingUp,
  X,
  DollarSign,
  Clock,
  Zap,
  CheckCircle2,
  FileCheck,
  ChevronRight,
  ShieldCheck,
  Calculator,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GeneratedProposal, ProposalSection } from '@/types'
import { formatCurrency, calculatePricingTotals } from '@/utils'

interface RoiCalculatorModalProps {
  isOpen: boolean
  onClose: () => void
  proposal: GeneratedProposal
  onUpdateProposal: (updated: GeneratedProposal) => void
  toast?: {
    success: (msg: string) => void
    error: (msg: string) => void
  }
}

export const RoiCalculatorModal: React.FC<RoiCalculatorModalProps> = ({
  isOpen,
  onClose,
  proposal,
  onUpdateProposal,
  toast,
}) => {
  if (!isOpen) return null

  const totals = calculatePricingTotals(proposal.pricingStructure)
  const defaultInvestment = totals.grandTotal > 0 ? totals.grandTotal : 12500
  const currency = proposal.pricingStructure?.currency || 'USD'

  const [investment, setInvestment] = useState<number>(defaultInvestment)
  const [hoursSavedPerMonth, setHoursSavedPerMonth] = useState<number>(35)
  const [hourlyLaborRate, setHourlyLaborRate] = useState<number>(65)
  const [monthlyRevenueUplift, setMonthlyRevenueUplift] = useState<number>(2500)
  const [timeHorizonMonths, setTimeHorizonMonths] = useState<number>(12)

  // Calculations
  const monthlyLaborSavings = hoursSavedPerMonth * hourlyLaborRate
  const annualLaborSavings = monthlyLaborSavings * 12
  const annualRevenueGain = monthlyRevenueUplift * 12
  const totalAnnualFinancialImpact = annualLaborSavings + annualRevenueGain
  const horizonMultiplier = timeHorizonMonths / 12
  const totalHorizonImpact = totalAnnualFinancialImpact * horizonMultiplier
  const netSurplus = totalHorizonImpact - investment
  const roiPercent = investment > 0 ? Math.round((netSurplus / investment) * 100) : 0
  const monthlyPayoff = (monthlyLaborSavings + monthlyRevenueUplift)
  const paybackMonths = monthlyPayoff > 0 ? Number((investment / monthlyPayoff).toFixed(1)) : 0

  const handleInjectSection = () => {
    const sectionTitle = 'Financial Impact & ROI Analysis'
    const sectionContent = `### Executive ROI & Business Value Justification

Implementing this proposed initiative is structured to deliver clear, measurable economic surplus that offsets initial implementation costs rapidly.

| Metric | Estimated Value | Horizon |
| :--- | :--- | :--- |
| **Initial Implementation Investment** | **${formatCurrency(investment, currency)}** | One-time |
| **Team Efficiency / Labor Saved** | **${hoursSavedPerMonth} hours/month** (~${formatCurrency(annualLaborSavings, currency)}/yr) | Recurring |
| **Projected Revenue Uplift / Lead Value** | **${formatCurrency(monthlyRevenueUplift, currency)}/month** (~${formatCurrency(annualRevenueGain, currency)}/yr) | Recurring |
| **Total Projected Economic Benefit** | **${formatCurrency(totalHorizonImpact, currency)}** | ${timeHorizonMonths} Months |
| **Net Client Surplus (After Investment)** | **+${formatCurrency(netSurplus, currency)}** | ${timeHorizonMonths} Months |
| **Projected Net ROI** | **+${roiPercent}%** | ${timeHorizonMonths} Months |
| **Capital Payback Horizon** | **~${paybackMonths} Months** | Break-even |

> **Strategic Takeaway**: With an estimated break-even period of **${paybackMonths} months**, the project generates positive net cash flow quickly, producing an estimated **+${formatCurrency(netSurplus, currency)}** in net economic surplus over the ${timeHorizonMonths}-month lifecycle.`

    const existingIndex = proposal.sections.findIndex(
      (s) => s.id === 'roi-analysis' || s.title.toLowerCase().includes('roi') || s.title.toLowerCase().includes('financial impact')
    )

    let updatedSections: ProposalSection[]
    if (existingIndex >= 0) {
      updatedSections = [...proposal.sections]
      updatedSections[existingIndex] = {
        ...updatedSections[existingIndex],
        content: sectionContent,
        isEdited: true,
      }
    } else {
      const newSection: ProposalSection = {
        id: 'roi-analysis',
        title: sectionTitle,
        content: sectionContent,
        type: 'table',
        isEdited: true,
      }
      updatedSections = [...proposal.sections, newSection]
    }

    const updatedProposal: GeneratedProposal = {
      ...proposal,
      sections: updatedSections,
      roiEstimation: {
        hoursSavedPerMonth,
        hourlyRateValue: hourlyLaborRate,
        monthlyCostSavings: monthlyLaborSavings,
        annualCostSavings: annualLaborSavings,
        projectedRevenueBoostPercent: Math.min(Math.round((monthlyRevenueUplift / (investment / 12)) * 10), 50),
        paybackMonths,
        threeYearNetRoi: totalAnnualFinancialImpact * 3 - investment,
      },
      updatedAt: new Date().toISOString(),
    }

    onUpdateProposal(updatedProposal)
    toast?.success('ROI & Financial Impact section inserted into proposal!')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl rounded-2xl border bg-card p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                Client ROI &amp; Financial Impact Calculator
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold">
                  Deal Closer
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Demonstrate tangible financial surplus to accelerate client sign-off and justify pricing.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Highlight Scorecard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl border bg-emerald-500/5 border-emerald-500/20 text-center">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Projected Net ROI
            </span>
            <div className="text-2xl font-black text-emerald-500 mt-1">
              +{roiPercent}%
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">{timeHorizonMonths}-Mo Horizon</p>
          </div>

          <div className="p-3.5 rounded-xl border bg-blue-500/5 border-blue-500/20 text-center">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Payback Horizon
            </span>
            <div className="text-2xl font-black text-blue-500 mt-1">
              {paybackMonths} <span className="text-sm font-semibold">mo</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Rapid Break-even</p>
          </div>

          <div className="p-3.5 rounded-xl border bg-purple-500/5 border-purple-500/20 text-center">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Total Economic Impact
            </span>
            <div className="text-2xl font-black text-purple-500 mt-1">
              {formatCurrency(totalHorizonImpact, currency)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Efficiency + Growth</p>
          </div>

          <div className="p-3.5 rounded-xl border bg-amber-500/5 border-amber-500/20 text-center">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Net Client Surplus
            </span>
            <div className="text-2xl font-black text-amber-500 mt-1">
              +{formatCurrency(netSurplus, currency)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Above Investment</p>
          </div>
        </div>

        {/* Visual Comparison Progress Bar */}
        <div className="rounded-xl border bg-muted/40 p-4 space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-muted-foreground">Investment: {formatCurrency(investment, currency)}</span>
            <span className="text-emerald-500">Gross Return: {formatCurrency(totalHorizonImpact, currency)}</span>
          </div>
          <div className="relative h-3 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(Math.max((investment / Math.max(totalHorizonImpact, 1)) * 100, 15), 100)}%`,
              }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>⚡ Break-even in {paybackMonths} months</span>
            <span className="font-medium text-foreground">Net Gain: +{formatCurrency(netSurplus, currency)}</span>
          </div>
        </div>

        {/* Interactive Sliders & Inputs */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-4 rounded-xl border p-4 bg-card">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              Investment &amp; Time Horizon
            </h3>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-medium">Total Project Investment</span>
                <span className="font-bold text-foreground">{formatCurrency(investment, currency)}</span>
              </div>
              <input
                type="number"
                value={investment}
                onChange={(e) => setInvestment(Number(e.target.value) || 0)}
                className="w-full rounded-lg border bg-background px-3 py-1.5 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-medium">Analysis Horizon</span>
                <span className="font-bold text-foreground">{timeHorizonMonths} Months</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[12, 24, 36].map((months) => (
                  <button
                    key={months}
                    type="button"
                    onClick={() => setTimeHorizonMonths(months)}
                    className={`rounded-lg border px-3 py-1 text-xs font-medium transition ${
                      timeHorizonMonths === months
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 font-bold'
                        : 'border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {months} Mo
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-xl border p-4 bg-card">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-blue-500" />
              Client Economic Gains
            </h3>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-medium">Hours Saved / Month</span>
                <span className="font-bold text-foreground">{hoursSavedPerMonth} hrs</span>
              </div>
              <input
                type="range"
                min={5}
                max={150}
                step={5}
                value={hoursSavedPerMonth}
                onChange={(e) => setHoursSavedPerMonth(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-medium">Hourly Labor Cost / Value</span>
                <span className="font-bold text-foreground">{formatCurrency(hourlyLaborRate, currency)}/hr</span>
              </div>
              <input
                type="range"
                min={20}
                max={250}
                step={5}
                value={hourlyLaborRate}
                onChange={(e) => setHourlyLaborRate(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-medium">Estimated Monthly Revenue Uplift</span>
                <span className="font-bold text-foreground">{formatCurrency(monthlyRevenueUplift, currency)}/mo</span>
              </div>
              <input
                type="number"
                value={monthlyRevenueUplift}
                onChange={(e) => setMonthlyRevenueUplift(Number(e.target.value) || 0)}
                className="w-full rounded-lg border bg-background px-3 py-1.5 text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between border-t pt-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Empowers high-ticket closing by showing ROI exceeds fees.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleInjectSection}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <FileCheck className="h-4 w-4 mr-1.5" />
              Inject ROI Analysis into Proposal
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
