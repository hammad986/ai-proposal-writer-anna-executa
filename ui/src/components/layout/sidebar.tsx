import { FileText, PlusCircle, Sparkles } from 'lucide-react'
import { cn } from '@/utils'

export function Sidebar({
  currentRoute,
  onNavigate,
}: {
  currentRoute: string
  onNavigate: (route: string) => void
}) {
  return (
    <aside className="hidden h-full min-h-screen w-64 shrink-0 border-r bg-card px-4 py-5 lg:flex lg:flex-col">
      <button
        onClick={() => onNavigate('dashboard')}
        className="flex items-center gap-3 px-2 text-left cursor-pointer transition hover:opacity-90"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-white shadow-sm">
          <Sparkles className="h-5 w-5" />
        </span>
        <span>
          <span className="block text-sm font-semibold tracking-tight">AI Proposal Writer</span>
          <span className="block text-xs text-muted-foreground">Powered by Aetherion Labs</span>
        </span>
      </button>

      <nav className="mt-8 space-y-1.5 flex-1">
        <button
          onClick={() => onNavigate('dashboard')}
          className={cn(
            'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition cursor-pointer text-left',
            currentRoute === 'dashboard'
              ? 'bg-primary/10 text-primary font-semibold'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <FileText className="h-4 w-4" />
          Proposals
        </button>

        <button
          onClick={() => onNavigate('new')}
          className={cn(
            'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition cursor-pointer text-left',
            currentRoute === 'new'
              ? 'bg-primary/10 text-primary font-semibold'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <PlusCircle className="h-4 w-4" />
          Create Proposal
        </button>
      </nav>

      <div className="border-t pt-4 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Anna App Platform</p>
        <p className="mt-1">Local Executa + Storage active</p>
      </div>
    </aside>
  )
}
