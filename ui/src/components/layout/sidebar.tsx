import { FileText, PlusCircle, Sparkles, Palette, Layers } from 'lucide-react'
import { cn } from '@/utils'

export function Sidebar({
  currentRoute,
  onNavigate,
  onOpenBrandSettings,
}: {
  currentRoute: string
  onNavigate: (route: string) => void
  onOpenBrandSettings?: () => void
}) {
  return (
    <aside className="hidden h-full min-h-screen w-64 shrink-0 border-r bg-card px-4 py-5 lg:flex lg:flex-col">
      <button
        onClick={() => onNavigate('dashboard')}
        className="flex items-center gap-3 px-2 text-left cursor-pointer transition hover:opacity-90"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white shadow-sm">
          <Sparkles className="h-5 w-5" />
        </span>
        <span>
          <span className="block text-sm font-bold tracking-tight text-foreground">AI Proposal Writer</span>
          <span className="block text-[11px] text-muted-foreground">Workspace Edition</span>
        </span>
      </button>

      <nav className="mt-8 space-y-1.5 flex-1">
        <button
          onClick={() => onNavigate('dashboard')}
          className={cn(
            'flex w-full items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition cursor-pointer text-left',
            currentRoute === 'dashboard'
              ? 'bg-primary/10 text-primary font-bold'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <FileText className="h-4 w-4" />
          Proposals Pipeline
        </button>

        <button
          onClick={() => onNavigate('new')}
          className={cn(
            'flex w-full items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition cursor-pointer text-left',
            currentRoute === 'new'
              ? 'bg-primary/10 text-primary font-bold'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <PlusCircle className="h-4 w-4" />
          New Proposal Wizard
        </button>

        {onOpenBrandSettings && (
          <button
            onClick={onOpenBrandSettings}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer text-left"
          >
            <Palette className="h-4 w-4" />
            Brand Kit &amp; Settings
          </button>
        )}
      </nav>

      <div className="border-t pt-4 text-xs text-muted-foreground space-y-1">
        <div className="flex items-center gap-1.5 font-semibold text-foreground">
          <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
          Anna Host Runtime
        </div>
        <p className="text-[11px] text-muted-foreground">Executa RPC &amp; Storage Connected</p>
      </div>
    </aside>
  )
}
