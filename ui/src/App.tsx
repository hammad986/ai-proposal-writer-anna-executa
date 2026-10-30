import { useEffect, useState, useCallback } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import {
  initAnnaBridge,
  storageGet,
  storageSet,
  setWindowTitle,
} from './anna-bridge'
import { defaultBrandConfig, demoProposals, emptyFormData, normalizeProposal } from './defaults'
import type { BrandConfig, GeneratedProposal, ProposalFormData, ProposalTemplate } from './types'
import { calculatePricingTotals, formatCurrency } from './utils'
import { DashboardView } from './views/DashboardView'
import { NewProposalView } from './views/NewProposalView'
import { ProposalDetailView } from './views/ProposalDetailView'

const STORAGE_PROPOSALS_KEY = 'ai-proposal-writer:proposals'
const STORAGE_DRAFT_KEY = 'ai-proposal-writer:form_draft'
const STORAGE_BRAND_KEY = 'ai-proposal-writer:brand_config'

interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'info'
  text: string
}

export function App() {
  const [proposals, setProposals] = useState<GeneratedProposal[]>([])
  const [formDraft, setFormDraft] = useState<Partial<ProposalFormData>>(emptyFormData)
  const [brandConfig, setBrandConfig] = useState<BrandConfig>(defaultBrandConfig)
  const [currentRoute, setCurrentRoute] = useState<'dashboard' | 'new' | 'detail'>('dashboard')
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  // Toast dispatchers
  const addToast = useCallback((type: 'success' | 'error' | 'info', text: string) => {
    const id = `${Date.now()}_${Math.random()}`
    setToasts((prev) => [...prev, { id, type, text }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const toast = {
    success: (msg: string) => addToast('success', msg),
    error: (msg: string) => addToast('error', msg),
    info: (msg: string) => addToast('info', msg),
  }

  // Parse URL hash on mount / hashchange
  const applyHashRoute = useCallback(
    (hash: string, allProposals: GeneratedProposal[]) => {
      const clean = hash.replace(/^#\/?/, '')
      if (!clean || clean === 'proposals' || clean === 'dashboard') {
        setCurrentRoute('dashboard')
        setSelectedProposalId(null)
        setWindowTitle('Proposals — AI Proposal Writer')
      } else if (clean === 'new' || clean === 'proposals/new') {
        setCurrentRoute('new')
        setSelectedProposalId(null)
        setWindowTitle('New Proposal — AI Proposal Writer')
      } else if (clean.startsWith('proposals/') || clean.startsWith('detail/')) {
        const id = clean.split('/')[1]
        setCurrentRoute('detail')
        setSelectedProposalId(id)
        const match = allProposals.find((p) => p.id === id)
        if (match) {
          setWindowTitle(`${match.title} — AI Proposal Writer`)
        }
      }
    },
    []
  )

  // Initialization
  useEffect(() => {
    async function load() {
      await initAnnaBridge()

      // Fetch saved proposals from Anna Storage (normalized with demo fallback)
      const rawProposals = await storageGet<any[]>(
        STORAGE_PROPOSALS_KEY,
        demoProposals
      )
      const normalizedProposals = (Array.isArray(rawProposals) ? rawProposals : demoProposals).map(
        normalizeProposal
      )
      setProposals(normalizedProposals)

      // Fetch saved draft
      const savedDraft = await storageGet<Partial<ProposalFormData>>(
        STORAGE_DRAFT_KEY,
        emptyFormData
      )
      setFormDraft(savedDraft)

      // Fetch brand config
      const savedBrand = await storageGet<BrandConfig>(
        STORAGE_BRAND_KEY,
        defaultBrandConfig
      )
      setBrandConfig(savedBrand || defaultBrandConfig)

      // Route based on current hash
      applyHashRoute(window.location.hash, normalizedProposals)
      setIsLoaded(true)
    }

    load()

    const onHashChange = () => {
      applyHashRoute(window.location.hash, proposals)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [applyHashRoute])

  // Router navigation helper
  const navigate = useCallback(
    (route: string, proposalId?: string) => {
      if (route === 'dashboard') {
        window.location.hash = '#/proposals'
        setCurrentRoute('dashboard')
        setSelectedProposalId(null)
        setWindowTitle('Proposals — AI Proposal Writer')
      } else if (route === 'new') {
        window.location.hash = '#/new'
        setCurrentRoute('new')
        setSelectedProposalId(null)
        setWindowTitle('New Proposal — AI Proposal Writer')
      } else if (route === 'detail' && proposalId) {
        window.location.hash = `#/proposals/${proposalId}`
        setCurrentRoute('detail')
        setSelectedProposalId(proposalId)
        const match = proposals.find((p) => p.id === proposalId)
        if (match) {
          setWindowTitle(`${match.title} — AI Proposal Writer`)
        }
      }
    },
    [proposals]
  )

  // Save new proposal
  const handleProposalGenerated = useCallback(
    (newProposal: GeneratedProposal) => {
      const normalized = normalizeProposal(newProposal)
      setProposals((prev) => {
        const next = [normalized, ...prev.filter((p) => p.id !== normalized.id)]
        storageSet(STORAGE_PROPOSALS_KEY, next)
        return next
      })
      // Clear draft
      setFormDraft(emptyFormData)
      storageSet(STORAGE_DRAFT_KEY, emptyFormData)
    },
    []
  )

  // Update proposal (e.g. after edit, status change, or regenerate)
  const handleUpdateProposal = useCallback((updated: GeneratedProposal) => {
    const normalized = normalizeProposal(updated)
    setProposals((prev) => {
      const next = prev.map((p) => (p.id === normalized.id ? normalized : p))
      storageSet(STORAGE_PROPOSALS_KEY, next)
      return next
    })
  }, [])

  // Delete proposal
  const handleDeleteProposal = useCallback((id: string) => {
    setProposals((prev) => {
      const next = prev.filter((p) => p.id !== id)
      storageSet(STORAGE_PROPOSALS_KEY, next)
      return next
    })
  }, [])

  // Update Brand Config
  const handleUpdateBrandConfig = useCallback((updated: BrandConfig) => {
    setBrandConfig(updated)
    storageSet(STORAGE_BRAND_KEY, updated)
  }, [])

  // Start Proposal from Template
  const handleCreateProposalFromTemplate = useCallback(
    (template: ProposalTemplate) => {
      const defaultPricing = {
        pricingModel: 'fixed' as const,
        currency: brandConfig.defaultCurrency || ('USD' as const),
        items: template.samplePricing,
        taxPercent: 0,
        discountPercent: 0,
        paymentTerms: brandConfig.defaultPaymentTerms || '40% advance upon signing, 30% milestone review, 30% handover.',
        depositPercent: 40,
      }
      const totals = calculatePricingTotals(defaultPricing)
      const formattedTotal = formatCurrency(totals.grandTotal, defaultPricing.currency)

      const draft: ProposalFormData = {
        step1: {
          ...emptyFormData.step1,
          agencyName: brandConfig.companyName || emptyFormData.step1.agencyName,
          agencyTagline: brandConfig.tagline || emptyFormData.step1.agencyTagline,
          agencyEmail: brandConfig.email || emptyFormData.step1.agencyEmail,
          agencyWebsite: brandConfig.website || emptyFormData.step1.agencyWebsite,
          projectName: template.name,
          projectType: template.projectType,
          industry: template.industry,
          problemStatement: template.sampleProblem,
        },
        step2: {
          ...emptyFormData.step2,
          keyFeatures: template.sampleFeatures.join('\n'),
        },
        step3: {
          ...emptyFormData.step3,
          pricingStructure: defaultPricing,
          budgetRange: formattedTotal,
        },
        step4: {
          ...emptyFormData.step4,
          tone: template.defaultTone,
          includedSections: template.sections,
        },
      }

      setFormDraft(draft)
      storageSet(STORAGE_DRAFT_KEY, draft)
      navigate('new')
    },
    [brandConfig, navigate]
  )

  // Draft persistence
  const handleSaveDraft = useCallback((draft: ProposalFormData) => {
    setFormDraft(draft)
    storageSet(STORAGE_DRAFT_KEY, draft)
  }, [])

  // Pre-fill inputs from existing proposal
  const handleEditInputs = useCallback(
    (proposal: GeneratedProposal) => {
      setFormDraft(proposal.formData)
      storageSet(STORAGE_DRAFT_KEY, proposal.formData)
      navigate('new')
    },
    [navigate]
  )

  if (!isLoaded) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground font-medium">Connecting to Anna App...</p>
        </div>
      </div>
    )
  }

  const selectedProposal = selectedProposalId
    ? proposals.find((p) => p.id === selectedProposalId)
    : null

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* View router */}
      {currentRoute === 'dashboard' && (
        <DashboardView
          proposals={proposals}
          brandConfig={brandConfig}
          onUpdateBrandConfig={handleUpdateBrandConfig}
          onNavigate={navigate}
          onDeleteProposal={handleDeleteProposal}
          onUpdateProposal={handleUpdateProposal}
          onCreateProposalFromTemplate={handleCreateProposalFromTemplate}
          toast={toast}
        />
      )}

      {currentRoute === 'new' && (
        <NewProposalView
          initialDraft={formDraft}
          onSaveDraft={handleSaveDraft}
          onProposalGenerated={handleProposalGenerated}
          onNavigate={navigate}
          toast={toast}
        />
      )}

      {currentRoute === 'detail' &&
        (selectedProposal ? (
          <ProposalDetailView
            proposal={selectedProposal}
            onUpdateProposal={handleUpdateProposal}
            onNavigate={navigate}
            onEditInputs={handleEditInputs}
            toast={toast}
          />
        ) : (
          <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="text-center space-y-4">
              <h2 className="text-xl font-bold">Proposal Not Found</h2>
              <p className="text-sm text-muted-foreground">
                This proposal may have been deleted or does not exist in your workspace.
              </p>
              <button
                onClick={() => navigate('dashboard')}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-600 cursor-pointer"
              >
                Return to Proposals Workspace
              </button>
            </div>
          </div>
        ))}

      {/* Floating toast stack */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-2.5 rounded-lg border bg-card px-4 py-3 shadow-lg pointer-events-auto text-sm animate-in slide-in-from-bottom-2 fade-in"
          >
            {t.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
            {t.type === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
            {t.type === 'info' && <Info className="h-4 w-4 text-blue-500" />}
            <span className="text-foreground font-medium">{t.text}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
              className="ml-2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
