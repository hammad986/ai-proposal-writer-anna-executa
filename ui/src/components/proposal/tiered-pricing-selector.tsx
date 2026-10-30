import { useState } from 'react'
import { Check, Sparkles, CheckCircle2 } from 'lucide-react'
import { formatCurrency } from '@/utils'
import type { PricingTier, CurrencyCode } from '@/types'

interface TieredPricingSelectorProps {
  tiers: PricingTier[]
  selectedTierId?: string
  currency: CurrencyCode
  isEditable?: boolean
  onSelectTier: (tierId: string) => void
}

export function TieredPricingSelector({
  tiers,
  selectedTierId,
  currency,
  onSelectTier,
}: TieredPricingSelectorProps) {
  const activeId = selectedTierId || tiers.find((t) => t.isPopular)?.id || tiers[0]?.id

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiers.map((tier) => {
          const isSelected = tier.id === activeId
          return (
            <div
              key={tier.id}
              onClick={() => onSelectTier(tier.id)}
              className={`relative rounded-2xl border p-5 flex flex-col justify-between transition-all cursor-pointer ${
                isSelected
                  ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-md'
                  : 'border-border bg-card/60 hover:border-primary/50 hover:bg-muted/30'
              }`}
            >
              {tier.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Most Popular
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-base font-bold text-foreground">{tier.name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                      {tier.description}
                    </p>
                  </div>
                  <div
                    className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted-foreground/40'
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                  </div>
                </div>

                <div className="pt-2">
                  <div className="text-2xl font-black text-foreground">
                    {formatCurrency(tier.price, currency)}
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {tier.billingPeriod === 'monthly' ? 'per month' : 'total project investment'}
                  </span>
                </div>

                <div className="border-t pt-3 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Deliverables Included:
                  </span>
                  <ul className="space-y-1.5 text-xs">
                    {tier.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2 text-foreground/85">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-[11px] leading-tight">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-4 mt-auto">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectTier(tier.id)
                  }}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                  }`}
                >
                  {isSelected ? 'Selected Package' : 'Select Package'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
