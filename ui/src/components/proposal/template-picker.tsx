import {
  Code2,
  Cpu,
  Compass,
  BarChart3,
  Palette,
  Server,
  Sparkles,
  ArrowRight,
  X,
} from 'lucide-react'
import { proposalTemplates } from '@/defaults'
import type { ProposalTemplate } from '@/types'

const iconMap: Record<string, any> = {
  Code2,
  Cpu,
  Compass,
  BarChart3,
  Palette,
  Server,
}

export function TemplatePickerModal({
  onSelectTemplate,
  onClose,
}: {
  onSelectTemplate: (template: ProposalTemplate) => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-xl border bg-card p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Industry Proposal Templates</h2>
              <p className="text-xs text-muted-foreground">
                Select a structured foundation pre-configured with scope, itemized pricing, and delivery milestones.
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

        {/* Templates Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {proposalTemplates.map((template) => {
            const Icon = iconMap[template.iconName] || Code2
            return (
              <div
                key={template.id}
                className="group flex flex-col justify-between rounded-xl border bg-card p-4 shadow-xs hover:border-primary/50 hover:shadow-md transition text-left"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted group-hover:bg-primary/10 group-hover:text-primary transition">
                      <Icon className="h-4.5 w-4.5 text-foreground group-hover:text-primary" />
                    </div>
                    <span className="rounded-full bg-muted/60 px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {template.category}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition">
                      {template.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {template.description}
                    </p>
                  </div>

                  <div className="space-y-1 text-[11px] text-muted-foreground border-t pt-2.5">
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span className="font-medium text-foreground">{template.projectType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Industry:</span>
                      <span className="font-medium text-foreground">{template.industry}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Modules:</span>
                      <span className="font-medium text-foreground">{template.samplePricing.length} itemized</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onSelectTemplate(template)
                    onClose()
                  }}
                  className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-muted/60 py-2 text-xs font-semibold text-foreground hover:bg-primary hover:text-white transition cursor-pointer"
                >
                  <span>Use This Template</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
