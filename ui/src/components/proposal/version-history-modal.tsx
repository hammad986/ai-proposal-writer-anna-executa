import { useState } from 'react'
import {
  History,
  RotateCcw,
  Sparkles,
  X,
  Plus,
  Clock,
  Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { GeneratedProposal, ProposalVersionSnapshot } from '@/types'

export function VersionHistoryModal({
  proposal,
  onUpdateProposal,
  onClose,
  toast,
}: {
  proposal: GeneratedProposal
  onUpdateProposal: (updated: GeneratedProposal) => void
  onClose: () => void
  toast: {
    success: (msg: string) => void
    error: (msg: string) => void
  }
}) {
  const [snapshotNote, setSnapshotNote] = useState('')
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false)
  const [selectedSnapshot, setSelectedSnapshot] = useState<ProposalVersionSnapshot | null>(null)

  const versions = proposal.versions || []

  const handleCreateSnapshot = () => {
    const nextVerNumber = `v1.${versions.length + 1}`
    const newSnapshot: ProposalVersionSnapshot = {
      id: `ver_${Date.now()}`,
      versionNumber: nextVerNumber,
      createdAt: new Date().toISOString(),
      note: snapshotNote.trim() || 'Manual revision snapshot',
      sectionsCount: proposal.sections.length,
      totalValue: proposal.totalValue,
      snapshot: JSON.parse(JSON.stringify(proposal)),
    }

    const updatedVersions = [newSnapshot, ...versions]
    const updatedProposal: GeneratedProposal = {
      ...proposal,
      versions: updatedVersions,
      updatedAt: new Date().toISOString(),
    }

    onUpdateProposal(updatedProposal)
    setSnapshotNote('')
    setIsCreatingSnapshot(false)
    toast.success(`Created snapshot ${nextVerNumber}!`)
  }

  const handleRestoreSnapshot = (ver: ProposalVersionSnapshot) => {
    // Preserve version history during restore
    const restored: GeneratedProposal = {
      ...ver.snapshot,
      id: proposal.id, // keep current ID
      versions: proposal.versions,
      updatedAt: new Date().toISOString(),
    }

    onUpdateProposal(restored)
    toast.success(`Restored proposal to ${ver.versionNumber}`)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-2xl rounded-xl border bg-card p-6 shadow-2xl space-y-6 max-h-[88vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-primary">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Proposal Revision History</h2>
              <p className="text-xs text-muted-foreground">
                Capture milestone snapshots, inspect past edits, and restore previous drafts.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Create Snapshot Strip */}
        <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-primary" />
              Save Current Proposal Snapshot
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsCreatingSnapshot(!isCreatingSnapshot)}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              New Snapshot
            </Button>
          </div>

          {isCreatingSnapshot && (
            <div className="space-y-3 pt-2 border-t">
              <input
                type="text"
                value={snapshotNote}
                onChange={(e) => setSnapshotNote(e.target.value)}
                placeholder="Snapshot description (e.g. 'Added legal IP clause' or 'Updated pricing table')"
                className="w-full rounded-md border bg-background px-3 py-1.5 text-xs text-foreground"
              />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setIsCreatingSnapshot(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleCreateSnapshot}>
                  Save Version
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Versions List */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Saved Revisions ({versions.length})
          </h3>

          {versions.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No previous version snapshots saved. Click &quot;New Snapshot&quot; above to capture this proposal state.
            </div>
          ) : (
            <div className="divide-y divide-border rounded-xl border bg-card overflow-hidden">
              {versions.map((ver) => (
                <div
                  key={ver.id}
                  className="flex items-center justify-between p-3.5 hover:bg-muted/30 transition text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground rounded bg-primary/10 px-1.5 py-0.5 text-primary">
                        {ver.versionNumber}
                      </span>
                      <span className="font-medium text-foreground">{ver.note}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-2">
                      <span>{new Date(ver.createdAt).toLocaleString()}</span>
                      <span>•</span>
                      <span>{ver.sectionsCount} sections</span>
                      <span>•</span>
                      <span>{ver.totalValue}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRestoreSnapshot(ver)}
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1" />
                      Restore
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t pt-3">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
