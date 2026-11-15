import React from 'react'
import {
  X,
  Eye,
  Clock,
  Users,
  Activity,
  Flame,
  MousePointer,
  CheckCircle2,
  Calendar,
  Sparkles,
  BarChart3,
  Shield,
  FileCheck,
} from 'lucide-react'
import type { GeneratedProposal, ProposalAnalytics, SectionEngagement } from '../../types'

interface AnalyticsDrawerProps {
  isOpen: boolean
  onClose: () => void
  proposal: GeneratedProposal
  onUpdateAnalytics: (updatedAnalytics: ProposalAnalytics) => void
}

export const AnalyticsDrawer: React.FC<AnalyticsDrawerProps> = ({
  isOpen,
  onClose,
  proposal,
  onUpdateAnalytics,
}) => {
  if (!isOpen) return null

  const analytics = proposal.analytics || {
    totalViews: 0,
    uniqueViewers: 0,
    totalTimeSpentSeconds: 0,
    sectionsEngagement: [],
    timelineEvents: [],
  }

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60)
    const remSec = sec % 60
    if (mins === 0) return `${remSec}s`
    return `${mins}m ${remSec}s`
  }

  // Action to simulate a live client visit (adds telemetry points for testing)
  const handleSimulateClientVisit = () => {
    const newViews = analytics.totalViews + 1
    const newUnique = analytics.uniqueViewers === 0 ? 1 : analytics.uniqueViewers + (Math.random() > 0.5 ? 1 : 0)
    const sessionSeconds = Math.floor(Math.random() * 180) + 90 // 1.5 - 4.5 minutes
    const totalTime = analytics.totalTimeSpentSeconds + sessionSeconds

    // Distribute time across sections
    const sections = proposal.sections.map((s, idx) => {
      // Pricing and scope typically receive the most attention
      const isPricing = s.title.toLowerCase().includes('pricing') || s.title.toLowerCase().includes('investment')
      const isScope = s.title.toLowerCase().includes('scope') || s.title.toLowerCase().includes('deliverables')
      const weight = isPricing ? 0.4 : isScope ? 0.3 : 0.3 / Math.max(proposal.sections.length - 2, 1)

      const sectionTime = Math.round(sessionSeconds * weight)
      return {
        sectionTitle: s.title,
        timeSpentSeconds: sectionTime,
        viewPercentage: Math.round(weight * 100),
      }
    })

    const newEvent = {
      id: `evt_${Date.now()}`,
      eventType: 'opened' as const,
      description: `Client session initiated from desktop browser (Session duration: ${formatSeconds(sessionSeconds)})`,
      timestamp: new Date().toISOString(),
      clientDevice: 'Chrome (macOS / Windows)',
    }

    const updated: ProposalAnalytics = {
      totalViews: newViews,
      uniqueViewers: newUnique,
      totalTimeSpentSeconds: totalTime,
      lastViewedAt: new Date().toISOString(),
      sectionsEngagement: sections,
      timelineEvents: [newEvent, ...analytics.timelineEvents],
    }

    onUpdateAnalytics(updated)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg h-full bg-zinc-950 border-l border-zinc-800 p-6 flex flex-col shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Client Engagement Telemetry</h3>
              <p className="text-xs text-zinc-400">Real-time open tracking & section heatmap</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Engagement Metrics Cards */}
        <div className="grid grid-cols-3 gap-3 my-5">
          <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-center space-y-1">
            <div className="flex items-center justify-center text-indigo-400">
              <Eye className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold text-white">{analytics.totalViews}</div>
            <div className="text-[11px] text-zinc-400">Total Opens</div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-center space-y-1">
            <div className="flex items-center justify-center text-emerald-400">
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold text-white">
              {formatSeconds(analytics.totalTimeSpentSeconds)}
            </div>
            <div className="text-[11px] text-zinc-400">Reading Time</div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-center space-y-1">
            <div className="flex items-center justify-center text-purple-400">
              <Users className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold text-white">{analytics.uniqueViewers}</div>
            <div className="text-[11px] text-zinc-400">Unique Viewers</div>
          </div>
        </div>

        {/* Section Reading Heatmap */}
        <div className="space-y-4 my-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Section Reading Heatmap
            </h4>
            <span className="text-[11px] text-zinc-500">Client focus breakdown</span>
          </div>

          {analytics.sectionsEngagement.length === 0 ? (
            <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 text-center space-y-2">
              <p className="text-xs text-zinc-400">
                No telemetry recorded yet. Click below to simulate a client viewing session.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {analytics.sectionsEngagement.map((sec, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300 font-medium truncate max-w-[260px]">
                      {sec.sectionTitle}
                    </span>
                    <span className="text-zinc-400 font-mono text-[11px]">
                      {formatSeconds(sec.timeSpentSeconds)} ({sec.viewPercentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        sec.viewPercentage > 30
                          ? 'bg-amber-500'
                          : sec.viewPercentage > 15
                          ? 'bg-indigo-500'
                          : 'bg-zinc-600'
                      }`}
                      style={{ width: `${Math.min(sec.viewPercentage, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Simulate Client Activity Button */}
        <div className="my-4 pt-2">
          <button
            type="button"
            onClick={handleSimulateClientVisit}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 font-medium text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Simulate Client Reading Session (Test Telemetry)
          </button>
        </div>

        {/* Activity Timeline Audit Feed */}
        <div className="mt-4 pt-4 border-t border-zinc-800 flex-1 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            Engagement Audit Feed
          </h4>

          {analytics.timelineEvents.length === 0 ? (
            <p className="text-xs text-zinc-500 italic">No events logged yet.</p>
          ) : (
            <div className="space-y-2.5">
              {analytics.timelineEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-3 rounded-lg bg-zinc-900 border border-zinc-800/80 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between text-zinc-300 font-medium">
                    <span className="flex items-center gap-1.5">
                      <MousePointer className="w-3 h-3 text-indigo-400" />
                      {evt.description}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-500 flex items-center justify-between">
                    <span>{new Date(evt.timestamp).toLocaleString()}</span>
                    {evt.clientDevice && <span>{evt.clientDevice}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-zinc-800 text-center">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
