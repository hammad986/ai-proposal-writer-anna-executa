import { cn } from '@/utils'
import type { GeneratedProposal } from '@/types'

export function StatusBadge({ status }: { status: GeneratedProposal['status'] }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
        status === 'draft' && 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
        status === 'sent' && 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200',
        status === 'accepted' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200',
        status === 'rejected' && 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200'
      )}
    >
      {status}
    </span>
  )
}
