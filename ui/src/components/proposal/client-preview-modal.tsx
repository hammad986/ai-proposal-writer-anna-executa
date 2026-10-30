import { useState, useEffect } from 'react'
import {
  CheckCircle2,
  Download,
  Eye,
  FileCheck,
  MessageSquare,
  ShieldCheck,
  X,
  Sparkles,
  Lock,
  KeyRound,
  ShieldAlert,
  FileText,
  TrendingUp,
  FileDown,
  Globe,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  calculatePricingTotals,
  formatCurrency,
  downloadFile,
  exportProposalAsHtml,
  exportProposalAsMarkdown,
} from '@/utils'
import { generateProposalPdf } from '@/pdf-generator'
import type { GeneratedProposal, PricingStructure } from '@/types'

export function ClientPreviewModal({
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
  const [activePricing, setActivePricing] = useState<PricingStructure>(() => {
    return (
      proposal.pricingStructure || {
        pricingModel: 'fixed',
        currency: 'USD',
        items: [],
        taxPercent: 0,
        discountPercent: 0,
        paymentTerms: '',
        depositPercent: 40,
      }
    )
  })

  // Signoff form state
  const [signerName, setSignerName] = useState(proposal.formData.step1.clientName || '')
  const [signerEmail, setSignerEmail] = useState('')
  const [signerTitle, setSignerTitle] = useState('Authorized Decision Maker')
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [revisionNotes, setRevisionNotes] = useState('')
  const [showRevisionForm, setShowRevisionForm] = useState(false)

  // Security & Passcode state
  const hasPasscode = Boolean(proposal.security?.requirePasscode && proposal.security?.passcode)
  const [isUnlocked, setIsUnlocked] = useState(!hasPasscode)
  const [passcodeAttempt, setPasscodeAttempt] = useState('')
  const [passcodeError, setPasscodeError] = useState(false)

  // NDA state
  const hasNda = Boolean(proposal.security?.requireNdaAgreement)
  const [ndaAccepted, setNdaAccepted] = useState(!hasNda)

  // Record Telemetry on Mount
  useEffect(() => {
    if (proposal.analytics) {
      const current = proposal.analytics
      const updated = {
        ...current,
        totalViews: current.totalViews + 1,
        uniqueViewers: current.uniqueViewers === 0 ? 1 : current.uniqueViewers,
        lastViewedAt: new Date().toISOString(),
        timelineEvents: [
          {
            id: `evt_${Date.now()}`,
            eventType: 'opened' as const,
            description: 'Proposal opened in interactive Client Presentation Mode',
            timestamp: new Date().toISOString(),
            clientDevice: 'Desktop Browser',
          },
          ...current.timelineEvents,
        ],
      }
      onUpdateProposal({
        ...proposal,
        analytics: updated,
      })
    }
  }, [])

  const totals = calculatePricingTotals(activePricing)

  const handleUnlockWithPasscode = () => {
    if (passcodeAttempt.trim() === proposal.security?.passcode?.trim()) {
      setIsUnlocked(true)
      setPasscodeError(false)
      toast.success('Passcode verified! Proposal unlocked.')
    } else {
      setPasscodeError(true)
      toast.error('Incorrect passcode. Please check with the sender.')
    }
  }

  const handleToggleOptionalItem = (itemId: string) => {
    const updatedItems = activePricing.items.map((it) =>
      it.id === itemId ? { ...it, isSelected: !it.isSelected } : it
    )
    const updatedPricing = {
      ...activePricing,
      items: updatedItems,
    }
    setActivePricing(updatedPricing)

    // Update parent proposal
    const recalculated = calculatePricingTotals(updatedPricing)
    const newTotalStr = formatCurrency(recalculated.grandTotal, updatedPricing.currency)
    onUpdateProposal({
      ...proposal,
      pricingStructure: updatedPricing,
      totalValue: newTotalStr,
      updatedAt: new Date().toISOString(),
    })
  }

  const handleAcceptProposal = () => {
    if (!signerName.trim()) {
      toast.error('Please enter your full name for sign-off.')
      return
    }
    if (!isConfirmed) {
      toast.error('Please accept the confirmation checkbox.')
      return
    }

    const grandTotalStr = formatCurrency(totals.grandTotal, activePricing.currency)
    const nowIso = new Date().toISOString()

    const signoffData = {
      signerName: signerName.trim(),
      signerEmail: signerEmail.trim(),
      signerTitle: signerTitle.trim(),
      signedAt: nowIso,
      acceptedTotal: grandTotalStr,
      notes: 'Formally accepted via client review portal',
    }

    const newHistory = [
      ...(proposal.statusHistory || []),
      {
        status: 'accepted' as const,
        timestamp: nowIso,
        note: `Proposal accepted by ${signerName.trim()} (${signerTitle.trim()}) for ${grandTotalStr}`,
      },
    ]

    const updated: GeneratedProposal = {
      ...proposal,
      status: 'accepted',
      signoff: signoffData,
      statusHistory: newHistory,
      totalValue: grandTotalStr,
      updatedAt: nowIso,
    }

    onUpdateProposal(updated)
    toast.success('Proposal successfully accepted and executed!')
    onClose()
  }

  const handleRequestRevision = () => {
    if (!revisionNotes.trim()) {
      toast.error('Please provide revision notes.')
      return
    }

    const nowIso = new Date().toISOString()
    const newHistory = [
      ...(proposal.statusHistory || []),
      {
        status: 'review' as const,
        timestamp: nowIso,
        note: `Client requested revisions: ${revisionNotes.trim()}`,
      },
    ]

    const updated: GeneratedProposal = {
      ...proposal,
      status: 'review',
      statusHistory: newHistory,
      updatedAt: nowIso,
    }

    onUpdateProposal(updated)
    toast.success('Revision request logged successfully!')
    setShowRevisionForm(false)
  }

  // 1. Passcode Lock Screen
  if (!isUnlocked) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
        <div className="w-full max-w-md p-8 rounded-2xl bg-zinc-950 border border-zinc-800 text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-white">Confidential Proposal</h3>
            <p className="text-xs text-zinc-400">
              This document is protected with a security passcode set by the sender.
            </p>
          </div>

          <div className="space-y-2">
            <input
              type="password"
              value={passcodeAttempt}
              onChange={(e) => setPasscodeAttempt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUnlockWithPasscode()}
              placeholder="Enter passcode to unlock..."
              className={`w-full py-2.5 px-4 rounded-xl bg-zinc-900 border text-sm text-center text-white placeholder-zinc-500 focus:outline-none transition-colors ${
                passcodeError ? 'border-rose-500' : 'border-zinc-800 focus:border-indigo-500'
              }`}
            />
            {passcodeError && (
              <p className="text-xs text-rose-400">Incorrect passcode. Please try again.</p>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUnlockWithPasscode}
              className="w-1/2 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white transition-colors shadow-sm"
            >
              Unlock Proposal
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 2. NDA Acceptance Gate
  if (!ndaAccepted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
        <div className="w-full max-w-lg p-8 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-5 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Mutual Confidentiality Agreement</h3>
              <p className="text-xs text-zinc-400">Please review before accessing proprietary proposal details</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 leading-relaxed max-h-48 overflow-y-auto">
            {proposal.security?.ndaText ||
              'This document contains proprietary commercial terms and technical specifications. By accepting, you agree to preserve its confidentiality.'}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Decline
            </button>
            <button
              type="button"
              onClick={() => {
                setNdaAccepted(true)
                toast.success('Confidentiality terms accepted')
              }}
              className="w-2/3 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              I Agree &amp; View Proposal
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-xl border bg-background shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Top Floating Client Toolbar */}
        <div className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/95 px-6 py-3.5 backdrop-blur flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-7 items-center rounded-full bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              Client Presentation Mode
            </span>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Interactive review &amp; dynamic quotation
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              title="Download clean Markdown file"
              onClick={() => {
                try {
                  const md = exportProposalAsMarkdown(proposal)
                  downloadFile(md, `${proposal.title.replace(/[^a-zA-Z0-9]/g, '_')}.md`, 'text/markdown')
                  toast.success('Markdown file downloaded')
                } catch {
                  toast.error('Failed to export Markdown')
                }
              }}
            >
              <FileText className="h-3.5 w-3.5 mr-1" />
              Markdown
            </Button>

            <Button
              size="sm"
              variant="outline"
              title="Download standalone HTML presentation"
              onClick={() => {
                try {
                  const html = exportProposalAsHtml(proposal)
                  downloadFile(html, `${proposal.title.replace(/[^a-zA-Z0-9]/g, '_')}.html`, 'text/html')
                  toast.success('Standalone HTML deck downloaded')
                } catch {
                  toast.error('Failed to export HTML')
                }
              }}
            >
              <Globe className="h-3.5 w-3.5 mr-1" />
              HTML Deck
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                try {
                  generateProposalPdf(proposal)
                  toast.success('Proposal PDF downloaded')
                } catch {
                  toast.error('Failed to generate PDF')
                }
              }}
            >
              <Download className="h-4 w-4 mr-1.5" />
              Download PDF
            </Button>

            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Document Body */}
        <div className="px-6 pb-8 space-y-8 max-w-3xl mx-auto">
          {/* Confidentiality Watermark Banner */}
          {proposal.security?.watermarkConfidential && (
            <div className="py-2 px-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center text-xs font-bold uppercase tracking-widest text-amber-500 flex items-center justify-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              Confidential &bull; Do Not Distribute
            </div>
          )}

          {/* Header Banner */}
          <div className="border-b pb-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                {proposal.formData.step1.agencyName || 'Software Agency'}
              </span>
              <span className="text-xs text-muted-foreground">
                Valid until {proposal.validUntil}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {proposal.title}
            </h1>
            <p className="text-sm text-muted-foreground">{proposal.subtitle}</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t text-xs">
              <div>
                <span className="block text-muted-foreground uppercase text-[10px]">Client Contact</span>
                <span className="font-semibold text-foreground">
                  {proposal.formData.step1.clientName || 'Client'}
                </span>
              </div>
              <div>
                <span className="block text-muted-foreground uppercase text-[10px]">Company</span>
                <span className="font-semibold text-foreground">
                  {proposal.formData.step1.clientCompany || 'Client Co'}
                </span>
              </div>
              <div>
                <span className="block text-muted-foreground uppercase text-[10px]">Date Prepared</span>
                <span className="font-semibold text-foreground">{proposal.generatedDate}</span>
              </div>
              <div>
                <span className="block text-muted-foreground uppercase text-[10px]">Investment Value</span>
                <span className="font-bold text-primary">
                  {formatCurrency(totals.grandTotal, activePricing.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Sections Viewer */}
          <div className="space-y-6">
            {proposal.sections.map((section) => (
              <div key={section.id} className="space-y-2.5">
                <h3 className="text-base font-bold text-foreground border-l-3 border-primary pl-3">
                  {section.title}
                </h3>
                <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap pl-3">
                  {section.content}
                </div>
              </div>
            ))}
          </div>

          {/* Estimated ROI & Payback Analysis */}
          {proposal.roiEstimation && (
            <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">Projected Return on Investment (ROI)</h3>
                    <p className="text-xs text-muted-foreground">
                      Quantitative financial modeling of efficiency gains and operational cost savings
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  {proposal.roiEstimation.paybackMonths} Mo Payback
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                <div className="p-3 rounded-lg bg-card/60 border border-border">
                  <span className="block text-muted-foreground text-[10px] uppercase font-semibold">Hours Saved / Mo</span>
                  <span className="text-base font-bold text-foreground">{proposal.roiEstimation.hoursSavedPerMonth} hrs/mo</span>
                </div>

                <div className="p-3 rounded-lg bg-card/60 border border-border">
                  <span className="block text-muted-foreground text-[10px] uppercase font-semibold">Annual Cost Savings</span>
                  <span className="text-base font-bold text-emerald-500">
                    {formatCurrency(proposal.roiEstimation.annualCostSavings, activePricing.currency)}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-card/60 border border-border">
                  <span className="block text-muted-foreground text-[10px] uppercase font-semibold">Payback Period</span>
                  <span className="text-base font-bold text-amber-500">{proposal.roiEstimation.paybackMonths} Months</span>
                </div>

                <div className="p-3 rounded-lg bg-card/60 border border-border">
                  <span className="block text-muted-foreground text-[10px] uppercase font-semibold">3-Year Net ROI</span>
                  <span className="text-base font-bold text-indigo-400">
                    {formatCurrency(proposal.roiEstimation.threeYearNetRoi, activePricing.currency)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Pricing Section (Dynamic Add-on recalculation) */}
          {activePricing.items.length > 0 && (
            <div className="rounded-xl border bg-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-foreground">Itemized Investment &amp; Options</h3>
                  <p className="text-xs text-muted-foreground">
                    Review deliverables. You can toggle optional add-ons to customize your scope.
                  </p>
                </div>
                <span className="text-sm font-bold text-primary">
                  {formatCurrency(totals.grandTotal, activePricing.currency)}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="border-b bg-muted/40 uppercase text-muted-foreground">
                    <tr>
                      <th className="py-2.5 px-3">Deliverable Item</th>
                      <th className="py-2.5 px-2 text-center">Qty</th>
                      <th className="py-2.5 px-2 text-right">Rate</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {activePricing.items.map((it) => {
                      const lineTotal = (it.quantity || 1) * (it.unitRate || 0)
                      return (
                        <tr key={it.id} className="hover:bg-muted/20">
                          <td className="py-2.5 px-3">
                            <div className="flex items-start gap-2">
                              {it.isOptional && (
                                <input
                                  type="checkbox"
                                  checked={Boolean(it.isSelected)}
                                  onChange={() => handleToggleOptionalItem(it.id)}
                                  className="mt-0.5 rounded text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
                                />
                              )}
                              <div>
                                <span className="font-medium text-foreground">{it.title}</span>
                                {it.isOptional && (
                                  <span className="ml-2 rounded-full bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.2 text-[10px] text-primary font-semibold">
                                    Optional Add-on
                                  </span>
                                )}
                                {it.description && (
                                  <p className="text-[11px] text-muted-foreground">{it.description}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-center text-muted-foreground">
                            {it.quantity}
                          </td>
                          <td className="py-2.5 px-2 text-right text-muted-foreground">
                            {formatCurrency(it.unitRate, activePricing.currency)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold text-foreground">
                            {formatCurrency(lineTotal, activePricing.currency)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Total Calculation Strip */}
              <div className="border-t pt-3 flex flex-col items-end gap-1 text-xs">
                <div className="flex justify-between w-64 text-muted-foreground">
                  <span>Selected Total:</span>
                  <span>{formatCurrency(totals.selectedTotal, activePricing.currency)}</span>
                </div>
                {totals.discountAmount > 0 && (
                  <div className="flex justify-between w-64 text-emerald-600">
                    <span>Discount ({activePricing.discountPercent}%):</span>
                    <span>-{formatCurrency(totals.discountAmount, activePricing.currency)}</span>
                  </div>
                )}
                {totals.taxAmount > 0 && (
                  <div className="flex justify-between w-64 text-muted-foreground">
                    <span>Tax ({activePricing.taxPercent}%):</span>
                    <span>+{formatCurrency(totals.taxAmount, activePricing.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between w-64 text-sm font-bold text-foreground border-t pt-1.5">
                  <span>Authorized Grand Total:</span>
                  <span className="text-primary">
                    {formatCurrency(totals.grandTotal, activePricing.currency)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Digital Acceptance / Revision Box */}
          <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Authorization &amp; Digital Sign-Off
                </h3>
                <p className="text-xs text-muted-foreground">
                  Formalize project engagement by executing digital sign-off below.
                </p>
              </div>

              {proposal.signoff && (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" /> Signed on {proposal.signoff.signedAt.slice(0, 10)}
                </span>
              )}
            </div>

            {!proposal.signoff && (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-muted-foreground mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full rounded-md border bg-background px-3 py-1.5 text-xs text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-muted-foreground mb-1">
                      Business Email
                    </label>
                    <input
                      type="email"
                      value={signerEmail}
                      onChange={(e) => setSignerEmail(e.target.value)}
                      placeholder="jane@company.com"
                      className="w-full rounded-md border bg-background px-3 py-1.5 text-xs text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-muted-foreground mb-1">
                      Job Title / Authority
                    </label>
                    <input
                      type="text"
                      value={signerTitle}
                      onChange={(e) => setSignerTitle(e.target.value)}
                      placeholder="VP of Operations"
                      className="w-full rounded-md border bg-background px-3 py-1.5 text-xs text-foreground"
                    />
                  </div>
                </div>

                <label className="flex items-start gap-2 text-xs text-foreground/90 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={isConfirmed}
                    onChange={(e) => setIsConfirmed(e.target.checked)}
                    className="mt-0.5 rounded text-primary focus:ring-primary h-4 w-4"
                  />
                  <span>
                    I confirm my authority to accept this project proposal and agree to the scope, investment schedule of{' '}
                    <strong>{formatCurrency(totals.grandTotal, activePricing.currency)}</strong>, and governance terms outlined herein.
                  </span>
                </label>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setShowRevisionForm(!showRevisionForm)}
                    className="text-xs text-muted-foreground hover:text-foreground underline flex items-center gap-1 cursor-pointer"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Request scope or pricing revisions instead
                  </button>

                  <Button onClick={handleAcceptProposal} disabled={!isConfirmed || !signerName.trim()}>
                    <FileCheck className="h-4 w-4 mr-1.5" />
                    Accept &amp; Authorize Proposal
                  </Button>
                </div>

                {showRevisionForm && (
                  <div className="rounded-lg border bg-background p-4 space-y-3 mt-3">
                    <h4 className="text-xs font-semibold text-foreground">Requested Revisions</h4>
                    <textarea
                      rows={3}
                      value={revisionNotes}
                      onChange={(e) => setRevisionNotes(e.target.value)}
                      placeholder="Specify deliverables or commercial terms you would like adjusted..."
                      className="w-full rounded-md border p-2 text-xs text-foreground"
                    />
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => setShowRevisionForm(false)}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleRequestRevision}>
                        Submit Revision Request
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
