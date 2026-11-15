import { useState, useEffect } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  X,
  FileText,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles,
  Presentation,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency, calculatePricingTotals } from '@/utils'
import type { GeneratedProposal } from '@/types'

interface PitchDeckModalProps {
  proposal: GeneratedProposal
  onClose: () => void
  toast: {
    success: (msg: string) => void
    error: (msg: string) => void
  }
}

interface SlideItem {
  id: string
  title: string
  category: string
  content: string
  type: 'cover' | 'section' | 'pricing' | 'roi'
}

export function PitchDeckModal({ proposal, onClose }: PitchDeckModalProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [showPresenterNotes, setShowPresenterNotes] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const totals = calculatePricingTotals(proposal.pricingStructure)
  const currency = proposal.pricingStructure?.currency || 'USD'

  // Construct Slides from Proposal
  const slides: SlideItem[] = [
    {
      id: 'slide_cover',
      title: proposal.title,
      category: 'Executive Pitch Deck',
      content: proposal.subtitle,
      type: 'cover',
    },
    ...proposal.sections.map((s, idx) => ({
      id: `slide_sec_${idx}`,
      title: s.title,
      category: `Section ${idx + 1} of ${proposal.sections.length}`,
      content: s.content,
      type: 'section' as const,
    })),
  ]

  if (proposal.pricingStructure && proposal.pricingStructure.items.length > 0) {
    slides.push({
      id: 'slide_pricing',
      title: 'Commercial Investment & Package Options',
      category: 'Investment Schedule',
      content: '',
      type: 'pricing',
    })
  }

  if (proposal.roiEstimation) {
    slides.push({
      id: 'slide_roi',
      title: 'Return on Investment (ROI) & Efficiency Modeling',
      category: 'Financial Value Proposition',
      content: '',
      type: 'roi',
    })
  }

  const currentSlide = slides[currentSlideIndex] || slides[0]

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        e.preventDefault()
        setCurrentSlideIndex((prev) => (prev < slides.length - 1 ? prev + 1 : prev))
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : prev))
      } else if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [slides.length, onClose])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  return (
    <div className="fixed inset-0 z-60 flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden select-none">
      {/* Top Deck Navigation Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800 bg-zinc-900/90 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Presentation className="h-4 w-4" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Client Pitch Presentation
            </span>
            <h2 className="text-sm font-semibold text-zinc-200 truncate max-w-sm">
              {proposal.title}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-zinc-400">
            Slide {currentSlideIndex + 1} of {slides.length}
          </span>

          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-8 border-zinc-700 bg-zinc-800 text-zinc-300 hover:text-white"
              onClick={() => setShowPresenterNotes(!showPresenterNotes)}
            >
              <FileText className="h-3.5 w-3.5 mr-1" />
              {showPresenterNotes ? 'Hide Notes' : 'Presenter Notes'}
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="h-8 border-zinc-700 bg-zinc-800 text-zinc-300 hover:text-white"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
            </Button>

            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-zinc-400 hover:text-white"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Slide Stage */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-4xl min-h-[460px] rounded-3xl border border-zinc-800 bg-zinc-900/50 p-10 md:p-14 shadow-2xl flex flex-col justify-between relative overflow-hidden backdrop-blur-sm">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          {/* Slide Header */}
          <div className="space-y-2 z-10">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
              {currentSlide.category}
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {currentSlide.title}
            </h1>
          </div>

          {/* Slide Body */}
          <div className="flex-1 py-6 z-10 text-zinc-300 text-sm sm:text-base leading-relaxed overflow-y-auto max-h-[380px]">
            {currentSlide.type === 'cover' && (
              <div className="space-y-8 my-auto pt-4">
                <p className="text-lg text-zinc-400">{currentSlide.content}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-zinc-800 text-xs">
                  <div>
                    <span className="block text-zinc-500 uppercase text-[10px]">Client</span>
                    <span className="font-semibold text-white">
                      {proposal.formData.step1.clientCompany || 'Client'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-zinc-500 uppercase text-[10px]">Prepared By</span>
                    <span className="font-semibold text-white">
                      {proposal.formData.step1.agencyName || 'Agency'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-zinc-500 uppercase text-[10px]">Validity</span>
                    <span className="font-semibold text-white">{proposal.validUntil}</span>
                  </div>
                  <div>
                    <span className="block text-zinc-500 uppercase text-[10px]">Total Investment</span>
                    <span className="font-bold text-indigo-400">{proposal.totalValue}</span>
                  </div>
                </div>
              </div>
            )}

            {currentSlide.type === 'section' && (
              <div className="whitespace-pre-wrap leading-relaxed space-y-3 font-normal">
                {currentSlide.content}
              </div>
            )}

            {currentSlide.type === 'pricing' && proposal.pricingStructure && (
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-xl border border-zinc-800">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-zinc-800 text-zinc-400 uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Deliverable Item</th>
                        <th className="py-2.5 px-2 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Investment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {proposal.pricingStructure.items.map((item) => (
                        <tr key={item.id} className="hover:bg-zinc-800/40">
                          <td className="py-2 px-3 text-zinc-200">
                            <span className="font-medium">{item.title}</span>
                            {item.description && (
                              <p className="text-[10px] text-zinc-400">{item.description}</p>
                            )}
                          </td>
                          <td className="py-2 px-2 text-center text-zinc-400">{item.quantity}</td>
                          <td className="py-2 px-3 text-right font-semibold text-white">
                            {formatCurrency(
                              item.quantity * item.unitRate,
                              proposal.pricingStructure?.currency
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-3 text-xs pt-2">
                  <div className="text-right">
                    <span className="block text-zinc-400 text-[10px] uppercase">Authorized Grand Total</span>
                    <span className="text-xl font-extrabold text-indigo-400">
                      {formatCurrency(totals.grandTotal, currency)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {currentSlide.type === 'roi' && proposal.roiEstimation && (
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 space-y-2">
                  <span className="text-zinc-400 text-xs font-semibold uppercase">Efficiency Gains</span>
                  <div className="text-3xl font-extrabold text-white">
                    {proposal.roiEstimation.hoursSavedPerMonth} hrs/mo
                  </div>
                  <p className="text-xs text-zinc-500">Estimated recurring operational hours saved</p>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 space-y-2">
                  <span className="text-zinc-400 text-xs font-semibold uppercase">Annual Cost Savings</span>
                  <div className="text-3xl font-extrabold text-emerald-400">
                    {formatCurrency(proposal.roiEstimation.annualCostSavings, currency)}
                  </div>
                  <p className="text-xs text-zinc-500">Projected direct annual financial savings</p>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 space-y-2">
                  <span className="text-zinc-400 text-xs font-semibold uppercase">Payback Period</span>
                  <div className="text-3xl font-extrabold text-amber-400">
                    {proposal.roiEstimation.paybackMonths} Months
                  </div>
                  <p className="text-xs text-zinc-500">Break-even timeline from deployment</p>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 space-y-2">
                  <span className="text-zinc-400 text-xs font-semibold uppercase">3-Year Net ROI</span>
                  <div className="text-3xl font-extrabold text-indigo-400">
                    {formatCurrency(proposal.roiEstimation.threeYearNetRoi, currency)}
                  </div>
                  <p className="text-xs text-zinc-500">Net cumulative bottom-line return</p>
                </div>
              </div>
            )}
          </div>

          {/* Presenter Notes Tray */}
          {showPresenterNotes && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-3 mt-4 text-xs text-zinc-400 space-y-1">
              <span className="text-[10px] font-bold uppercase text-indigo-400">
                Presenter Talking Points:
              </span>
              <p>
                Focus on strategic business outcomes for {proposal.formData.step1.clientCompany}. Reassure them regarding timeline certainty and 90-day warranty coverage.
              </p>
            </div>
          )}

          {/* Slide Footer */}
          <div className="flex items-center justify-between pt-6 border-t border-zinc-800/80 text-xs text-zinc-500 z-10">
            <span>{proposal.formData.step1.agencyName || 'Software Workspace'}</span>
            <div className="flex items-center gap-1.5">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    idx === currentSlideIndex
                      ? 'w-6 bg-indigo-500'
                      : 'w-2 bg-zinc-700 hover:bg-zinc-500'
                  }`}
                />
              ))}
            </div>
            <span>Use &larr; &rarr; to navigate</span>
          </div>
        </div>
      </div>

      {/* Bottom Sticky Controls */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-zinc-800 bg-zinc-900/90">
        <Button
          size="sm"
          variant="outline"
          className="border-zinc-700 bg-zinc-800 text-zinc-300 hover:text-white"
          onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentSlideIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous Slide
        </Button>

        <span className="text-xs text-zinc-400">
          Press <strong>Space</strong> or <strong>&rarr;</strong> for next slide
        </span>

        <Button
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-500 text-white"
          onClick={() => setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1))}
          disabled={currentSlideIndex === slides.length - 1}
        >
          Next Slide
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}
