import { useState } from 'react'
import {
  Plus,
  Trash2,
  DollarSign,
  Percent,
  CheckCircle2,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { calculatePricingTotals, formatCurrency } from '@/utils'
import type { CurrencyCode, PricingItem, PricingStructure } from '@/types'

const CURRENCIES: Array<{ code: CurrencyCode; label: string; symbol: string }> = [
  { code: 'USD', label: 'USD ($)', symbol: '$' },
  { code: 'EUR', label: 'EUR (€)', symbol: '€' },
  { code: 'GBP', label: 'GBP (£)', symbol: '£' },
  { code: 'INR', label: 'INR (₹)', symbol: '₹' },
  { code: 'CAD', label: 'CAD ($)', symbol: '$' },
  { code: 'AUD', label: 'AUD ($)', symbol: '$' },
]

const CATEGORIES: Array<{ key: PricingItem['category']; label: string }> = [
  { key: 'development', label: 'Engineering' },
  { key: 'design', label: 'UI/UX Design' },
  { key: 'management', label: 'Project Mgmt' },
  { key: 'infrastructure', label: 'Cloud & DevOps' },
  { key: 'consulting', label: 'Consulting' },
  { key: 'other', label: 'Other Services' },
]

export function PricingBuilder({
  pricing,
  onChange,
}: {
  pricing: PricingStructure
  onChange: (updated: PricingStructure) => void
}) {
  const totals = calculatePricingTotals(pricing)

  const handleUpdateField = <K extends keyof PricingStructure>(
    field: K,
    val: PricingStructure[K]
  ) => {
    onChange({
      ...pricing,
      [field]: val,
    })
  }

  const handleAddItem = () => {
    const newItem: PricingItem = {
      id: `item_${Date.now()}`,
      title: 'New Deliverable Module',
      description: 'Scope and deliverable breakdown description',
      category: 'development',
      quantity: 1,
      unitRate: 1500,
      isSelected: true,
      isOptional: false,
    }
    onChange({
      ...pricing,
      items: [...pricing.items, newItem],
    })
  }

  const handleUpdateItem = (id: string, patch: Partial<PricingItem>) => {
    const updated = pricing.items.map((it) => (it.id === id ? { ...it, ...patch } : it))
    onChange({
      ...pricing,
      items: updated,
    })
  }

  const handleDeleteItem = (id: string) => {
    const updated = pricing.items.filter((it) => it.id !== id)
    onChange({
      ...pricing,
      items: updated,
    })
  }

  return (
    <div className="space-y-6">
      {/* Top Controls: Currency & Model */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Pricing Currency
            </label>
            <select
              value={pricing.currency}
              onChange={(e) => handleUpdateField('currency', e.target.value as CurrencyCode)}
              className="rounded-md border bg-background px-3 py-1.5 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Pricing Model
            </label>
            <select
              value={pricing.pricingModel}
              onChange={(e) =>
                handleUpdateField(
                  'pricingModel',
                  e.target.value as PricingStructure['pricingModel']
                )
              }
              className="rounded-md border bg-background px-3 py-1.5 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="fixed">Fixed-Price Project</option>
              <option value="milestone">Milestone-Based Billing</option>
              <option value="hourly">Hourly Rate / Time & Materials</option>
              <option value="retainer">Monthly Retainer</option>
            </select>
          </div>
        </div>

        <Button size="sm" onClick={handleAddItem} variant="outline">
          <Plus className="h-4 w-4 mr-1.5" />
          Add Line Item
        </Button>
      </div>

      {/* Itemized Table */}
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[700px] text-sm text-left">
          <thead className="border-b bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Deliverable Module / Item</th>
              <th className="px-3 py-3 font-semibold">Category</th>
              <th className="px-3 py-3 font-semibold w-20">Qty / Hrs</th>
              <th className="px-3 py-3 font-semibold w-28">Rate ({pricing.currency})</th>
              <th className="px-3 py-3 font-semibold w-28">Total</th>
              <th className="px-3 py-3 font-semibold text-center w-24">Optional Add-on</th>
              <th className="px-3 py-3 font-semibold text-right w-14"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pricing.items.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                  No line items yet. Click &quot;Add Line Item&quot; to build an itemized quotation.
                </td>
              </tr>
            ) : (
              pricing.items.map((item) => {
                const itemTotal = (item.quantity || 1) * (item.unitRate || 0)
                return (
                  <tr key={item.id} className="hover:bg-muted/30 transition">
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => handleUpdateItem(item.id, { title: e.target.value })}
                        placeholder="Item title..."
                        className="w-full rounded border-0 bg-transparent font-medium text-foreground focus:ring-1 focus:ring-primary px-1.5 py-1 text-sm"
                      />
                      <input
                        type="text"
                        value={item.description || ''}
                        onChange={(e) =>
                          handleUpdateItem(item.id, { description: e.target.value })
                        }
                        placeholder="Detailed deliverables description..."
                        className="w-full rounded border-0 bg-transparent text-xs text-muted-foreground focus:ring-1 focus:ring-primary px-1.5 py-0.5 mt-0.5"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={item.category}
                        onChange={(e) =>
                          handleUpdateItem(item.id, {
                            category: e.target.value as PricingItem['category'],
                          })
                        }
                        className="rounded border bg-background px-2 py-1 text-xs text-muted-foreground"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat.key} value={cat.key}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleUpdateItem(item.id, {
                            quantity: Math.max(1, parseInt(e.target.value) || 1),
                          })
                        }
                        className="w-16 rounded border bg-background px-2 py-1 text-xs text-foreground text-center"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={item.unitRate}
                        onChange={(e) =>
                          handleUpdateItem(item.id, {
                            unitRate: Math.max(0, parseFloat(e.target.value) || 0),
                          })
                        }
                        className="w-24 rounded border bg-background px-2 py-1 text-xs text-foreground"
                      />
                    </td>
                    <td className="px-3 py-3 font-semibold text-foreground">
                      {formatCurrency(itemTotal, pricing.currency)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={Boolean(item.isOptional)}
                          onChange={(e) =>
                            handleUpdateItem(item.id, { isOptional: e.target.checked })
                          }
                          className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                        />
                      </label>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-muted-foreground hover:text-red-500 transition p-1 cursor-pointer"
                        title="Delete item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Financial Summary & Adjustments */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Payment Terms & Schedules */}
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            Payment Terms & Deposit
          </h4>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Kickoff Deposit Due upon Signing (% of Grand Total)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                value={pricing.depositPercent}
                onChange={(e) =>
                  handleUpdateField(
                    'depositPercent',
                    Math.max(0, Math.min(100, parseInt(e.target.value) || 0))
                  )
                }
                className="w-24 rounded border bg-background px-3 py-1.5 text-sm font-medium text-foreground"
              />
              <span className="text-xs text-muted-foreground">
                = {formatCurrency(totals.depositAmount, pricing.currency)} kickoff deposit
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Payment Terms Narrative
            </label>
            <textarea
              rows={2}
              value={pricing.paymentTerms}
              onChange={(e) => handleUpdateField('paymentTerms', e.target.value)}
              placeholder="e.g. 40% advance upon contract signing, 30% upon Milestone 2 approval, 30% upon handover."
              className="w-full rounded-md border bg-background p-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Totals Breakdown Card */}
        <div className="rounded-xl border bg-muted/20 p-5 space-y-3">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            Deterministic Financial Summary
          </h4>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">Core Subtotal</span>
              <span className="font-medium text-foreground">
                {formatCurrency(totals.subtotal, pricing.currency)}
              </span>
            </div>

            {totals.optionalTotal > 0 && (
              <div className="flex justify-between py-1 border-b text-muted-foreground">
                <span>Optional Add-ons Available</span>
                <span>+{formatCurrency(totals.optionalTotal, pricing.currency)}</span>
              </div>
            )}

            {/* Discount Row */}
            <div className="flex items-center justify-between py-1 border-b">
              <span className="text-muted-foreground flex items-center gap-1.5">
                Discount
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={pricing.discountPercent}
                  onChange={(e) =>
                    handleUpdateField(
                      'discountPercent',
                      Math.max(0, Math.min(100, parseFloat(e.target.value) || 0))
                    )
                  }
                  className="w-14 rounded border bg-background px-1.5 py-0.5 text-xs text-center text-foreground"
                />
                %
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                -{formatCurrency(totals.discountAmount, pricing.currency)}
              </span>
            </div>

            {/* Tax Row */}
            <div className="flex items-center justify-between py-1 border-b">
              <span className="text-muted-foreground flex items-center gap-1.5">
                Tax / VAT / GST
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={pricing.taxPercent}
                  onChange={(e) =>
                    handleUpdateField(
                      'taxPercent',
                      Math.max(0, Math.min(100, parseFloat(e.target.value) || 0))
                    )
                  }
                  className="w-14 rounded border bg-background px-1.5 py-0.5 text-xs text-center text-foreground"
                />
                %
              </span>
              <span className="font-medium text-foreground">
                +{formatCurrency(totals.taxAmount, pricing.currency)}
              </span>
            </div>

            <div className="flex justify-between pt-2 text-sm font-bold text-foreground">
              <span>Grand Total</span>
              <span className="text-primary text-base">
                {formatCurrency(totals.grandTotal, pricing.currency)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
