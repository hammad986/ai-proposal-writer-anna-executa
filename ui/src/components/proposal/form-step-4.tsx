import { ClipboardList, Handshake, Rocket, TerminalSquare } from 'lucide-react'
import { Field, Label, Select, Textarea } from '@/components/ui/field'
import { includedSections } from '@/defaults'
import type { FormStep4 } from '@/types'
import { CheckboxPill } from './form-controls'
import { cn } from '@/utils'

const tones: Array<{ id: FormStep4['tone']; title: string; description: string }> = [
  { id: 'professional', title: 'Professional & Formal', description: 'Corporate, polished, executive language' },
  { id: 'friendly', title: 'Friendly & Conversational', description: 'Approachable, warm, collaborative tone' },
  { id: 'bold', title: 'Bold & Persuasive', description: 'High-confidence, outcome and ROI-driven pitch' },
  { id: 'technical', title: 'Technical & Detailed', description: 'Implementation-focused, architectural rigor' },
]

const icons = {
  professional: ClipboardList,
  friendly: Handshake,
  bold: Rocket,
  technical: TerminalSquare,
}

export function FormStep4View({
  data,
  onChange,
}: {
  data: FormStep4
  onChange: (patch: Partial<FormStep4>) => void
}) {
  const toggleSection = (item: string) => {
    onChange({
      includedSections: data.includedSections.includes(item)
        ? data.includedSections.filter((value) => value !== item)
        : [...data.includedSections, item],
    })
  }

  return (
    <div className="space-y-6">
      <Field>
        <Label>Proposal tone</Label>
        <div className="grid gap-3 md:grid-cols-2">
          {tones.map((item) => {
            const Icon = icons[item.id]
            const active = data.tone === item.id
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => onChange({ tone: item.id })}
                className={cn(
                  'rounded-lg border p-4 text-left transition cursor-pointer hover:border-primary',
                  active ? 'border-primary bg-indigo-50 shadow-sm dark:bg-indigo-950' : 'bg-card'
                )}
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <Icon className={cn('h-5 w-5', active ? 'text-primary' : 'text-muted-foreground')} />
                  <span className={cn(active && 'text-primary')}>{item.title}</span>
                </span>
                <span className="mt-2 block text-xs leading-5 text-muted-foreground">{item.description}</span>
              </button>
            )
          })}
        </div>
      </Field>

      <Field>
        <Label>Language</Label>
        <Select
          value={data.language}
          onChange={(event) => onChange({ language: event.target.value as FormStep4['language'] })}
        >
          {['English', 'Hindi', 'Hinglish'].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </Select>
      </Field>

      <Field>
        <Label>Included proposal sections</Label>
        <div className="grid gap-3 sm:grid-cols-2">
          {includedSections.map((item) => (
            <CheckboxPill
              key={item}
              label={item}
              checked={data.includedSections.includes(item)}
              onChange={() => toggleSection(item)}
            />
          ))}
        </div>
      </Field>

      <Field>
        <Label>Special emphasis</Label>
        <Textarea
          value={data.specialEmphasis}
          onChange={(event) => onChange({ specialEmphasis: event.target.value })}
          placeholder="Mention anything the proposal should emphasize, such as fast time-to-market, automated data migrations, strict security compliance, or dedicated support."
        />
      </Field>
    </div>
  )
}
