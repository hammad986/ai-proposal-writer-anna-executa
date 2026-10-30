import { useState } from 'react'
import {
  HelpCircle,
  Copy,
  Check,
  Sparkles,
  X,
  FileQuestion,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { invokeExecutaTool } from '@/anna-bridge'
import { generateDefaultDiscoveryQuestions } from '@/defaults'
import type { GeneratedProposal, DiscoveryQuestion } from '@/types'

interface DiscoveryQuestionsModalProps {
  proposal: GeneratedProposal
  onUpdateProposal: (updated: GeneratedProposal) => void
  onClose: () => void
  toast: {
    success: (msg: string) => void
    error: (msg: string) => void
  }
}

export function DiscoveryQuestionsModal({
  proposal,
  onUpdateProposal,
  onClose,
  toast,
}: DiscoveryQuestionsModalProps) {
  const [questions, setQuestions] = useState<DiscoveryQuestion[]>(() => {
    return proposal.discoveryQuestions || generateDefaultDiscoveryQuestions(proposal.formData)
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleRegenerateQuestions = async () => {
    setIsGenerating(true)
    try {
      let result: DiscoveryQuestion[] | null = null
      try {
        const resp = await invokeExecutaTool<{ questions: DiscoveryQuestion[] }>(
          'generate_discovery_questions',
          { formData: proposal.formData }
        )
        if (resp?.questions && Array.isArray(resp.questions)) {
          result = resp.questions
        }
      } catch {
        result = generateDefaultDiscoveryQuestions(proposal.formData)
      }

      if (!result) {
        result = generateDefaultDiscoveryQuestions(proposal.formData)
      }

      setQuestions(result)
      onUpdateProposal({
        ...proposal,
        discoveryQuestions: result,
        updatedAt: new Date().toISOString(),
      })
      toast.success('Project discovery questions synthesized!')
    } catch (e: any) {
      toast.error('Failed to generate questions: ' + (e?.message || 'Unknown error'))
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyAll = () => {
    const text = questions
      .map(
        (q, idx) =>
          `${idx + 1}. [${q.importance.toUpperCase()}] ${q.question}\n` +
          (q.suggestedAnswers
            ? q.suggestedAnswers.map((a) => `   - ${a}`).join('\n')
            : '')
      )
      .join('\n\n')

    navigator.clipboard.writeText(
      `### Project Discovery & Scoping Questionnaire\nPrepared for: ${proposal.formData.step1.clientCompany}\nProject: ${proposal.formData.step1.projectName}\n\n${text}`
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Questionnaire copied to clipboard!')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border bg-card p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-primary border border-primary/20">
              <FileQuestion className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                AI Discovery &amp; Intake Questionnaire
              </h2>
              <p className="text-xs text-muted-foreground">
                Strategic scoping questions to clarify project requirements and eliminate assumptions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {questions.length} tailored discovery questions generated for{' '}
            <strong className="text-foreground">{proposal.formData.step1.projectType}</strong>
          </span>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleRegenerateQuestions}
              disabled={isGenerating}
              className="gap-1.5 text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              Regenerate
            </Button>
            <Button size="sm" onClick={handleCopyAll} className="gap-1.5 text-xs">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy Intake Form'}
            </Button>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-3.5">
          {questions.map((q, idx) => (
            <div key={q.id || idx} className="rounded-xl border bg-background/50 p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px]">
                    {idx + 1}
                  </span>
                  {q.question}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    q.importance === 'critical'
                      ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                      : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                  }`}
                >
                  {q.importance.toUpperCase()}
                </span>
              </div>

              {q.suggestedAnswers && q.suggestedAnswers.length > 0 && (
                <div className="pl-7 space-y-1 pt-1 text-[11px] text-muted-foreground">
                  <span className="text-[10px] uppercase font-semibold text-zinc-500">
                    Typical Options:
                  </span>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {q.suggestedAnswers.map((ans, aIdx) => (
                      <li key={aIdx}>{ans}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-3 border-t">
          <Button size="sm" onClick={onClose} className="text-xs">
            Done
          </Button>
        </div>
      </div>
    </div>
  )
}
