import { useState } from 'react'
import {
  Settings,
  Building,
  Mail,
  Globe,
  DollarSign,
  Palette,
  Check,
  Save,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { BrandConfig, CurrencyCode } from '@/types'

interface SettingsViewProps {
  brandConfig: BrandConfig
  onUpdateBrandConfig: (updated: BrandConfig) => void
  toast: {
    success: (msg: string) => void
    error: (msg: string) => void
  }
}

const CURRENCIES: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'AED', 'SGD', 'JPY']

export function SettingsView({
  brandConfig,
  onUpdateBrandConfig,
  toast,
}: SettingsViewProps) {
  const [formData, setFormData] = useState<BrandConfig>(brandConfig)

  const handleSave = () => {
    onUpdateBrandConfig(formData)
    toast.success('Brand & Workspace settings saved!')
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="border-b pb-6 space-y-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary flex items-center gap-1.5">
            <Settings className="h-3.5 w-3.5" />
            Workspace Settings 3.0
          </span>
        </div>
        <h2 className="text-2xl font-black tracking-tight text-foreground">
          Brand Identity & Defaults
        </h2>
        <p className="text-sm text-muted-foreground">
          Configure your agency identity, contact details, currency, and default commercial terms applied to all proposals and document exports.
        </p>
      </div>

      <Card className="border shadow-md">
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Company / Agency Name
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Tagline / Value Proposition
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Contact Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Agency Website
              </label>
              <input
                type="text"
                value={formData.website || ''}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Default Currency
              </label>
              <select
                value={formData.defaultCurrency}
                onChange={(e) => setFormData({ ...formData, defaultCurrency: e.target.value as CurrencyCode })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Brand Accent Color Hex
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.primaryColor || '#4f46e5'}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="h-8 w-10 rounded border bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.primaryColor || '#4f46e5'}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="flex-1 rounded-lg border bg-background px-3 py-2 text-xs text-foreground font-mono"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Standard Commercial Payment Terms
            </label>
            <textarea
              rows={3}
              value={formData.defaultPaymentTerms}
              onChange={(e) => setFormData({ ...formData, defaultPaymentTerms: e.target.value })}
              className="w-full rounded-lg border bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex justify-end pt-2 border-t">
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs gap-1.5">
              <Save className="h-4 w-4" /> Save Workspace Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
