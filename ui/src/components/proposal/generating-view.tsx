import { useEffect, useState } from 'react'
import { Check, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

const messages = [
  'Analyzing project requirements and business goals...',
  'Crafting personalized executive summary...',
  'Defining comprehensive scope of work...',
  'Structuring milestone phases and timeline...',
  'Calculating itemized investment breakdown...',
  'Finalizing proposal terms and next steps...',
]

export function GeneratingView({
  error,
  onRetry,
}: {
  error?: string | null
  onRetry: () => void
}) {
  const [visibleSteps, setVisibleSteps] = useState(1)
  const [progress, setProgress] = useState(8)

  useEffect(() => {
    const stepTimer = window.setInterval(
      () => setVisibleSteps((value) => Math.min(messages.length, value + 1)),
      2200
    )
    const progressTimer = window.setInterval(
      () => setProgress((value) => Math.min(94, value + 6)),
      800
    )
    return () => {
      window.clearInterval(stepTimer)
      window.clearInterval(progressTimer)
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-xl text-center">
        {!error ? (
          <>
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
            <h2 className="mt-5 text-lg font-semibold tracking-tight">Generating your proposal...</h2>
            <div className="mt-5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-6 space-y-2.5 text-left">
              {messages.slice(0, visibleSteps).map((message, idx) => (
                <div
                  key={message}
                  className="flex items-center gap-3 rounded-lg border bg-background px-3.5 py-2.5 text-xs md:text-sm font-medium animate-in fade-in"
                >
                  <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                  <span className="text-foreground">{message}</span>
                </div>
              ))}
            </div>
            <p className="mt-5 text-xs text-muted-foreground">Powered by Anna Platform Executa</p>
          </>
        ) : (
          <div className="text-left space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="h-6 w-6" />
              <h2 className="text-lg font-semibold">Generation Failed</h2>
            </div>
            <p className="text-sm text-muted-foreground bg-red-50 dark:bg-red-950/40 p-3 rounded border border-red-200 dark:border-red-900">
              {error}
            </p>
            <div className="flex justify-end pt-2">
              <Button onClick={onRetry} variant="primary">
                Try Again
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
