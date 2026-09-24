import { Check } from 'lucide-react'
import { cn } from '@/utils'

export function CheckboxPill({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={cn(
        'flex min-h-11 items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition cursor-pointer hover:border-primary',
        checked
          ? 'border-primary bg-indigo-50 text-indigo-700 font-medium dark:bg-indigo-950 dark:text-indigo-200'
          : 'bg-card text-foreground'
      )}
    >
      <span>{label}</span>
      {checked && <Check className="h-4 w-4 shrink-0 text-primary" />}
    </button>
  )
}

export function OptionCard({
  title,
  description,
  active,
  onClick,
}: {
  title: string
  description: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-lg border p-4 text-left transition cursor-pointer hover:border-primary',
        active ? 'border-primary bg-indigo-50 shadow-sm dark:bg-indigo-950' : 'bg-card'
      )}
    >
      <span className={cn('block text-sm font-semibold', active && 'text-primary')}>{title}</span>
      <span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span>
    </button>
  )
}
