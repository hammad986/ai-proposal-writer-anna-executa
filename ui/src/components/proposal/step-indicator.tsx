import { Check } from 'lucide-react'
import { cn } from '@/utils'

const steps = ['Basics', 'Scope', 'Pricing', 'Style']

export function StepIndicator({ currentStep }: { currentStep: number }) {
  const progress = Math.max(0, ((currentStep - 1) / 3) * 100)

  return (
    <div className="mx-auto w-full max-w-2xl px-4">
      <div className="relative flex items-center justify-between">
        <div className="absolute left-8 right-8 top-4 h-1 rounded-full bg-muted" />
        <div
          className="absolute left-8 top-4 h-1 rounded-full bg-primary transition-all duration-300"
          style={{ width: `calc(${progress}% - ${progress ? '4rem' : '0rem'})` }}
        />
        {steps.map((label, index) => {
          const number = index + 1
          const completed = number < currentStep
          const active = number === currentStep
          return (
            <div key={label} className="relative z-10 flex flex-col items-center gap-2">
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border bg-background text-sm font-semibold transition',
                  active && 'border-primary bg-primary text-white shadow-sm',
                  completed && 'border-emerald-500 bg-emerald-500 text-white'
                )}
              >
                {completed ? <Check className="h-4 w-4" /> : number}
              </span>
              <span className={cn('text-xs font-medium text-muted-foreground', active && 'text-primary font-semibold')}>
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
