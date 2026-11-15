import { useState } from 'react'
import { DollarSign, Layers, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, Input, Label, Select } from '@/components/ui/field'
import { additionalServices, createDefaultPricingStructure } from '@/defaults'
import type { FormStep3, PricingStructure } from '@/types'
import { CheckboxPill, OptionCard } from './form-controls'
import { PricingBuilder } from './pricing-builder'
import { calculatePricingTotals, formatCurrency } from '@/utils'

const complexities: Array<{ id: FormStep3['complexity']; title: string; description: string }> = [
  { id: 'simple', title: 'Simple', description: '1-2 weeks · Core MVP · Single engineer' },
  { id: 'standard', title: 'Standard', description: '3-6 weeks · Full-featured · Focused team' },
  { id: 'complex', title: 'Complex', description: '2-3 months · Multi-module system · Team of 3-4' },
  { id: 'enterprise', title: 'Enterprise', description: '3+ months · High scale · Full agency squad' },
]

export function FormStep3View({
  data,
  onChange,
}: {
  data: FormStep3
  onChange: (patch: Partial<FormStep3>) => void
}) {
  const [showItemizedBuilder, setShowItemizedBuilder] = useState(
    Boolean(data.pricingStructure && data.pricingStructure.items.length > 0)
  )

  const activePricing: PricingStructure =
    data.pricingStructure || createDefaultPricingStructure('USD', data.budgetRange)

  const toggleService = (item: string) => {
    onChange({
      additionalServices: data.additionalServices.includes(item)
        ? data.additionalServices.filter((value) => value !== item)
        : [...data.additionalServices, item],
    })
  }

  const handlePricingChange = (updated: PricingStructure) => {
    const totals = calculatePricingTotals(updated)
    const formatted = formatCurrency(totals.grandTotal, updated.currency)
    onChange({
      pricingStructure: updated,
      budgetRange: formatted,
      advancePercent: updated.depositPercent || data.advancePercent,
    })
  }

  return (
    <div className="space-y-6">
      <Field>
        <Label>Project Complexity &amp; Delivery Timeline</Label>
        <div className="grid gap-3 md:grid-cols-2">
          {complexities.map((item) => (
            <OptionCard
              key={item.id}
              title={item.title}
              description={item.description}
              active={data.complexity === item.id}
              onClick={() => onChange({ complexity: item.id })}
            />
          ))}
        </div>
      </Field>

      {/* Itemized Builder Toggle Card */}
      <div className="rounded-xl border bg-card p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-primary">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Itemized Quotation &amp; Scope Builder
              </h3>
              <p className="text-xs text-muted-foreground">
                Build a deterministic cost breakdown or select an approximate range.
              </p>
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              if (!showItemizedBuilder && !data.pricingStructure) {
                handlePricingChange(activePricing)
              }
              setShowItemizedBuilder(!showItemizedBuilder)
            }}
          >
            {showItemizedBuilder ? 'Switch to Quick Preset' : 'Build Itemized Table'}
          </Button>
        </div>

        {showItemizedBuilder ? (
          <div className="pt-2 border-t">
            <PricingBuilder pricing={activePricing} onChange={handlePricingChange} />
          </div>
        ) : (
          <Field>
            <Label>Estimated Budget Range</Label>
            <Select
              value={data.budgetRange}
              onChange={(event) => onChange({ budgetRange: event.target.value })}
            >
              {[
                '$5,000 – $10,000',
                '$10,000 – $25,000',
                '$25,000 – $50,000',
                '$50,000 – $100,000',
                '₹50,000 – ₹1,50,000',
                '₹1,50,000 – ₹5,00,000',
                '₹5,00,000 – ₹15,00,000',
                '€10,000 – €30,000',
                '£10,000 – £30,000',
                'Custom / TBD',
              ].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>
          </Field>
        )}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Field>
          <div className="flex justify-between items-center">
            <Label>Kickoff Advance Deposit (%)</Label>
            <span className="text-sm font-semibold text-primary">{data.advancePercent}%</span>
          </div>
          <input
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            type="range"
            min={20}
            max={60}
            step={5}
            value={data.advancePercent}
            onChange={(event) => onChange({ advancePercent: Number(event.target.value) })}
          />
        </Field>
        <Field>
          <Label>Included Revision Rounds</Label>
          <Input
            type="number"
            min={0}
            max={10}
            value={data.revisions}
            onChange={(event) => onChange({ revisions: Number(event.target.value) })}
          />
        </Field>
      </div>

      <Field>
        <Label>Post-Launch Warranty Period</Label>
        <Select
          value={data.warrantyPeriod}
          onChange={(event) => onChange({ warrantyPeriod: event.target.value })}
        >
          {['30 Days', '3 Months', '6 Months', '1 Year'].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </Select>
      </Field>

      <Field>
        <Label>Optional Add-on Services</Label>
        <div className="flex flex-wrap gap-2 pt-1">
          {additionalServices.map((item) => (
            <CheckboxPill
              key={item}
              label={item}
              checked={data.additionalServices.includes(item)}
              onChange={() => toggleService(item)}
            />
          ))}
        </div>
      </Field>
    </div>
  )
}
