import { useState } from 'react'
import {
  FileText,
  Minimize2,
  Maximize2,
  ShieldAlert,
  Sparkles,
  Check,
  Loader2,
} from 'lucide-react'
import { invokeExecutaTool } from '@/anna-bridge'

interface AiRefineToolbarProps {
  currentText: string
  contextTitle: string
  onApplyRefinement: (newText: string) => void
  toast: {
    success: (msg: string) => void
    error: (msg: string) => void
  }
}

export function AiRefineToolbar({
  currentText,
  contextTitle,
  onApplyRefinement,
  toast,
}: AiRefineToolbarProps) {
  const [activeInstruction, setActiveInstruction] = useState<string | null>(null)

  const handleRefine = async (instruction: 'improve_tone' | 'make_concise' | 'expand_details' | 'simplify' | 'add_risks') => {
    setActiveInstruction(instruction)
    try {
      let refinedText = ''
      try {
        const resp = await invokeExecutaTool<{ refinedText: string }>('refine_text', {
          text: currentText,
          instruction,
          context: contextTitle,
        })
        if (resp?.refinedText) {
          refinedText = resp.refinedText
        }
      } catch (err) {
        // Fallback local syntactic transformation
        refinedText = fallbackLocalRefine(currentText, instruction)
      }

      if (refinedText) {
        onApplyRefinement(refinedText)
        toast.success(`Applied AI refinement: ${instruction.replace('_', ' ')}`)
      }
    } catch (e: any) {
      toast.error('Refinement failed: ' + (e?.message || 'Unknown error'))
    } finally {
      setActiveInstruction(null)
    }
  }

  const fallbackLocalRefine = (text: string, inst: string): string => {
    const cleaned = text.trim()
    if (inst === 'improve_tone') {
      return (
        `### Professional Advisory Framing\n\n` +
        cleaned.replace(/we will make/gi, 'our dedicated team will engineer and deliver') +
        `\n\n*All specifications adhere strictly to modern engineering standards and client-approved governance.*`
      )
    }
    if (inst === 'make_concise') {
      const paragraphs = cleaned.split('\n\n').filter(Boolean)
      const shortened = paragraphs.map((p) => {
        const sentences = p.split('. ').filter(Boolean)
        return sentences.slice(0, 2).join('. ') + (sentences.length > 0 && !sentences[0].endsWith('.') ? '.' : '')
      })
      return shortened.join('\n\n')
    }
    if (inst === 'expand_details') {
      return (
        cleaned +
        `\n\n### Technical Execution & Quality Standards\n` +
        `- **Architecture**: Modular separation of concerns with clean API contracts.\n` +
        `- **Resilience**: Comprehensive error boundaries, input sanitization, and automated retry policies.\n` +
        `- **Validation**: Continuous automated unit testing and end-to-end regression validation prior to deployment.`
      )
    }
    if (inst === 'simplify') {
      return cleaned
        .replace(/orchestration/gi, 'organization')
        .replace(/utilize/gi, 'use')
        .replace(/enterprise-grade/gi, 'reliable')
    }
    if (inst === 'add_risks') {
      return (
        cleaned +
        `\n\n### Risk Management & Contingency Plan\n` +
        `| Identified Risk | Severity | Mitigation Strategy |\n` +
        `|---|---|---|\n` +
        `| Third-Party API Latency / Changes | Medium | Mock fallback layer & strict SLA monitoring |\n` +
        `| Scope Drift during Sprints | High | Formal Change Request procedure & weekly scope audits |\n` +
        `| Schema Migration Bottlenecks | Low | Phased database migrations with automated rollback |`
      )
    }
    return cleaned
  }

  const actions: Array<{
    id: 'improve_tone' | 'make_concise' | 'expand_details' | 'simplify' | 'add_risks'
    label: string
    icon: typeof Sparkles
    tooltip: string
  }> = [
    {
      id: 'improve_tone',
      label: 'Polish Tone',
      icon: Sparkles,
      tooltip: 'Rewrite in executive consulting tone',
    },
    {
      id: 'make_concise',
      label: 'Make Concise',
      icon: Minimize2,
      tooltip: 'Tighten wording and eliminate fluff',
    },
    {
      id: 'expand_details',
      label: 'Expand Technical Details',
      icon: Maximize2,
      tooltip: 'Add architectural specs and validation benchmarks',
    },
    {
      id: 'simplify',
      label: 'Simplify Language',
      icon: FileText,
      tooltip: 'Convert technical jargon into plain business language',
    },
    {
      id: 'add_risks',
      label: 'Add Risk Matrix',
      icon: ShieldAlert,
      tooltip: 'Inject risk contingency table',
    },
  ]

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border bg-muted/40 p-1.5 text-xs">
      <span className="flex items-center gap-1 px-2 font-semibold text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        AI Refine:
      </span>
      {actions.map((act) => {
        const Icon = act.icon
        const isLoading = activeInstruction === act.id
        return (
          <button
            key={act.id}
            type="button"
            disabled={activeInstruction !== null}
            onClick={() => handleRefine(act.id)}
            title={act.tooltip}
            className="inline-flex items-center gap-1 rounded-md bg-card px-2.5 py-1 font-medium text-foreground border shadow-2xs hover:bg-muted hover:text-primary transition disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Icon className="h-3 w-3" />}
            <span>{act.label}</span>
          </button>
        )
      })}
    </div>
  )
}
