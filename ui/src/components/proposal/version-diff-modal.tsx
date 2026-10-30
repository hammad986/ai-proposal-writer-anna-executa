import React, { useState } from 'react'
import {
  X,
  GitCompare,
  ArrowRight,
  PlusCircle,
  MinusCircle,
  FileText,
  DollarSign,
  Calendar,
  CheckCircle2,
} from 'lucide-react'
import type { GeneratedProposal, ProposalVersionSnapshot } from '../../types'

interface VersionDiffModalProps {
  isOpen: boolean
  onClose: () => void
  currentProposal: GeneratedProposal
  versions: ProposalVersionSnapshot[]
}

export const VersionDiffModal: React.FC<VersionDiffModalProps> = ({
  isOpen,
  onClose,
  currentProposal,
  versions,
}) => {
  // Version A (older) vs Version B (newer)
  const currentSnapshot: ProposalVersionSnapshot = {
    id: 'current',
    versionNumber: 'Current Draft',
    createdAt: currentProposal.updatedAt,
    note: 'Live working proposal in workspace',
    sectionsCount: currentProposal.sections.length,
    totalValue: currentProposal.totalValue,
    snapshot: currentProposal,
  }

  const allSnapshots = [currentSnapshot, ...versions]

  const [versionAId, setVersionAId] = useState<string>(
    versions.length > 0 ? versions[versions.length - 1].id : 'current'
  )
  const [versionBId, setVersionBId] = useState<string>('current')

  if (!isOpen) return null

  const snapshotA = allSnapshots.find((s) => s.id === versionAId) || currentSnapshot
  const snapshotB = allSnapshots.find((s) => s.id === versionBId) || currentSnapshot

  // Compute section differences
  const sectionsA = snapshotA.snapshot.sections || []
  const sectionsB = snapshotB.snapshot.sections || []

  const titlesA = new Set(sectionsA.map((s) => s.title))
  const titlesB = new Set(sectionsB.map((s) => s.title))

  const allTitles = Array.from(new Set([...sectionsA.map((s) => s.title), ...sectionsB.map((s) => s.title)]))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[90vh] bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Visual Version Diff & Changelog</h3>
              <p className="text-xs text-zinc-400">
                Compare differences in scope, sections, and commercial pricing across revisions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Version Pickers & High-Level Comparison */}
        <div className="p-5 border-b border-zinc-800 bg-zinc-900/40 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Base Version A */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Base Version (Original)
            </label>
            <select
              value={versionAId}
              onChange={(e) => setVersionAId(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
            >
              {allSnapshots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.versionNumber} — {new Date(s.createdAt).toLocaleDateString()} ({s.totalValue})
                </option>
              ))}
            </select>
            <div className="text-[11px] text-zinc-500 flex items-center justify-between pt-1">
              <span>Sections: {snapshotA.snapshot.sections?.length || 0}</span>
              <span className="font-semibold text-zinc-300">{snapshotA.totalValue}</span>
            </div>
          </div>

          {/* Target Version B */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Compared Version (Target)
            </label>
            <select
              value={versionBId}
              onChange={(e) => setVersionBId(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
            >
              {allSnapshots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.versionNumber} — {new Date(s.createdAt).toLocaleDateString()} ({s.totalValue})
                </option>
              ))}
            </select>
            <div className="text-[11px] text-zinc-500 flex items-center justify-between pt-1">
              <span>Sections: {snapshotB.snapshot.sections?.length || 0}</span>
              <span className="font-semibold text-zinc-300">{snapshotB.totalValue}</span>
            </div>
          </div>
        </div>

        {/* Commercial Diff Pill */}
        <div className="px-5 py-3 bg-zinc-900/60 border-b border-zinc-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 font-medium">Commercial Value Shift:</span>
            <span className="font-semibold text-zinc-300">{snapshotA.totalValue}</span>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
            <span className="font-bold text-emerald-400">{snapshotB.totalValue}</span>
          </div>

          <div className="text-zinc-500 text-[11px]">
            {allTitles.length} total sections compared
          </div>
        </div>

        {/* Section Comparison List */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          {allTitles.map((title) => {
            const secA = sectionsA.find((s) => s.title === title)
            const secB = sectionsB.find((s) => s.title === title)

            const isAdded = !secA && Boolean(secB)
            const isRemoved = Boolean(secA) && !secB
            const isModified = Boolean(secA) && Boolean(secB) && secA?.content !== secB?.content
            const isUnchanged = Boolean(secA) && Boolean(secB) && secA?.content === secB?.content

            return (
              <div
                key={title}
                className={`p-4 rounded-xl border space-y-3 ${
                  isAdded
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : isRemoved
                    ? 'bg-rose-950/20 border-rose-500/30'
                    : isModified
                    ? 'bg-amber-950/15 border-amber-500/30'
                    : 'bg-zinc-900/40 border-zinc-800/80'
                }`}
              >
                {/* Section Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isAdded && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 flex items-center gap-1">
                        <PlusCircle className="w-3 h-3" /> Added Section
                      </span>
                    )}
                    {isRemoved && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 flex items-center gap-1">
                        <MinusCircle className="w-3 h-3" /> Removed Section
                      </span>
                    )}
                    {isModified && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400">
                        Modified Content
                      </span>
                    )}
                    {isUnchanged && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-500">
                        Unchanged
                      </span>
                    )}
                    <h4 className="text-sm font-semibold text-zinc-200">{title}</h4>
                  </div>
                </div>

                {/* Diff Viewer Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  {/* Left (Version A) */}
                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
                    <div className="text-[10px] font-sans font-semibold text-zinc-500 border-b border-zinc-800 pb-1 mb-1">
                      {snapshotA.versionNumber}
                    </div>
                    {secA ? (
                      <div className="text-zinc-400 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
                        {secA.content}
                      </div>
                    ) : (
                      <div className="text-zinc-600 italic">Section did not exist in this version.</div>
                    )}
                  </div>

                  {/* Right (Version B) */}
                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
                    <div className="text-[10px] font-sans font-semibold text-indigo-400 border-b border-zinc-800 pb-1 mb-1">
                      {snapshotB.versionNumber}
                    </div>
                    {secB ? (
                      <div
                        className={`whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed ${
                          isModified ? 'text-zinc-200' : 'text-zinc-400'
                        }`}
                      >
                        {secB.content}
                      </div>
                    ) : (
                      <div className="text-zinc-600 italic">Section deleted in this version.</div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
          <span>Comparing {snapshotA.versionNumber} against {snapshotB.versionNumber}</span>
          <button
            onClick={onClose}
            className="py-1.5 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition-colors"
          >
            Close Diff
          </button>
        </div>
      </div>
    </div>
  )
}
