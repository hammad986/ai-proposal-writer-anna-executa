import { Field, Input, Label, Select, Textarea } from '@/components/ui/field'
import type { FormStep1 } from '@/types'

export function FormStep1View({
  data,
  errors,
  onChange,
}: {
  data: FormStep1
  errors: Record<string, string>
  onChange: (patch: Partial<FormStep1>) => void
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <Field>
          <Label>Agency name *</Label>
          <Input
            value={data.agencyName}
            onChange={(event) => onChange({ agencyName: event.target.value })}
            placeholder="e.g. Aetherion Labs"
          />
          {errors.agencyName && <p className="text-xs text-red-600">{errors.agencyName}</p>}
        </Field>
        <Field>
          <Label>Agency tagline</Label>
          <Input
            value={data.agencyTagline}
            onChange={(event) => onChange({ agencyTagline: event.target.value })}
            placeholder="e.g. AI & Web Development Agency"
          />
        </Field>
        <Field>
          <Label>Agency email</Label>
          <Input
            type="email"
            value={data.agencyEmail}
            onChange={(event) => onChange({ agencyEmail: event.target.value })}
            placeholder="e.g. hello@agency.com"
          />
        </Field>
        <Field>
          <Label>Agency website</Label>
          <Input
            value={data.agencyWebsite}
            onChange={(event) => onChange({ agencyWebsite: event.target.value })}
            placeholder="e.g. https://agency.com"
          />
        </Field>
      </div>

      <div className="border-t pt-5">
        <h2 className="text-sm font-semibold">Client Information</h2>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Field>
          <Label>Client contact name *</Label>
          <Input
            value={data.clientName}
            onChange={(event) => onChange({ clientName: event.target.value })}
            placeholder="e.g. Alex Mercer"
          />
          {errors.clientName && <p className="text-xs text-red-600">{errors.clientName}</p>}
        </Field>
        <Field>
          <Label>Client company name</Label>
          <Input
            value={data.clientCompany}
            onChange={(event) => onChange({ clientCompany: event.target.value })}
            placeholder="e.g. StyleHub Pvt Ltd"
          />
        </Field>
        <Field>
          <Label>Project name *</Label>
          <Input
            value={data.projectName}
            onChange={(event) => onChange({ projectName: event.target.value })}
            placeholder="e.g. E-commerce Platform Modernization"
          />
          {errors.projectName && <p className="text-xs text-red-600">{errors.projectName}</p>}
        </Field>
        <Field>
          <Label>Project type</Label>
          <Select
            value={data.projectType}
            onChange={(event) => onChange({ projectType: event.target.value as FormStep1['projectType'] })}
          >
            {[
              'Web Development',
              'AI/ML System',
              'Mobile App',
              'Automation',
              'Full-Stack App',
              'Custom Software',
              'IT Consulting & Advisory',
              'Digital Marketing & Growth',
              'UI/UX Product Design',
              'Cloud Architecture & DevOps',
              'API & Integration',
            ].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </Select>
        </Field>
      </div>

      <Field>
        <Label>Industry</Label>
        <Select
          value={data.industry}
          onChange={(event) => onChange({ industry: event.target.value as FormStep1['industry'] })}
        >
          {[
            'Technology',
            'E-commerce',
            'Healthcare',
            'Education',
            'Fintech',
            'SaaS',
            'Real Estate',
            'Finance & Banking',
            'Media & Entertainment',
            'Manufacturing & Logistics',
            'Professional Services',
            'Other',
          ].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </Select>
      </Field>

      <Field>
        <Label>Problem statement *</Label>
        <Textarea
          value={data.problemStatement}
          onChange={(event) => onChange({ problemStatement: event.target.value })}
          placeholder="Describe the client's current pain points, business problem, and what this project will solve (min 50 chars)..."
        />
        {errors.problemStatement && <p className="text-xs text-red-600">{errors.problemStatement}</p>}
      </Field>
    </div>
  )
}
