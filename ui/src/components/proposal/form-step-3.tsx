import { Field, Input, Label, Select } from '@/components/ui/field'
import { additionalServices } from '@/defaults'
import type { FormStep3 } from '@/types'
import { CheckboxPill, OptionCard } from './form-controls'

const complexities: Array<{ id: FormStep3['complexity']; title: string; description: string }> = [
  { id: 'simple', title: 'Simple', description: '1-2 weeks · Core MVP · Single engineer' },
  { id: 'standard', title: 'Standard', description: '3-6 weeks · Full-featured · Focused team' },
  { id: 'complex', title: 'Complex', description: '2-3 months · Multi-module system · Team of 3-4' },
  { id: 'enterprise', title: 'Enterprise', description: '3+ months · High scale · Full agency squad' },
]

const milestones: Array<{ id: FormStep3['paymentMilestone']; title: string; description: string }> = [
  { id: '50-50', title: '50-50', description: '50% advance + 50% upon final delivery' },
  { id: '40-30-30', title: '40-30-30', description: '40% advance + 30% milestone review + 30% launch' },
  { id: '30-40-30', title: '30-40-30', description: '30% advance + 40% beta testing + 30% handover' },
]

export function FormStep3View({
  data,
  onChange,
}: {
  data: FormStep3
  onChange: (patch: Partial<FormStep3>) => void
}) {
  const toggle = (item: string) => {
    onChange({
      additionalServices: data.additionalServices.includes(item)
        ? data.additionalServices.filter((value) => value !== item)
        : [...data.additionalServices, item],
    })
  }

  return (
    <div className="space-y-6">
      <Field>
        <Label>Project complexity & timeline</Label>
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

      <Field>
        <Label>Estimated budget range</Label>
        <Select value={data.budgetRange} onChange={(event) => onChange({ budgetRange: event.target.value })}>
          {[
            '₹10,000 – ₹25,000',
            '₹25,000 – ₹75,000',
            '₹75,000 – ₹2,00,000',
            '₹2,00,000 – ₹5,00,000',
            '₹5,00,000+',
            'Custom / TBD',
          ].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </Select>
      </Field>

      <div className="grid gap-5 md:grid-cols-2">
        <Field>
          <div className="flex justify-between items-center">
            <Label>Advance payment percentage</Label>
            <span className="text-sm font-semibold text-primary">{data.advancePercent}%</span>
          </div>
          <input
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            type="range"
            min={20}
            max={60}
            step={5}
            value={data.advancePercent}
            onChange={(event) => onChange({ advancePercent: Number(event.target.value) })}
          />
        </Field>
        <Field>
          <Label>Included revisions</Label>
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
        <Label>Post-launch warranty period</Label>
        <Select value={data.warrantyPeriod} onChange={(event) => onChange({ warrantyPeriod: event.target.value })}>
          {['1 Month', '3 Months', '6 Months', '1 Year'].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </Select>
      </Field>

      <Field>
        <Label>Included additional services</Label>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {additionalServices.map((item) => (
            <CheckboxPill
              key={item}
              label={item}
              checked={data.additionalServices.includes(item)}
              onChange={() => toggle(item)}
            />
          ))}
        </div>
      </Field>

      <Field>
        <Label>Payment milestone structure</Label>
        <div className="grid gap-3 md:grid-cols-3">
          {milestones.map((item) => (
            <OptionCard
              key={item.id}
              title={item.title}
              description={item.description}
              active={data.paymentMilestone === item.id}
              onClick={() => onChange({ paymentMilestone: item.id })}
            />
          ))}
        </div>
      </Field>
    </div>
  )
}
