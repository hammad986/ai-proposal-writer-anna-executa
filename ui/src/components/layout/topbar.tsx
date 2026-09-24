import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Topbar({
  title = 'Proposals',
  onNewProposal,
}: {
  title?: string
  onNewProposal?: () => void
}) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:px-8">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      </div>
      {onNewProposal && (
        <Button onClick={onNewProposal} size="sm">
          <Plus className="h-4 w-4" />
          New Proposal
        </Button>
      )}
    </header>
  )
}
