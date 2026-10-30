import { useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Pencil,
  RefreshCw,
  Trash2,
  X,
  Sparkles,
  BookOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/field'
import type { ProposalSection } from '@/types'
import { PricingTable } from './pricing-table'
import { TimelinePhases } from './timeline-phases'
import { AiRefineToolbar } from './ai-refine-toolbar'

export function renderBold(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g)
  return parts.map((part, index) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={index} className="font-semibold text-foreground">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    )
  )
}

export function renderSectionContent(section: ProposalSection) {
  if (section.type === 'table' || section.content.includes('|')) {
    return <PricingTable content={section.content} />
  }
  if (section.type === 'phases' || section.content.includes('## Phase')) {
    return <TimelinePhases content={section.content} />
  }
  if (section.type === 'list') {
    return (
      <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-muted-foreground">
        {section.content
          .split('\n')
          .map((line) => line.trim().replace(/^[-*]\s*/, ''))
          .filter(Boolean)
          .map((line, idx) => (
            <li key={idx}>{renderBold(line)}</li>
          ))}
      </ul>
    )
  }
  return (
    <div className="proposal-markdown space-y-3.5 text-sm leading-7 text-muted-foreground">
      {section.content.split(/\n{2,}/).map((paragraph, idx) => (
        <p key={idx}>{renderBold(paragraph)}</p>
      ))}
    </div>
  )
}

export function SectionCard({
  section,
  index,
  totalSections,
  onSave,
  onUpdateTitle,
  onRegenerate,
  onMoveUp,
  onMoveDown,
  onDelete,
  isRegenerating = false,
  toast,
}: {
  section: ProposalSection
  index: number
  totalSections: number
  onSave: (content: string, type?: ProposalSection['type']) => void
  onUpdateTitle?: (title: string) => void
  onRegenerate: (customInstruction?: string) => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  onDelete?: () => void
  isRegenerating?: boolean
  toast: {
    success: (msg: string) => void
    error: (msg: string) => void
  }
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(section.content)
  const [draftType, setDraftType] = useState<ProposalSection['type']>(section.type)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [draftTitle, setDraftTitle] = useState(section.title)
  const [showRegenPrompt, setShowRegenPrompt] = useState(false)
  const [regenInstruction, setRegenInstruction] = useState('')

  const handleSaveTitle = () => {
    if (draftTitle.trim() && onUpdateTitle) {
      onUpdateTitle(draftTitle.trim())
    }
    setIsEditingTitle(false)
  }

  const handleExecuteRegen = () => {
    onRegenerate(regenInstruction.trim() || undefined)
    setShowRegenPrompt(false)
    setRegenInstruction('')
  }

  return (
    <section
      id={section.id}
      className="scroll-mt-24 rounded-xl border bg-card p-5 shadow-xs transition hover:shadow-md space-y-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-l-4 border-primary pl-4">
        {/* Title & Badge */}
        <div className="flex-1 min-w-[200px]">
          {isEditingTitle ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                className="rounded border bg-background px-2.5 py-1 text-sm font-semibold text-foreground focus:ring-1 focus:ring-primary"
              />
              <Button size="icon" variant="ghost" onClick={handleSaveTitle}>
                <Check className="h-4 w-4 text-emerald-600" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setIsEditingTitle(false)}>
                <X className="h-4 w-4 text-slate-500" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground">{section.title}</h2>
              <button
                onClick={() => {
                  setDraftTitle(section.title)
                  setIsEditingTitle(true)
                }}
                className="opacity-0 group-hover:opacity-100 hover:text-primary transition p-0.5 text-muted-foreground"
                title="Rename section"
              >
                <Pencil className="h-3 w-3" />
              </button>
              {section.isEdited && (
                <span className="rounded-full bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  Edited
                </span>
              )}
              <span className="rounded-full bg-muted/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground uppercase">
                {section.type}
              </span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          {/* Reorder Up / Down */}
          {onMoveUp && (
            <Button
              size="icon"
              variant="ghost"
              title="Move section up"
              disabled={index === 0}
              onClick={onMoveUp}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          )}
          {onMoveDown && (
            <Button
              size="icon"
              variant="ghost"
              title="Move section down"
              disabled={index === totalSections - 1}
              onClick={onMoveDown}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          )}

          {/* Edit toggle */}
          {isEditing ? (
            <>
              <Button
                size="icon"
                variant="ghost"
                title="Save section changes"
                onClick={() => {
                  onSave(draft, draftType)
                  setIsEditing(false)
                }}
              >
                <Check className="h-4 w-4 text-emerald-600" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                title="Cancel editing"
                onClick={() => {
                  setDraft(section.content)
                  setIsEditing(false)
                }}
              >
                <X className="h-4 w-4 text-slate-500" />
              </Button>
            </>
          ) : (
            <>
              <Button
                size="icon"
                variant="ghost"
                title="Edit section"
                onClick={() => {
                  setDraft(section.content)
                  setDraftType(section.type)
                  setIsEditing(true)
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>

              <Button
                size="icon"
                variant="ghost"
                title="Regenerate this section with AI"
                onClick={() => setShowRegenPrompt(!showRegenPrompt)}
                disabled={isRegenerating}
              >
                {isRegenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>

              <Button
                size="icon"
                variant="ghost"
                title="Save section to Reusable Content Library"
                onClick={() => {
                  try {
                    const raw = localStorage.getItem('proposal_custom_blocks') || '[]'
                    const list = JSON.parse(raw)
                    list.push({
                      id: `custom_${Date.now()}`,
                      title: section.title,
                      description: `Saved from section "${section.title}"`,
                      category: 'custom',
                      content: section.content,
                      format: section.type,
                      tags: ['Custom Saved Block'],
                      createdAt: new Date().toISOString(),
                    })
                    localStorage.setItem('proposal_custom_blocks', JSON.stringify(list))
                    alert(`"${section.title}" saved to Content Library!`)
                  } catch (e) {
                    console.error('Failed to save to library:', e)
                  }
                }}
              >
                <BookOpen className="h-4 w-4 text-indigo-400" />
              </Button>

              {onDelete && (
                <Button
                  size="icon"
                  variant="ghost"
                  title="Delete section"
                  onClick={onDelete}
                  className="hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Custom AI Regeneration Box */}
      {showRegenPrompt && (
        <div className="rounded-lg border bg-primary/5 p-3.5 space-y-2.5 animate-in fade-in">
          <div className="flex items-center justify-between text-xs font-semibold text-foreground">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Regenerate &quot;{section.title}&quot; with AI Instructions
            </span>
            <button
              onClick={() => setShowRegenPrompt(false)}
              className="text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <input
            type="text"
            value={regenInstruction}
            onChange={(e) => setRegenInstruction(e.target.value)}
            placeholder="e.g. Focus on microservices architecture, add strict 30-day warranty, or shorten paragraphs..."
            className="w-full rounded-md border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary"
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setShowRegenPrompt(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleExecuteRegen} disabled={isRegenerating}>
              {isRegenerating ? 'Regenerating...' : 'Regenerate Section'}
            </Button>
          </div>
        </div>
      )}

      {/* Section Content: Edit vs View */}
      {isEditing ? (
        <div className="space-y-3">
          {/* AI Refine Toolbar */}
          <AiRefineToolbar
            currentText={draft}
            contextTitle={section.title}
            onApplyRefinement={(newText) => setDraft(newText)}
            toast={toast}
          />

          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground font-medium">Render Format:</span>
            <select
              value={draftType}
              onChange={(e) => setDraftType(e.target.value as ProposalSection['type'])}
              className="rounded border bg-background px-2 py-1 text-xs text-foreground"
            >
              <option value="text">Paragraph Text</option>
              <option value="table">Markdown Table</option>
              <option value="phases">Phased Roadmap</option>
              <option value="list">Bullet List</option>
            </select>
          </div>

          <Textarea
            className="min-h-56 font-mono text-xs leading-relaxed"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />

          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setDraft(section.content)
                setIsEditing(false)
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                onSave(draft, draftType)
                setIsEditing(false)
              }}
            >
              Save Section
            </Button>
          </div>
        </div>
      ) : (
        renderSectionContent(section)
      )}
    </section>
  )
}
