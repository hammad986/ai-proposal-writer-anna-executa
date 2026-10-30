import { useState } from 'react'
import { Building2, Palette, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { BrandConfig, CurrencyCode } from '@/types'

const CURRENCIES: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD']

const PRESET_COLORS = [
  { name: 'Indigo', hex: '#4f46e5' },
  { name: 'Blue', hex: '#2563eb' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Violet', hex: '#7c3aed' },
  { name: 'Slate', hex: '#334155' },
  { name: 'Amber', hex: '#d97706' },
]

export function BrandSettingsModal({
  brand,
  onSave,
  onClose,
}: {
  brand: BrandConfig
  onSave: (updated: BrandConfig) => void
  onClose: () => void
}) {
  const [formData, setFormData] = useState<BrandConfig>({ ...brand })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-lg rounded-xl border bg-card p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-primary">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Agency Brand Kit &amp; Defaults</h2>
              <p className="text-xs text-muted-foreground">
                Set company identity and styling used across generated proposals and PDF exports.
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block font-semibold text-muted-foreground uppercase text-[10px] mb-1">
                Company / Agency Name
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                required
                className="w-full rounded-md border bg-background px-3 py-1.5 text-xs text-foreground"
              />
            </div>
            <div>
              <label className="block font-semibold text-muted-foreground uppercase text-[10px] mb-1">
                Tagline / Specialty
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full rounded-md border bg-background px-3 py-1.5 text-xs text-foreground"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block font-semibold text-muted-foreground uppercase text-[10px] mb-1">
                Contact Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-md border bg-background px-3 py-1.5 text-xs text-foreground"
              />
            </div>
            <div>
              <label className="block font-semibold text-muted-foreground uppercase text-[10px] mb-1">
                Website URL
              </label>
              <input
                type="text"
                value={formData.website || ''}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full rounded-md border bg-background px-3 py-1.5 text-xs text-foreground"
              />
            </div>
          </div>

          {/* Theme Color */}
          <div>
            <label className="block font-semibold text-muted-foreground uppercase text-[10px] mb-1.5">
              Brand Accent Color (PDF &amp; Badges)
            </label>
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setFormData({ ...formData, primaryColor: c.hex })}
                  style={{ backgroundColor: c.hex }}
                  className={`h-7 w-7 rounded-full flex items-center justify-center text-white transition cursor-pointer ${
                    formData.primaryColor === c.hex ? 'ring-2 ring-primary ring-offset-2' : ''
                  }`}
                  title={c.name}
                >
                  {formData.primaryColor === c.hex && <Check className="h-3.5 w-3.5" />}
                </button>
              ))}
              <input
                type="text"
                value={formData.primaryColor}
                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                className="w-24 rounded-md border bg-background px-2 py-1 text-xs font-mono text-center"
              />
            </div>
          </div>

          {/* Default Currency */}
          <div>
            <label className="block font-semibold text-muted-foreground uppercase text-[10px] mb-1">
              Default Currency
            </label>
            <select
              value={formData.defaultCurrency}
              onChange={(e) =>
                setFormData({ ...formData, defaultCurrency: e.target.value as CurrencyCode })
              }
              className="w-full rounded-md border bg-background px-3 py-1.5 text-xs text-foreground"
            >
              {CURRENCIES.map((cur) => (
                <option key={cur} value={cur}>
                  {cur}
                </option>
              ))}
            </select>
          </div>

          {/* Default Payment Terms */}
          <div>
            <label className="block font-semibold text-muted-foreground uppercase text-[10px] mb-1">
              Standard Payment Terms
            </label>
            <textarea
              rows={2}
              value={formData.defaultPaymentTerms}
              onChange={(e) => setFormData({ ...formData, defaultPaymentTerms: e.target.value })}
              className="w-full rounded-md border bg-background p-2 text-xs text-foreground"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Brand Settings</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
