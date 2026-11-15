import { Field, Input, Label, Textarea } from '@/components/ui/field'
import { technicalRequirements } from '@/defaults'
import type { FormStep2 } from '@/types'
import { CheckboxPill } from './form-controls'

export function FormStep2View({
  data,
  errors,
  onChange,
}: {
  data: FormStep2
  errors: Record<string, string>
  onChange: (patch: Partial<FormStep2>) => void
}) {
  const toggle = (item: string) => {
    onChange({
      technicalRequirements: data.technicalRequirements.includes(item)
        ? data.technicalRequirements.filter((value) => value !== item)
        : [...data.technicalRequirements, item],
    })
  }

  return (
    <div className="space-y-5">
      <Field>
        <Label>Key features & deliverables *</Label>
        <Textarea
          value={data.keyFeatures}
          onChange={(event) => onChange({ keyFeatures: event.target.value })}
          placeholder={
            'List each feature on a new line:\nUser authentication and role management\nProduct catalog with high-speed elastic search\nShopping cart and Stripe checkout\nAdmin dashboard with live sales metrics'
          }
        />
        {errors.keyFeatures && <p className="text-xs text-red-600">{errors.keyFeatures}</p>}
      </Field>

      <Field>
        <Label>Technical requirements</Label>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {technicalRequirements.map((item) => (
            <CheckboxPill
              key={item}
              label={item}
              checked={data.technicalRequirements.includes(item)}
              onChange={() => toggle(item)}
            />
          ))}
        </div>
      </Field>

      <Field>
        <Label>Preferred tech stack</Label>
        <Input
          value={data.preferredTechStack}
          onChange={(event) => onChange({ preferredTechStack: event.target.value })}
          placeholder="e.g. Next.js, TypeScript, PostgreSQL, Tailwind, AWS"
        />
      </Field>

      <Field>
        <Label>Target users *</Label>
        <Input
          value={data.targetUsers}
          onChange={(event) => onChange({ targetUsers: event.target.value })}
          placeholder="e.g. B2B wholesale buyers and internal sales managers"
        />
        {errors.targetUsers && <p className="text-xs text-red-600">{errors.targetUsers}</p>}
      </Field>

      <Field>
        <Label>Constraints & Integrations</Label>
        <Textarea
          value={data.constraints}
          onChange={(event) => onChange({ constraints: event.target.value })}
          placeholder="Any legacy ERP integrations, compliance requirements, or deadline constraints..."
        />
      </Field>
    </div>
  )
}
