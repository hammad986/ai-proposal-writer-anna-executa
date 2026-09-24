import * as React from 'react'
import { cn } from '@/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'icon'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition cursor-pointer select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50',
          variant === 'primary' && 'bg-primary text-primary-foreground hover:bg-indigo-600 active:bg-indigo-700',
          variant === 'secondary' && 'bg-muted text-foreground hover:bg-slate-200 dark:hover:bg-slate-700',
          variant === 'ghost' && 'text-muted-foreground hover:bg-muted hover:text-foreground',
          variant === 'danger' && 'bg-red-600 text-white hover:bg-red-500 active:bg-red-700',
          variant === 'outline' && 'border bg-background text-foreground hover:bg-muted',
          size === 'md' && 'h-10 px-4',
          size === 'sm' && 'h-8 px-3 text-xs',
          size === 'icon' && 'h-9 w-9 p-0',
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
