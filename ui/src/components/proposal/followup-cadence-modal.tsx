import React, { useState } from 'react'
import {
  Send,
  X,
  Copy,
  Check,
  Mail,
  Calendar,
  Sparkles,
  ExternalLink,
  Clock,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GeneratedProposal } from '@/types'
import { formatCurrency, calculatePricingTotals } from '@/utils'

interface FollowUpCadenceModalProps {
  isOpen: boolean
  onClose: () => void
  proposal: GeneratedProposal
  toast?: {
    success: (msg: string) => void
    error: (msg: string) => void
  }
}

type CadenceTone = 'executive' | 'consultative' | 'concise'

interface Touchpoint {
  stage: string
  day: string
  label: string
  subject: (data: Record<string, string>) => string
  body: (data: Record<string, string>, tone: CadenceTone) => string
}

const TOUCHPOINTS: Touchpoint[] = [
  {
    stage: 'Touch 1',
    day: 'Day 0 (Initial Send)',
    label: 'Proposal Delivery & Executive Presentation',
    subject: (d) => `Proposal: ${d.proposalTitle} — Prepared for ${d.clientName}`,
    body: (d, tone) => {
      if (tone === 'concise') {
        return `Hi ${d.clientName},\n\nAttached is our comprehensive proposal for "${d.proposalTitle}".\n\nTotal Investment: ${d.pricingTotal}\nValid Until: ${d.validUntil}\n\nPlease review our scope, timeline, and 3-tier package options when you have a moment. Let me know if you would like to schedule a 15-minute walkthrough.\n\nBest regards,\n${d.agencyName}`
      }
      if (tone === 'consultative') {
        return `Hi ${d.clientName},\n\nIt was a pleasure discussing your vision for ${d.companyName}. Following our discovery conversation, I have prepared a tailored proposal for "${d.proposalTitle}".\n\nKey Highlights of this Engagement:\n• Tailored architecture & deliverables specifically designed for your goals\n• Transparent 3-tier scope options (${d.pricingTotal})\n• Defined milestone timeline with guaranteed delivery checkpoints\n\nYou can review the complete document, explore the slide deck, and sign digitally whenever convenient.\n\nWould Thursday or Friday afternoon work for a quick 15-minute alignment call to address any initial questions?\n\nWarm regards,\n${d.agencyName}`
      }
      return `Dear ${d.clientName},\n\nWe are pleased to submit our formal commercial proposal for "${d.proposalTitle}".\n\nThis proposal outlines our strategic approach, deliverable specifications, project governance, and tiered commercial investment (${d.pricingTotal}). All terms and pricing remain valid through ${d.validUntil}.\n\nWe welcome your review and look forward to finalizing the kickoff agenda.\n\nSincerely,\n${d.agencyName}`
    },
  },
  {
    stage: 'Touch 2',
    day: 'Day 3',
    label: 'Value Check-in & Package Selection',
    subject: (d) => `Quick Check-in: ${d.proposalTitle} for ${d.companyName}`,
    body: (d, tone) => {
      if (tone === 'concise') {
        return `Hi ${d.clientName},\n\nJust checking in on the "${d.proposalTitle}" proposal sent earlier this week. Have you had a chance to review the 3-tier pricing options?\n\nHappy to answer any questions or adjust scope.\n\nBest,\n${d.agencyName}`
      }
      if (tone === 'consultative') {
        return `Hi ${d.clientName},\n\nI hope your week is going smoothly!\n\nI wanted to check in to see if you and the ${d.companyName} leadership team have had an opportunity to review our proposal for "${d.proposalTitle}".\n\nMany clients find the 3-tier scope selector particularly helpful for tailoring the investment to immediate Q1 priorities. If you'd like to adjust specific deliverables or milestone allocations, we can refine them immediately.\n\nLet me know your thoughts!\n\nBest regards,\n${d.agencyName}`
      }
      return `Dear ${d.clientName},\n\nI am writing to confirm receipt of our proposal for "${d.proposalTitle}" delivered on ${d.generatedDate}.\n\nShould you require any clarifications regarding our scope, SLA commitments, or payment terms, our technical team is available to assist.\n\nRespectfully,\n${d.agencyName}`
    },
  },
  {
    stage: 'Touch 3',
    day: 'Day 7',
    label: 'Technical Q&A & Objection Handling',
    subject: (d) => `Feedback & Q&A: Next Steps on ${d.proposalTitle}`,
    body: (d, tone) => {
      if (tone === 'concise') {
        return `Hi ${d.clientName},\n\nFollowing up on our proposal. Do you have any technical questions or feedback from your stakeholders?\n\nWe have team availability reserved starting next sprint if you're ready to proceed.\n\nBest,\n${d.agencyName}`
      }
      if (tone === 'consultative') {
        return `Hi ${d.clientName},\n\nAs you evaluate the "${d.proposalTitle}" roadmap, I wanted to offer a quick technical alignment session. Often at this stage, questions arise around team bandwidth, third-party integrations, or phase 1 launch timelines.\n\nWe have pre-allocated our senior engineering lead for this sprint, and we want to ensure ${d.companyName}'s launch milestones remain right on schedule.\n\nWould 10 minutes tomorrow morning be helpful to address any open items?\n\nWarm regards,\n${d.agencyName}`
      }
      return `Dear ${d.clientName},\n\nAs we approach the mid-point of the proposal review period for "${d.proposalTitle}", please let us know if additional documentation or security compliance data is required for your procurement approval.\n\nWe remain committed to meeting your target rollout timeline.\n\nSincerely,\n${d.agencyName}`
    },
  },
  {
    stage: 'Touch 4',
    day: 'Day 10',
    label: 'Urgency & Schedule Lock',
    subject: (d) => `Timeline Update: Securing Sprint Capacity for ${d.proposalTitle}`,
    body: (d, tone) => {
      if (tone === 'concise') {
        return `Hi ${d.clientName},\n\nOur current sprint allocation closes at the end of the week. To hold our target delivery date for "${d.proposalTitle}", please let us know if you plan to move forward before ${d.validUntil}.\n\nBest,\n${d.agencyName}`
      }
      if (tone === 'consultative') {
        return `Hi ${d.clientName},\n\nI wanted to provide a quick scheduling update. Our engineering capacity for the upcoming kickoff cycle is filling up rapidly, and I want to make sure we reserve priority team availability for ${d.companyName}.\n\nOur proposal terms and scheduled delivery date remain reserved through ${d.validUntil}.\n\nIf you are ready to proceed, you can sign directly via the digital link, or reply with any final adjustments. Excited about the prospect of building this together!\n\nBest regards,\n${d.agencyName}`
      }
      return `Dear ${d.clientName},\n\nThis is a brief advisory that our commercial terms for "${d.proposalTitle}" expire on ${d.validUntil}. In order to guarantee the agreed delivery timeline and resource allocations, kindly execute the digital signoff prior to expiry.\n\nSincerely,\n${d.agencyName}`
    },
  },
  {
    stage: 'Touch 5',
    day: 'Day 14',
    label: 'Closing & Welcome Onboarding Kickoff',
    subject: (d) => `Final Check: Moving forward with ${d.proposalTitle}`,
    body: (d, tone) => {
      if (tone === 'concise') {
        return `Hi ${d.clientName},\n\nToday is the final day of our proposal validity for "${d.proposalTitle}". Should we hold your kickoff slot, or would you prefer to revisit this next quarter?\n\nBest,\n${d.agencyName}`
      }
      if (tone === 'consultative') {
        return `Hi ${d.clientName},\n\nI hope all is well! Today marks the end of our formal proposal validity window for "${d.proposalTitle}".\n\nI know timing and priorities evolve, so I wanted to ask: should we keep your project kickoff on our radar for this month, or would it make more sense to reconnect in a few months?\n\nEither way, thank you for considering us. Looking forward to your guidance!\n\nWarm regards,\n${d.agencyName}`
      }
      return `Dear ${d.clientName},\n\nOur formal proposal for "${d.proposalTitle}" reaches its expiration date today (${d.validUntil}). Please confirm whether your organization wishes to finalize the agreement or archive the proposal for a subsequent review cycle.\n\nRespectfully,\n${d.agencyName}`
    },
  },
]

export const FollowUpCadenceModal: React.FC<FollowUpCadenceModalProps> = ({
  isOpen,
  onClose,
  proposal,
  toast,
}) => {
  if (!isOpen) return null

  const [activeStep, setActiveStep] = useState<number>(0)
  const [tone, setTone] = useState<CadenceTone>('consultative')
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const totals = calculatePricingTotals(proposal.pricingStructure)
  const currency = proposal.pricingStructure?.currency || 'USD'
  const pricingFormatted = formatCurrency(totals.grandTotal > 0 ? totals.grandTotal : 10000, currency)

  const templateData: Record<string, string> = {
    clientName: proposal.formData?.step1?.clientName || 'Valued Client',
    companyName: proposal.formData?.step1?.clientCompany || 'your team',
    agencyName: proposal.brandConfig?.companyName || 'Our Agency',
    proposalTitle: proposal.title || 'Project Proposal',
    pricingTotal: pricingFormatted,
    validUntil: proposal.validUntil || 'in 14 days',
    generatedDate: proposal.generatedDate || 'recently',
  }

  const currentTouch = TOUCHPOINTS[activeStep]
  const currentSubject = currentTouch.subject(templateData)
  const currentBody = currentTouch.body(templateData, tone)

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    toast?.success('Copied to clipboard!')
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const handleCopyFullCadence = () => {
    const fullText = TOUCHPOINTS.map((touch) => {
      return `### ${touch.stage} (${touch.day}) — ${touch.label}\n**Subject:** ${touch.subject(templateData)}\n\n${touch.body(templateData, tone)}\n\n---\n`
    }).join('\n')

    navigator.clipboard.writeText(fullText)
    toast?.success('Complete 5-Touch Cadence copied to clipboard!')
  }

  const handleOpenMailto = () => {
    const mailto = `mailto:?subject=${encodeURIComponent(currentSubject)}&body=${encodeURIComponent(currentBody)}`
    window.open(mailto, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl rounded-2xl border bg-card p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                AI Sales Follow-Up Cadence &amp; Outreach Sequences
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-semibold">
                  5-Touch High Conversion
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Automated multi-stage follow-up emails customized to this proposal to turn silent clients into signed deals.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tone Selector & Cadence Timeline */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
          {/* Cadence Step Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {TOUCHPOINTS.map((touch, idx) => (
              <button
                key={touch.stage}
                onClick={() => setActiveStep(idx)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  activeStep === idx
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <span>{touch.stage}</span>
                <span className="opacity-70 text-[10px]">({touch.day})</span>
              </button>
            ))}
          </div>

          {/* Tone Selector */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border">
            {(['consultative', 'executive', 'concise'] as CadenceTone[]).map((t) => (
              <button
                key={t}
                onClick={() => setTone(t)}
                className={`rounded-md px-2.5 py-1 text-xs capitalize transition ${
                  tone === t ? 'bg-background text-foreground font-bold shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Active Stage Header */}
        <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">
                {currentTouch.stage} • {currentTouch.day}
              </span>
              <h3 className="text-base font-bold text-foreground mt-0.5">{currentTouch.label}</h3>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleOpenMailto} title="Open in default email app">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Open Email Client
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopy(`${currentSubject}\n\n${currentBody}`, activeStep)}
              >
                {copiedIndex === activeStep ? (
                  <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                )}
                Copy Email
              </Button>
            </div>
          </div>

          {/* Subject Line Field */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase text-muted-foreground">Subject Line</span>
            <div className="flex items-center justify-between rounded-lg border bg-background px-3 py-2 text-xs font-medium">
              <span className="text-foreground">{currentSubject}</span>
              <button
                onClick={() => handleCopy(currentSubject, 999)}
                className="text-muted-foreground hover:text-foreground p-1"
                title="Copy Subject"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Email Body */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase text-muted-foreground">Message Body</span>
            <pre className="whitespace-pre-wrap rounded-lg border bg-background p-4 text-xs font-sans text-foreground leading-relaxed">
              {currentBody}
            </pre>
          </div>
        </div>

        {/* Footer info & Bulk Copy */}
        <div className="flex items-center justify-between border-t pt-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>Variables auto-injected: Client, Company, Pricing (${pricingFormatted}), &amp; Dates</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyFullCadence}>
              <Copy className="h-3.5 w-3.5 mr-1.5" />
              Copy All 5 Touches (Cadence Kit)
            </Button>
            <Button size="sm" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
