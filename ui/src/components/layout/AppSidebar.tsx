import { useState } from 'react'
import {
  LayoutDashboard,
  Sparkles,
  Mic,
  FileCheck,
  BookOpen,
  Kanban,
  Settings,
  LayoutTemplate,
  ChevronLeft,
  ChevronRight,
  Plus,
  FileText,
  ShieldCheck,
  Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AetherionLogo } from '@/components/branding/AetherionLogo'
import type { BrandConfig } from '@/types'

export type NavigationTab =
  | 'dashboard'
  | 'studio'
  | 'voice'
  | 'rfp'
  | 'templates'
  | 'knowledge'
  | 'pipeline'
  | 'settings'

interface AppSidebarProps {
  currentTab: NavigationTab
  onSelectTab: (tab: NavigationTab) => void
  onNewProposal: () => void
  proposalCount: number
  activeProposalTitle?: string
  brandConfig: BrandConfig
}

export function AppSidebar({
  currentTab,
  onSelectTab,
  onNewProposal,
  proposalCount,
  activeProposalTitle,
  brandConfig,
}: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard, badge: proposalCount },
    { id: 'studio' as const, label: 'Proposal Studio', icon: FileText, highlight: !!activeProposalTitle },
    { id: 'voice' as const, label: 'Voice-to-Proposal', icon: Mic, tag: 'Voice AI' },
    { id: 'rfp' as const, label: 'RFP Intelligence', icon: FileCheck, tag: 'Shredder' },
    { id: 'templates' as const, label: 'Template Gallery', icon: LayoutTemplate },
    { id: 'knowledge' as const, label: 'Knowledge Base', icon: BookOpen, tag: 'RAG' },
    { id: 'pipeline' as const, label: 'Deal Pipeline', icon: Kanban },
    { id: 'settings' as const, label: 'Brand & Settings', icon: Settings },
  ]

  return (
    <aside
      className={`relative flex flex-col border-r bg-card transition-all duration-300 z-30 select-none ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b px-3">
        {!collapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <AetherionLogo variant="horizontal" size="sm" showTagline />
          </div>
        )}

        {collapsed && (
          <div className="mx-auto">
            <AetherionLogo variant="symbol" size="sm" />
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Action Button */}
      <div className="p-3">
        <Button
          onClick={onNewProposal}
          className={`w-full bg-gradient-to-r from-primary to-indigo-600 hover:opacity-95 text-primary-foreground shadow-sm shadow-primary/20 font-semibold transition ${
            collapsed ? 'px-0 h-10 w-10 mx-auto justify-center rounded-xl' : 'h-10 text-xs gap-2 rounded-lg'
          }`}
          title="Create New Proposal"
        >
          <Plus className="h-4 w-4" />
          {!collapsed && <span>Create Proposal</span>}
        </Button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentTab === item.id

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition cursor-pointer ${
                isActive
                  ? 'bg-primary/10 text-primary font-semibold dark:bg-primary/20'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              } ${collapsed ? 'justify-center px-0' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={`h-4 w-4 shrink-0 transition ${
                  isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                }`}
              />

              {!collapsed && (
                <div className="flex flex-1 items-center justify-between overflow-hidden">
                  <span className="truncate">{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      {item.badge}
                    </span>
                  )}
                  {item.tag && (
                    <span className="ml-auto rounded-full bg-indigo-500/10 px-2 py-0.5 text-[9px] font-bold text-primary dark:bg-indigo-950/60 dark:text-indigo-300">
                      {item.tag}
                    </span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom Status Panel */}
      <div className="border-t p-3 bg-muted/20">
        {!collapsed ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Localhost Ready
              </span>
              <span className="font-mono text-[10px]">v3.0.0</span>
            </div>
            {activeProposalTitle && (
              <p className="text-[10px] text-muted-foreground truncate font-medium">
                Active: <span className="text-foreground">{activeProposalTitle}</span>
              </p>
            )}
          </div>
        ) : (
          <div className="flex justify-center" title="Localhost 3.0 Connected">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </div>
        )}
      </div>
    </aside>
  )
}
