import { useState } from 'react'
import { Check, Pencil, RefreshCw, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/field'
import type { ProposalSection } from '@/types'
import { PricingTable } from './pricing-table'
import { TimelinePhases } from './timeline-phases'

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
  onSave,
  onRegenerate,
  isRegenerating = false,
}: {
  section: ProposalSection
  onSave: (content: string) => void
  onRegenerate: () => void
  isRegenerating?: boolean
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(section.content)

  return (
    <section id={section.id} className="scroll-mt-24 rounded-lg border bg-card p-5 shadow-sm transition hover:shadow-md">
      <div className="mb-4 flex items-start justify-between gap-4 border-l-4 border-primary pl-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">{section.title}</h2>
          {section.isEdited && (
            <span className="mt-1.5 inline-flex rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              Edited
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isEditing ? (
            <>
              <Button
                size="icon"
                variant="ghost"
                title="Save section"
                onClick={() => {
                  onSave(draft)
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
                title="Edit section content"
                onClick={() => {
                  setDraft(section.content)
                  setIsEditing(true)
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                title="Regenerate this section with AI"
                onClick={onRegenerate}
                disabled={isRegenerating}
              >
                {isRegenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </>
          )}
        </div>
      </div>
      {isEditing ? (
        <div className="space-y-3">
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
                onSave(draft)
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
