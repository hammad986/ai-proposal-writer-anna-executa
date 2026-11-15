import * as React from 'react'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'

export function AppShell({
  children,
  title,
  currentRoute = 'dashboard',
  onNavigate,
  onNewProposal,
  onOpenBrandSettings,
  extraActions,
}: {
  children: React.ReactNode
  title?: string
  currentRoute?: string
  onNavigate: (route: string) => void
  onNewProposal?: () => void
  onOpenBrandSettings?: () => void
  extraActions?: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        currentRoute={currentRoute}
        onNavigate={onNavigate}
        onOpenBrandSettings={onOpenBrandSettings}
      />
      <div className="min-w-0 flex-1 flex flex-col">
        <Topbar
          title={title}
          onNewProposal={onNewProposal}
          onOpenBrandSettings={onOpenBrandSettings}
          extraActions={extraActions}
        />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  )
}
