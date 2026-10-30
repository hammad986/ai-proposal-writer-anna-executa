import { useState } from 'react'
import {
  CheckCircle2,
  Download,
  Eye,
  FileCheck,
  MessageSquare,
  ShieldCheck,
  X,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { calculatePricingTotals, formatCurrency } from '@/utils'
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

  const totals = calculatePricingTotals(activePricing)

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-xl border bg-background shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Top Floating Client Toolbar */}
        <div className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/95 px-6 py-3.5 backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="flex h-7 items-center rounded-full bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              Client Presentation Mode
            </span>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Interactive review &amp; dynamic quotation
            </span>
          </div>

          <div className="flex items-center gap-2">
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
