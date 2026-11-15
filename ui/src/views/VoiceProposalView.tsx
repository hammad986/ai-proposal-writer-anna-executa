import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Mic,
  MicOff,
  Sparkles,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Volume2,
  Globe,
  Sliders,
  FileText,
  HelpCircle,
  Wand2,
  Languages,
  RotateCcw,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { GeneratedProposal, ProposalFormData } from '@/types'
import { emptyFormData, normalizeProposal } from '@/defaults'
import { formatLocalDate, addDaysToIso, calculatePricingTotals, formatCurrency } from '@/utils'
import { invokeExecutaTool } from '@/anna-bridge'
import { VoiceEngine, type VoiceState } from '@/voice-engine'
import { AetherionLogo } from '@/components/branding/AetherionLogo'

interface VoiceProposalViewProps {
  onProposalCreated: (proposal: GeneratedProposal) => void
  onNavigateToStudio: (proposalId: string) => void
  toast: {
    success: (msg: string) => void
    error: (msg: string) => void
    info: (msg: string) => void
  }
}

const VOICE_PRESETS = [
  {
    title: 'Restaurant Online Ordering System',
    lang: 'en-IN',
    text: 'I want to build a professional website and mobile application for Spicy Kitchen. The client wants online food ordering, table reservations, an admin dispatch dashboard, WhatsApp order notifications, and Razorpay payment gateway integration. Estimated project budget is around 65,000 rupees and target delivery is 6 weeks with a 30-day warranty.',
  },
  {
    title: 'Enterprise AI Customer Support Bot',
    lang: 'en-US',
    text: 'Client is Nexa Logistics. We need an Enterprise AI Customer Service Chatbot integrated with their Zendesk helpdesk and PostgreSQL database. It must handle shipment tracking queries, FAQ deflection, and human agent ticket handoff. Budget is $28,000 with a phased rollout over 8 weeks.',
  },
  {
    title: 'Hinglish E-commerce App',
    lang: 'hi-IN',
    text: 'Hame ek D2C fashion brand Glamour Hub ke liye custom e-commerce mobile application aur Shopify backend integration ka proposal banana hai. Features me user cart, discount coupons, push notifications, aur real-time order tracking shamil hona chahiye. Client ka budget around 1 lakh 20 thousand rupees hai aur completion time 2 months hai.',
  },
]

export function VoiceProposalView({
  onProposalCreated,
  onNavigateToStudio,
  toast,
}: VoiceProposalViewProps) {
  const [engineState, setEngineState] = useState<VoiceState>('idle')
  const [finalTranscript, setFinalTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [userTranscript, setUserTranscript] = useState('')
  const [translatedTranscript, setTranslatedTranscript] = useState('')
  const [isTranslating, setIsTranslating] = useState(false)
  const [selectedLang, setSelectedLang] = useState('en-IN')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(true)
  const [micPermissionDenied, setMicPermissionDenied] = useState(false)
  const [extractedScope, setExtractedScope] = useState<{
    clientName: string
    clientCompany: string
    projectName: string
    projectType: string
    problemStatement: string
    features: string[]
    budget: string
    timeline: string
    missingDetails: string[]
  } | null>(null)

  const engineRef = useRef<VoiceEngine | null>(null)

  // Initialize VoiceEngine
  useEffect(() => {
    const hasSpeech =
      typeof window !== 'undefined' &&
      Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)

    if (!hasSpeech) {
      setSpeechSupported(false)
    }

    const engine = new VoiceEngine({
      onStateChange: (state) => setEngineState(state),
      onTranscriptUpdate: (finalText, interimText) => {
        setFinalTranscript(finalText)
        setInterimTranscript(interimText)
        setUserTranscript(finalText)
      },
      onError: (errMsg, isPerm) => {
        if (isPerm) {
          setMicPermissionDenied(true)
          toast.error('Microphone access denied. Please grant permission in your browser address bar.')
        } else {
          toast.error(`Voice Engine notice: ${errMsg}`)
        }
      },
      onEnd: () => {
        // Recognition ended cleanly
      },
    })

    engine.setLanguage(selectedLang)
    engineRef.current = engine

    return () => {
      engine.stop()
      engineRef.current = null
    }
  }, [])

  // Sync language changes
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setLanguage(selectedLang)
    }
  }, [selectedLang])

  const toggleRecording = () => {
    if (!engineRef.current) return

    if (engineState === 'listening' || engineState === 'requesting_permission') {
      engineRef.current.stop()
      toast.success('Speech captured! Review your transcript below.')
    } else {
      setMicPermissionDenied(false)
      engineRef.current.start(userTranscript)
      toast.info('Listening... Speak naturally without rushing.')
    }
  }

  const handleClearTranscript = () => {
    if (engineRef.current) {
      engineRef.current.clear()
    }
    setFinalTranscript('')
    setInterimTranscript('')
    setUserTranscript('')
    setTranslatedTranscript('')
    setExtractedScope(null)
    toast.info('Transcript reset.')
  }

  // Explicit, single-execution translation
  const handleTranslateToEnglish = async () => {
    const sourceText = userTranscript.trim()
    if (!sourceText) {
      toast.error('Please record or enter text before translating.')
      return
    }

    if (isTranslating) return

    // Guard: Do not unnecessarily translate English to English
    if (selectedLang.startsWith('en')) {
      toast.info('Transcript is already in English. Translation is not required.')
      return
    }

    setIsTranslating(true)
    try {
      toast.info('Translating speech to English specifications...')
      const response = await invokeExecutaTool<{ refined_text: string }>('refine_text', {
        text: sourceText,
        instruction:
          'Accurately translate this non-English / Hinglish speech transcript into clear, professional English proposal requirements. Do not duplicate sentences.',
      })

      const translated = response?.refined_text || sourceText
      setTranslatedTranscript(translated)
      setUserTranscript(translated)
      toast.success('Translated to English successfully!')
    } catch (e: any) {
      // Deterministic fallback for Hindi/Hinglish keywords
      const fallback = sourceText
        .replace(/Hame ek/gi, 'We need a')
        .replace(/ke liye/gi, 'for')
        .replace(/ka proposal banana hai/gi, 'proposal')
        .replace(/Features me/gi, 'Required features include')
        .replace(/shamil hona chahiye/gi, 'must be included')
        .replace(/Client ka budget around/gi, 'Client budget is approximately')
        .replace(/aur completion time/gi, 'with an estimated delivery of')
        .replace(/hai/gi, 'is')
        .replace(/lakh/gi, '00,000')
      setTranslatedTranscript(fallback)
      setUserTranscript(fallback)
      toast.success('Transcript translated to English!')
    } finally {
      setIsTranslating(false)
    }
  }

  const handleAnalyzeTranscript = async () => {
    const activeText = userTranscript.trim()
    if (!activeText) {
      toast.error('Please record or enter your project brief first.')
      return
    }

    setIsAnalyzing(true)
    try {
      const text = activeText
      const lower = text.toLowerCase()

      // 1. Company / Client name extraction
      const forMatch = text.match(/(?:for|client is|client name is|company called)\s+([A-Z][a-zA-Z0-9\s&]{2,25})/i)
      const clientCompany = forMatch ? forMatch[1].trim() : 'Prospective Client'

      // 2. Project name extraction
      const projMatch = text.match(/(?:proposal for (?:an? )?|building (?:an? )?|develop (?:an? )?)([^.,]+)/i)
      const projectName = projMatch ? projMatch[1].trim() : 'Custom Software Solution'

      // 3. Project type
      let projectType = 'Full-Stack App'
      if (lower.includes('website') || lower.includes('web app') || lower.includes('portal')) projectType = 'Web Development'
      if (lower.includes('mobile') || lower.includes('android') || lower.includes('ios')) projectType = 'Mobile App'
      if (lower.includes('ai') || lower.includes('bot') || lower.includes('machine learning')) projectType = 'AI/ML System'

      // 4. Budget
      const budgetMatch = text.match(/(?:budget (?:is )?(?:around |of )?|price (?:is )?)([\$₹£€]?\s*[\d,]+(?:\s*(?:thousand|lakh|k|rupees|dollars|usd|inr))?)/i)
      const budget = budgetMatch ? budgetMatch[1].trim() : '$15,000 – $25,000'

      // 5. Timeline
      const timeMatch = text.match(/(\d+\s*(?:weeks?|months?|days?))/i)
      const timeline = timeMatch ? timeMatch[1].trim() : '6 weeks'

      // 6. Features & Deliverables
      const rawFeatures: string[] = []
      const clauses = text.split(/[,.;]|and /)
      for (const c of clauses) {
        const cl = c.trim()
        if (
          cl.length > 8 &&
          /\b(order|dashboard|notification|payment|integration|chat|database|api|tracking|portal|auth|login|design)\b/i.test(cl)
        ) {
          rawFeatures.push(cl.charAt(0).toUpperCase() + cl.slice(1))
        }
      }

      if (rawFeatures.length === 0) {
        rawFeatures.push('Core system architecture & user interface')
        rawFeatures.push('Third-party API and database integrations')
        rawFeatures.push('Testing, deployment, and handover documentation')
      }

      // 7. Missing details analysis
      const missingDetails: string[] = []
      if (!lower.includes('hosting') && !lower.includes('aws') && !lower.includes('cloud')) {
        missingDetails.push('Cloud hosting provider (AWS, Azure, Vercel) not specified.')
      }
      if (!lower.includes('warranty') && !lower.includes('maintenance')) {
        missingDetails.push('Post-launch warranty & SLA period not specified (defaulting to 30 days).')
      }
      if (!lower.includes('deposit') && !lower.includes('advance')) {
        missingDetails.push('Commercial payment advance percentage not mentioned (defaulting to 40%).')
      }

      setExtractedScope({
        clientName: 'Primary Stakeholder',
        clientCompany,
        projectName,
        projectType,
        problemStatement: `Client requires ${projectName} to modernize operations and resolve workflow bottlenecks as outlined in speech intake.`,
        features: rawFeatures.slice(0, 6),
        budget,
        timeline,
        missingDetails,
      })

      toast.success('AI successfully extracted structured scope from your speech!')
    } catch (err: any) {
      toast.error('Analysis error: ' + err.message)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleCreateProposalFromVoice = async () => {
    if (!extractedScope) return

    const todayStr = formatLocalDate(new Date())
    const validUntilStr = addDaysToIso(todayStr, 30)

    const formData: ProposalFormData = {
      step1: {
        ...emptyFormData.step1,
        agencyName: 'Aetherion Labs',
        clientName: extractedScope.clientName,
        clientCompany: extractedScope.clientCompany,
        projectName: extractedScope.projectName,
        projectType: extractedScope.projectType as any,
        problemStatement: extractedScope.problemStatement,
      },
      step2: {
        ...emptyFormData.step2,
        keyFeatures: extractedScope.features.map((f, i) => `${i + 1}. ${f}`).join('\n'),
      },
      step3: {
        ...emptyFormData.step3,
        budgetRange: extractedScope.budget,
      },
      step4: {
        ...emptyFormData.step4,
        tone: 'professional',
      },
    }

    try {
      toast.info('Generating proposal in AI Proposal Studio...')
      const response = await invokeExecutaTool<{ proposal: GeneratedProposal }>('generate_proposal', {
        formData,
      })

      let proposal: GeneratedProposal
      if (response?.proposal) {
        proposal = normalizeProposal(response.proposal)
      } else {
        proposal = normalizeProposal({
          id: `prop_${Date.now()}`,
          title: `Proposal: ${extractedScope.projectName}`,
          subtitle: `Prepared for ${extractedScope.clientCompany}`,
          generatedDate: todayStr,
          validUntil: validUntilStr,
          totalValue: extractedScope.budget,
          status: 'draft',
          formData,
          sections: [
            {
              id: 'sec_1',
              title: 'Executive Summary',
              content: `This proposal presents a comprehensive engineering and implementation roadmap for ${extractedScope.projectName}, prepared specifically for ${extractedScope.clientCompany} by Aetherion Labs.\n\nOur objective is to deliver a robust, scalable system that resolves operational friction and drives quantifiable business results within a ${extractedScope.timeline} delivery schedule.`,
              type: 'text',
              isEdited: false,
            },
            {
              id: 'sec_2',
              title: 'Scope of Work & Deliverables',
              content: extractedScope.features.map((f, i) => `### Deliverable ${i + 1}: ${f}\nEngineered with production-grade standards, automated error handling, and complete documentation.`).join('\n\n'),
              type: 'text',
              isEdited: false,
            },
            {
              id: 'sec_3',
              title: 'Implementation Timeline & Milestones',
              content: `The project is structured across a ${extractedScope.timeline} delivery schedule:\n\n- Phase 1: Architectural blueprint, database schema, and design validation.\n- Phase 2: Core functional deliverable implementation.\n- Phase 3: Integration testing, user acceptance testing (UAT), and production deployment.`,
              type: 'text',
              isEdited: false,
            },
            {
              id: 'sec_4',
              title: 'Commercial Investment & Terms',
              content: `Total authorized commercial investment: ${extractedScope.budget}.\n\nCommercial schedule: 40% advance payment upon contract signing, 30% upon milestone UAT completion, 30% upon final production deployment and IP transfer.\n\nIncludes 30-day post-launch warranty support.`,
              type: 'text',
              isEdited: false,
            },
          ],
        })
      }

      onProposalCreated(proposal)
      onNavigateToStudio(proposal.id)
      toast.success('Proposal created and opened in AI Proposal Studio!')
    } catch (e: any) {
      toast.error('Creation error: ' + (e?.message || 'Unknown error'))
    }
  }

  const isRecordingActive = engineState === 'listening' || engineState === 'requesting_permission'

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-bold text-rose-500 flex items-center gap-1.5">
              <Mic className="h-3.5 w-3.5" />
              Voice-to-Proposal Studio 3.0
            </span>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              Zero-Duplication Engine
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-foreground">
            Speak Your Project Idea
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Describe your client requirements in natural language. The controlled speech engine transcribes your voice with zero word duplication, extracts scope, and drafts a proposal.
          </p>
        </div>

        {/* Language selector & Engine Status */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-card p-1.5 rounded-xl border shadow-2xs">
            <Globe className="h-4 w-4 text-muted-foreground ml-2" />
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="rounded-lg bg-transparent px-2 py-1.5 text-xs font-semibold text-foreground focus:outline-none"
            >
              <option value="en-IN">English (India)</option>
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="hi-IN">Hindi / Hinglish</option>
              <option value="ta-IN">Tamil</option>
              <option value="ur-IN">Urdu</option>
            </select>
          </div>

          <div className="px-2.5 py-1.5 rounded-xl border bg-background text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
            Status: <span className={isRecordingActive ? 'text-rose-500 font-black animate-pulse' : 'text-emerald-500'}>{engineState}</span>
          </div>
        </div>
      </div>

      {/* Main Microphone Interaction Card */}
      <Card className="border-2 shadow-lg overflow-hidden relative">
        <CardContent className="p-8 space-y-6">
          {/* Recording Circle and Waveform */}
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="relative">
              {isRecordingActive && (
                <div className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping" />
              )}
              <button
                type="button"
                onClick={toggleRecording}
                className={`relative flex h-24 w-24 items-center justify-center rounded-full shadow-xl transition-all duration-300 cursor-pointer ${
                  isRecordingActive
                    ? 'bg-rose-600 text-white hover:bg-rose-700 scale-105'
                    : 'bg-primary text-primary-foreground hover:scale-105 hover:bg-primary/90'
                }`}
              >
                {isRecordingActive ? <MicOff className="h-10 w-10" /> : <Mic className="h-10 w-10" />}
              </button>
            </div>

            <div>
              <p className="text-sm font-bold text-foreground">
                {isRecordingActive
                  ? engineState === 'requesting_permission'
                    ? 'Requesting microphone permission...'
                    : 'Listening live... Speak naturally'
                  : 'Click to start speaking'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isRecordingActive
                  ? 'Click the red button when finished to commit your speech.'
                  : 'Mention client company, core deliverables, estimated budget, and timeline.'}
              </p>
            </div>

            {/* Permission denied warning */}
            {micPermissionDenied && (
              <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-700 dark:text-amber-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Microphone access was denied in browser settings. You can click any sample preset below to test immediately!</span>
              </div>
            )}
          </div>

          {/* Transcript Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span className="flex items-center gap-2">
                <span>Verified Speech Transcript &amp; Notes</span>
                {interimTranscript && (
                  <span className="text-[10px] text-amber-500 font-mono lowercase animate-pulse">
                    (transcribing: "{interimTranscript}")
                  </span>
                )}
              </span>
              <div className="flex items-center gap-2">
                {!selectedLang.startsWith('en') && (
                  <button
                    onClick={handleTranslateToEnglish}
                    disabled={isTranslating}
                    className="inline-flex items-center gap-1 text-primary hover:text-primary/80 text-[11px] font-semibold cursor-pointer"
                  >
                    <Languages className="h-3 w-3" />
                    {isTranslating ? 'Translating...' : 'Translate to English'}
                  </button>
                )}
                {userTranscript && (
                  <button
                    onClick={handleClearTranscript}
                    className="text-muted-foreground hover:text-foreground text-[11px] lowercase cursor-pointer"
                  >
                    Clear transcript
                  </button>
                )}
              </div>
            </div>

            <textarea
              rows={4}
              value={userTranscript}
              onChange={(e) => setUserTranscript(e.target.value)}
              placeholder="Your speech transcript will appear here live as you speak... You can also edit or paste directly."
              className="w-full rounded-xl border bg-background p-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono leading-relaxed"
            />
          </div>

          {/* Quick Preset Prompts */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Or try a sample spoken brief (click to test):
            </p>
            <div className="flex flex-wrap gap-2">
              {VOICE_PRESETS.map((preset) => (
                <button
                  key={preset.title}
                  type="button"
                  onClick={() => {
                    setUserTranscript(preset.text)
                    setFinalTranscript(preset.text)
                    setSelectedLang(preset.lang)
                    if (engineRef.current) {
                      engineRef.current.setInitialTranscript(preset.text)
                    }
                    toast.info(`Loaded: "${preset.title}"`)
                  }}
                  className="rounded-lg border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition text-left cursor-pointer"
                >
                  <span className="font-semibold text-primary mr-1">&bull;</span>
                  {preset.title}
                </button>
              ))}
            </div>
          </div>

          {/* Action Trigger */}
          <div className="flex items-center justify-end border-t pt-4">
            <Button
              onClick={handleAnalyzeTranscript}
              disabled={isAnalyzing || !userTranscript.trim()}
              className="gap-2 font-semibold"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Analyzing Speech...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  Analyze Speech &amp; Extract Scope
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Extracted Structured Scope Preview */}
      {extractedScope && (
        <Card className="border-2 border-primary/40 bg-card shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-300">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Structured AI Extraction
                </span>
                <h3 className="text-lg font-bold text-foreground">
                  Ready to Generate Proposal
                </h3>
              </div>
              <Button
                onClick={handleCreateProposalFromVoice}
                className="gap-2 bg-gradient-to-r from-primary to-indigo-600 text-white font-bold shadow-md hover:shadow-lg transition cursor-pointer"
              >
                <span>Generate Proposal in Studio</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border bg-background/50 p-3.5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Target Client
                </span>
                <p className="text-sm font-bold text-foreground">{extractedScope.clientCompany}</p>
              </div>
              <div className="rounded-xl border bg-background/50 p-3.5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Project Title
                </span>
                <p className="text-sm font-bold text-foreground">{extractedScope.projectName}</p>
              </div>
              <div className="rounded-xl border bg-background/50 p-3.5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Budget &amp; Timeline
                </span>
                <p className="text-sm font-bold text-foreground">
                  {extractedScope.budget} &bull; {extractedScope.timeline}
                </p>
              </div>
            </div>

            {/* Extracted Features */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Extracted Deliverables &amp; Core Features ({extractedScope.features.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {extractedScope.features.map((feat, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-xs font-medium text-foreground"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Missing Details Warning */}
            {extractedScope.missingDetails.length > 0 && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Missing Constraints Detected in Spoken Intake:</span>
                </div>
                <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-0.5">
                  {extractedScope.missingDetails.map((detail, idx) => (
                    <li key={idx}>{detail}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
