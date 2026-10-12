import { useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FormStep1View } from '@/components/proposal/form-step-1'
import { FormStep2View } from '@/components/proposal/form-step-2'
import { FormStep3View } from '@/components/proposal/form-step-3'
import { FormStep4View } from '@/components/proposal/form-step-4'
import { GeneratingView } from '@/components/proposal/generating-view'
import { StepIndicator } from '@/components/proposal/step-indicator'
import { invokeExecutaTool } from '@/anna-bridge'
import { emptyFormData } from '@/defaults'
import { formatLocalDate, addDaysToIso } from '@/utils'
import type { GeneratedProposal, ProposalFormData } from '@/types'

function mergeDraft(draft?: Partial<ProposalFormData>): ProposalFormData {
  return {
    step1: { ...emptyFormData.step1, ...(draft?.step1 || {}) },
    step2: { ...emptyFormData.step2, ...(draft?.step2 || {}) },
    step3: { ...emptyFormData.step3, ...(draft?.step3 || {}) },
    step4: { ...emptyFormData.step4, ...(draft?.step4 || {}) },
  }
}

function validateStep(step: number, data: ProposalFormData): Record<string, string> {
  const errors: Record<string, string> = {}
  if (step === 1) {
    if (!data.step1.agencyName.trim()) errors.agencyName = 'Agency name is required.'
    if (!data.step1.clientName.trim()) errors.clientName = 'Client contact name is required.'
    if (!data.step1.projectName.trim()) errors.projectName = 'Project name is required.'
    if (data.step1.problemStatement.trim().length < 50) {
      errors.problemStatement = 'Please provide at least 50 characters describing the problem.'
    }
  }
  if (step === 2) {
    if (!data.step2.keyFeatures.trim()) errors.keyFeatures = 'Add at least one feature deliverable.'
    if (!data.step2.targetUsers.trim()) errors.targetUsers = 'Target user definition is required.'
  }
  if (step === 4 && (!data.step4.includedSections || data.step4.includedSections.length === 0)) {
    errors.includedSections = 'Select at least one section to include.'
  }
  return errors
}

export function NewProposalView({
  initialDraft,
  onSaveDraft,
  onProposalGenerated,
  onNavigate,
  toast,
}: {
  initialDraft?: Partial<ProposalFormData>
  onSaveDraft: (draft: ProposalFormData) => void
  onProposalGenerated: (proposal: GeneratedProposal) => void
  onNavigate: (route: string, proposalId?: string) => void
  toast: {
    success: (msg: string) => void
    error: (msg: string) => void
  }
}) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<ProposalFormData>(() => mergeDraft(initialDraft))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const lastSubmitted = useRef<ProposalFormData | null>(null)

  const stepTitles = ['Project Basics', 'Scope & Requirements', 'Pricing & Timeline', 'Tone & Style']
  const title = useMemo(() => stepTitles[currentStep - 1], [currentStep])

  const patchStep = <T extends keyof ProposalFormData>(step: T, patch: Partial<ProposalFormData[T]>) => {
    setFormData((prev) => {
      const updated = {
        ...prev,
        [step]: {
          ...prev[step],
          ...patch,
        },
      }
      onSaveDraft(updated)
      return updated
    })
    setErrors({})
  }

  const handleNext = () => {
    const nextErrors = validateStep(currentStep, formData)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    setCurrentStep((prev) => Math.min(4, prev + 1))
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1))
  }

  const handleSubmit = async (data = formData) => {
    const nextErrors = validateStep(4, data)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setIsGenerating(true)
    setGenerationError(null)
    lastSubmitted.current = data
    const startTime = Date.now()

    try {
      const response = await invokeExecutaTool<{ proposal: GeneratedProposal }>(
        'generate_proposal',
        { formData: data }
      )

      if (!response?.proposal) {
        throw new Error('Executa did not return a valid proposal structure.')
      }

      let proposal = response.proposal
      const todayStr = formatLocalDate(new Date())
      const defaultValidUntil = addDaysToIso(todayStr, 30)

      // Defense-in-depth: Ensure generatedDate is valid and current, and validUntil reflects the 30-day window
      if (
        !proposal.generatedDate ||
        proposal.generatedDate < todayStr ||
        !/^\d{4}-\d{2}-\d{2}$/.test(proposal.generatedDate)
      ) {
        proposal = {
          ...proposal,
          generatedDate: todayStr,
          validUntil: defaultValidUntil,
        }
      } else if (
        !proposal.validUntil ||
        proposal.validUntil <= proposal.generatedDate ||
        !/^\d{4}-\d{2}-\d{2}$/.test(proposal.validUntil)
      ) {
        proposal = {
          ...proposal,
          validUntil: addDaysToIso(proposal.generatedDate, 30),
        }
      }

      // Keep minimum smooth generation animation time (approx 3.5s)
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, 3500 - elapsed)

      setTimeout(() => {
        setIsGenerating(false)
        onProposalGenerated(proposal)
        toast.success('Proposal successfully generated!')
        onNavigate('detail', proposal.id)
      }, remaining)
    } catch (err: any) {
      console.error('Proposal generation error:', err)
      setIsGenerating(false)
      setGenerationError(err.message || 'Unable to generate proposal. Please try again.')
      toast.error(err.message || 'Generation failed')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <header className="sticky top-0 z-20 grid min-h-20 items-center gap-4 border-b bg-background/95 px-4 py-4 backdrop-blur md:grid-cols-[1fr_2fr_1fr] md:px-8">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Proposals
        </button>

        <StepIndicator currentStep={currentStep} />

        <div className="hidden md:flex justify-end items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>AI Proposal Writer</span>
        </div>
      </header>

      {/* Main Form Content */}
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Card className="shadow-md">
          <CardHeader className="border-b bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Step {currentStep} of 4
                </span>
                <CardTitle className="text-xl mt-1">{title}</CardTitle>
              </div>
              <span className="text-xs text-muted-foreground hidden sm:block">
                Auto-saved to Anna Storage
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {currentStep === 1 && (
              <FormStep1View
                data={formData.step1}
                errors={errors}
                onChange={(patch) => patchStep('step1', patch)}
              />
            )}
            {currentStep === 2 && (
              <FormStep2View
                data={formData.step2}
                errors={errors}
                onChange={(patch) => patchStep('step2', patch)}
              />
            )}
            {currentStep === 3 && (
              <FormStep3View
                data={formData.step3}
                onChange={(patch) => patchStep('step3', patch)}
              />
            )}
            {currentStep === 4 && (
              <>
                <FormStep4View
                  data={formData.step4}
                  onChange={(patch) => patchStep('step4', patch)}
                />
                {errors.includedSections && (
                  <p className="mt-3 text-xs text-red-600">{errors.includedSections}</p>
                )}
              </>
            )}

            {/* Navigation buttons */}
            <div className="mt-8 flex items-center justify-between border-t pt-5">
              <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>
                <ArrowLeft className="h-4 w-4" />
                Previous Step
              </Button>

              {currentStep < 4 ? (
                <Button onClick={handleNext}>
                  Next Step
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={() => handleSubmit()} disabled={isGenerating}>
                  <Sparkles className="h-4 w-4" />
                  Generate Proposal
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Generating Overlay */}
      {isGenerating && (
        <GeneratingView
          error={generationError}
          onRetry={() => lastSubmitted.current && handleSubmit(lastSubmitted.current)}
        />
      )}
    </div>
  )
}
