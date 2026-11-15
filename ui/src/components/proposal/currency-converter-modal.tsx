import React, { useState } from 'react'
import {
  Globe,
  X,
  ArrowRightLeft,
  DollarSign,
  CheckCircle2,
  FileCheck,
  ShieldAlert,
  Percent,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GeneratedProposal, CurrencyCode, ProposalSection } from '@/types'
import { formatCurrency, calculatePricingTotals } from '@/utils'

interface CurrencyConverterModalProps {
  isOpen: boolean
  onClose: () => void
  proposal: GeneratedProposal
  onUpdateProposal: (updated: GeneratedProposal) => void
  toast?: {
    success: (msg: string) => void
    error: (msg: string) => void
  }
}

// Deterministic FX rates relative to 1 USD
const USD_RATES: Record<CurrencyCode, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.36,
  AUD: 1.52,
  AED: 3.6725,
  SGD: 1.34,
  JPY: 154.2,
  INR: 84.3,
}

export const CurrencyConverterModal: React.FC<CurrencyConverterModalProps> = ({
  isOpen,
  onClose,
  proposal,
  onUpdateProposal,
  toast,
}) => {
  if (!isOpen) return null

  const baseCurrency: CurrencyCode = proposal.pricingStructure?.currency || 'USD'
  const totals = calculatePricingTotals(proposal.pricingStructure)
  const baseTotal = totals.grandTotal > 0 ? totals.grandTotal : 12500

  const [targetCurrency, setTargetCurrency] = useState<CurrencyCode>(
    baseCurrency === 'USD' ? 'AED' : 'USD'
  )
  const [fxBufferPercent, setFxBufferPercent] = useState<number>(2) // 2% FX safety margin

  // Convert base -> USD -> target
  const baseRateToUsd = 1 / (USD_RATES[baseCurrency] || 1.0)
  const usdValue = baseTotal * baseRateToUsd
  const targetRateFromUsd = USD_RATES[targetCurrency] || 1.0
  const rawConverted = usdValue * targetRateFromUsd
  const bufferedConverted = rawConverted * (1 + fxBufferPercent / 100)

  // Direct conversion rate: 1 baseCurrency = X targetCurrency
  const effectiveRate = (targetRateFromUsd / (USD_RATES[baseCurrency] || 1.0)) * (1 + fxBufferPercent / 100)

  const handleInjectDualCurrencyNote = () => {
    const noteText = `\n\n> 🌐 **Dual-Currency Settlement Option**:\n> At the client's discretion, invoices may be remitted in **${baseCurrency}** (${formatCurrency(baseTotal, baseCurrency)}) or in **${targetCurrency}** (~${formatCurrency(bufferedConverted, targetCurrency)} including a ${fxBufferPercent}% FX volatility buffer).\n> Locked conversion reference: **1 ${baseCurrency} = ${effectiveRate.toFixed(4)} ${targetCurrency}** valid through ${proposal.validUntil}.`

    // Find Terms & Conditions section or Pricing section
    const targetSectionIndex = proposal.sections.findIndex(
      (s) =>
        s.title.toLowerCase().includes('terms') ||
        s.title.toLowerCase().includes('payment') ||
        s.title.toLowerCase().includes('pricing') ||
        s.title.toLowerCase().includes('commercial')
    )

    let updatedSections: ProposalSection[]
    if (targetSectionIndex >= 0) {
      updatedSections = [...proposal.sections]
      const existing = updatedSections[targetSectionIndex]
      // Avoid duplicate notes
      const cleanContent = existing.content.replace(/> 🌐 \*\*Dual-Currency Settlement Option\*\*:[^]*?(?=(\n\n|$))/g, '')
      updatedSections[targetSectionIndex] = {
        ...existing,
        content: cleanContent.trimEnd() + noteText,
        isEdited: true,
      }
    } else {
      // Append new note section
      const newSec: ProposalSection = {
        id: 'currency-terms',
        title: 'International Settlement Terms',
        content: `### Cross-Border Billing & Currency Terms\n${noteText}`,
        type: 'text',
        isEdited: true,
      }
      updatedSections = [...proposal.sections, newSec]
    }

    const updated: GeneratedProposal = {
      ...proposal,
      sections: updatedSections,
      updatedAt: new Date().toISOString(),
    }

    onUpdateProposal(updated)
    toast?.success(`Dual-currency settlement note (${targetCurrency}) added to proposal!`)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-2xl border bg-card p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                Multi-Currency Live FX Converter
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-semibold">
                  Global Deals
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Convert pricing into overseas client currencies with real-time exchange rates and volatility buffers.
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

        {/* Currency Selector Grid */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Target Settlement Currency
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {(['USD', 'EUR', 'GBP', 'AED', 'SGD', 'CAD', 'AUD', 'JPY', 'INR'] as CurrencyCode[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setTargetCurrency(c)}
                disabled={c === baseCurrency}
                className={`rounded-xl border p-2.5 text-center transition ${
                  targetCurrency === c
                    ? 'border-purple-500 bg-purple-500/10 text-purple-500 font-bold shadow-xs'
                    : c === baseCurrency
                    ? 'opacity-40 cursor-not-allowed border-dashed'
                    : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <div className="text-xs font-bold">{c}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {c === baseCurrency ? 'Base Quote' : `1 ${baseCurrency} = ${((USD_RATES[c] / USD_RATES[baseCurrency])).toFixed(2)}`}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Comparison Cards */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-xl border bg-muted/30 p-4 space-y-1">
            <span className="text-[11px] font-semibold uppercase text-muted-foreground">
              Original Proposal Total ({baseCurrency})
            </span>
            <div className="text-2xl font-black text-foreground">
              {formatCurrency(baseTotal, baseCurrency)}
            </div>
            <p className="text-[11px] text-muted-foreground">Base agreement pricing</p>
          </div>

          <div className="rounded-xl border bg-purple-500/5 border-purple-500/30 p-4 space-y-1">
            <span className="text-[11px] font-semibold uppercase text-purple-600 dark:text-purple-400">
              Converted Quote ({targetCurrency})
            </span>
            <div className="text-2xl font-black text-purple-500">
              ~{formatCurrency(bufferedConverted, targetCurrency)}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Includes {fxBufferPercent}% volatility hedge
            </p>
          </div>
        </div>

        {/* FX Buffer Controls */}
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Percent className="h-4 w-4 text-amber-500" />
              FX Fluctuation Buffer &amp; Safety Margin
            </span>
            <span className="font-mono font-bold text-amber-500">+{fxBufferPercent}%</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[0, 2, 3, 5].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => setFxBufferPercent(pct)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  fxBufferPercent === pct
                    ? 'border-amber-500 bg-amber-500/10 text-amber-500 font-bold'
                    : 'border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                {pct === 0 ? '0% (Spot Rate)' : `+${pct}% Buffer`}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">
            A small buffer protects your agency against currency devaluation between proposal sending and milestone payment release.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between border-t pt-4">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            size="sm"
            onClick={handleInjectDualCurrencyNote}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <FileCheck className="h-4 w-4 mr-1.5" />
            Inject Dual-Currency Terms Note
          </Button>
        </div>
      </div>
    </div>
  )
}
