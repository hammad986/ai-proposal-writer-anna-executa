import { Plus, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Topbar({
  title = 'Proposals',
  onNewProposal,
  onOpenBrandSettings,
  extraActions,
}: {
  title?: string
  onNewProposal?: () => void
  onOpenBrandSettings?: () => void
  extraActions?: React.ReactNode
}) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:px-8">
      <div>
        <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        {extraActions}
        {onOpenBrandSettings && (
          <Button variant="outline" size="sm" onClick={onOpenBrandSettings} title="Agency Brand Kit">
            <Palette className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">Brand Kit</span>
          </Button>
        )}
        {onNewProposal && (
          <Button onClick={onNewProposal} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            New Proposal
          </Button>
        )}
      </div>
    </header>
  )
}
