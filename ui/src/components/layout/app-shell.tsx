import * as React from 'react'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'

export function AppShell({
  children,
  title,
  currentRoute = 'dashboard',
  onNavigate,
  onNewProposal,
}: {
  children: React.ReactNode
  title?: string
  currentRoute?: string
  onNavigate: (route: string) => void
  onNewProposal?: () => void
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar currentRoute={currentRoute} onNavigate={onNavigate} />
      <div className="min-w-0 flex-1 flex flex-col">
        <Topbar title={title} onNewProposal={onNewProposal} />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  )
}
