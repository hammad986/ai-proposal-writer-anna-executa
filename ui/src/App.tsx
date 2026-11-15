import { useEffect, useState, useCallback } from 'react'
import { CheckCircle2, AlertCircle, Info, X, Sparkles, LayoutTemplate, Mic } from 'lucide-react'
import {
  initAnnaBridge,
  storageGet,
  storageSet,
  setWindowTitle,
} from './anna-bridge'
import { defaultBrandConfig, demoProposals, emptyFormData, normalizeProposal } from './defaults'
import type { BrandConfig, GeneratedProposal, ProposalFormData, ProposalTemplate } from './types'
import { calculatePricingTotals, formatCurrency } from './utils'
import { AppSidebar, type NavigationTab } from './components/layout/AppSidebar'
import { DashboardView } from './views/DashboardView'
import { VoiceProposalView } from './views/VoiceProposalView'
import { ProposalStudioView } from './views/ProposalStudioView'
import { TemplateGalleryView } from './views/TemplateGalleryView'
import { RfpIntelligenceView } from './views/RfpIntelligenceView'
import { CompanyKnowledgeView } from './views/CompanyKnowledgeView'
import { DealPipelineView } from './views/DealPipelineView'
import { SettingsView } from './views/SettingsView'
import { NewProposalView } from './views/NewProposalView'
import { Button } from './components/ui/button'

const STORAGE_PROPOSALS_KEY = 'ai-proposal-writer:proposals'
const STORAGE_DRAFT_KEY = 'ai-proposal-writer:form_draft'
const STORAGE_BRAND_KEY = 'ai-proposal-writer:brand_config'

interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'info'
  text: string
}

type AppRoute = NavigationTab | 'new'

export function App() {
  const [proposals, setProposals] = useState<GeneratedProposal[]>([])
  const [formDraft, setFormDraft] = useState<Partial<ProposalFormData>>(emptyFormData)
  const [brandConfig, setBrandConfig] = useState<BrandConfig>(defaultBrandConfig)
  const [currentRoute, setCurrentRoute] = useState<AppRoute>('dashboard')
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
      if (!clean || clean === 'dashboard' || clean === 'proposals') {
        setCurrentRoute('dashboard')
        setSelectedProposalId(null)
        setWindowTitle('Dashboard — AI Proposal Studio 3.0')
      } else if (clean === 'voice') {
        setCurrentRoute('voice')
        setSelectedProposalId(null)
        setWindowTitle('Voice-to-Proposal — AI Proposal Studio')
      } else if (clean === 'rfp') {
        setCurrentRoute('rfp')
        setSelectedProposalId(null)
        setWindowTitle('RFP Intelligence — AI Proposal Studio')
      } else if (clean === 'templates') {
        setCurrentRoute('templates')
        setSelectedProposalId(null)
        setWindowTitle('Template Gallery — AI Proposal Studio')
      } else if (clean === 'knowledge') {
        setCurrentRoute('knowledge')
        setSelectedProposalId(null)
        setWindowTitle('Knowledge Base — AI Proposal Studio')
      } else if (clean === 'pipeline') {
        setCurrentRoute('pipeline')
        setSelectedProposalId(null)
        setWindowTitle('Deal Pipeline — AI Proposal Studio')
      } else if (clean === 'settings') {
        setCurrentRoute('settings')
        setSelectedProposalId(null)
        setWindowTitle('Workspace Settings — AI Proposal Studio')
      } else if (clean === 'new' || clean === 'proposals/new') {
        setCurrentRoute('new')
        setSelectedProposalId(null)
        setWindowTitle('New Proposal Wizard — AI Proposal Studio')
      } else if (
        clean.startsWith('studio/') ||
        clean.startsWith('proposals/') ||
        clean.startsWith('detail/')
      ) {
        const id = clean.split('/')[1]
        setCurrentRoute('studio')
        setSelectedProposalId(id)
        const match = allProposals.find((p) => p.id === id)
        if (match) {
          setWindowTitle(`${match.title} — Proposal Studio`)
        }
      } else if (clean === 'studio') {
        const firstId = allProposals[0]?.id
        if (firstId) {
          setCurrentRoute('studio')
          setSelectedProposalId(firstId)
          setWindowTitle(`${allProposals[0].title} — Proposal Studio`)
        } else {
          setCurrentRoute('templates')
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
        window.location.hash = '#/dashboard'
        setCurrentRoute('dashboard')
        setSelectedProposalId(null)
        setWindowTitle('Dashboard — AI Proposal Studio 3.0')
      } else if (route === 'studio') {
        const targetId = proposalId || selectedProposalId || proposals[0]?.id
        if (targetId) {
          window.location.hash = `#/studio/${targetId}`
          setCurrentRoute('studio')
          setSelectedProposalId(targetId)
          const match = proposals.find((p) => p.id === targetId)
          if (match) setWindowTitle(`${match.title} — Proposal Studio`)
        } else {
          window.location.hash = '#/templates'
          setCurrentRoute('templates')
          setWindowTitle('Template Gallery — AI Proposal Studio')
        }
      } else if (route === 'voice') {
        window.location.hash = '#/voice'
        setCurrentRoute('voice')
        setSelectedProposalId(null)
        setWindowTitle('Voice-to-Proposal — AI Proposal Studio')
      } else if (route === 'rfp') {
        window.location.hash = '#/rfp'
        setCurrentRoute('rfp')
        setSelectedProposalId(null)
        setWindowTitle('RFP Intelligence — AI Proposal Studio')
      } else if (route === 'templates') {
        window.location.hash = '#/templates'
        setCurrentRoute('templates')
        setSelectedProposalId(null)
        setWindowTitle('Template Gallery — AI Proposal Studio')
      } else if (route === 'knowledge') {
        window.location.hash = '#/knowledge'
        setCurrentRoute('knowledge')
        setSelectedProposalId(null)
        setWindowTitle('Knowledge Base — AI Proposal Studio')
      } else if (route === 'pipeline') {
        window.location.hash = '#/pipeline'
        setCurrentRoute('pipeline')
        setSelectedProposalId(null)
        setWindowTitle('Deal Pipeline — AI Proposal Studio')
      } else if (route === 'settings') {
        window.location.hash = '#/settings'
        setCurrentRoute('settings')
        setSelectedProposalId(null)
        setWindowTitle('Workspace Settings — AI Proposal Studio')
      } else if (route === 'new') {
        window.location.hash = '#/new'
        setCurrentRoute('new')
        setSelectedProposalId(null)
        setWindowTitle('New Proposal Wizard — AI Proposal Studio')
      } else if (route === 'detail' && proposalId) {
        window.location.hash = `#/studio/${proposalId}`
        setCurrentRoute('studio')
        setSelectedProposalId(proposalId)
        const match = proposals.find((p) => p.id === proposalId)
        if (match) setWindowTitle(`${match.title} — Proposal Studio`)
      }
    },
    [proposals, selectedProposalId]
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
    toast.info('Proposal removed from workspace')
  }, [])

  // Update Brand Config
  const handleUpdateBrandConfig = useCallback((updated: BrandConfig) => {
    setBrandConfig(updated)
    storageSet(STORAGE_BRAND_KEY, updated)
  }, [])

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
          <p className="text-sm text-muted-foreground font-medium">Connecting to AI Proposal Studio 3.0...</p>
        </div>
      </div>
    )
  }

  const selectedProposal = selectedProposalId
    ? proposals.find((p) => p.id === selectedProposalId) || proposals[0]
    : proposals[0]

  const activeTab: NavigationTab = currentRoute === 'new' ? 'dashboard' : currentRoute

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Universal Left Navigation Sidebar */}
      <AppSidebar
        currentTab={activeTab}
        onSelectTab={(tab) => navigate(tab)}
        onNewProposal={() => navigate('new')}
        proposalCount={proposals.length}
        activeProposalTitle={selectedProposal?.title}
        brandConfig={brandConfig}
      />

      {/* Main View Area */}
      <main className="flex-1 overflow-y-auto">
        {currentRoute === 'dashboard' && (
          <DashboardView
            proposals={proposals}
            brandConfig={brandConfig}
            onNavigate={navigate}
            onDeleteProposal={handleDeleteProposal}
            onUpdateProposal={handleUpdateProposal}
            toast={toast}
          />
        )}

        {currentRoute === 'studio' &&
          (selectedProposal ? (
            <ProposalStudioView
              proposal={selectedProposal}
              onUpdateProposal={handleUpdateProposal}
              onNavigate={navigate}
              onEditInputs={handleEditInputs}
              toast={toast}
            />
          ) : (
            <div className="flex min-h-screen items-center justify-center bg-background px-4">
              <div className="text-center space-y-4 max-w-md">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-bold">No Proposals Available</h2>
                <p className="text-sm text-muted-foreground">
                  Get started by picking a blueprint from the Template Gallery or dictate your project scope with Voice AI.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Button
                    onClick={() => navigate('templates')}
                    className="gap-2"
                  >
                    <LayoutTemplate className="h-4 w-4" />
                    Browse Templates
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('voice')}
                    className="gap-2"
                  >
                    <Mic className="h-4 w-4" />
                    Voice Scoping
                  </Button>
                </div>
              </div>
            </div>
          ))}

        {currentRoute === 'voice' && (
          <VoiceProposalView
            onProposalCreated={handleProposalGenerated}
            onNavigateToStudio={(id) => navigate('studio', id)}
            toast={toast}
          />
        )}

        {currentRoute === 'rfp' && (
          <RfpIntelligenceView
            onProposalCreated={handleProposalGenerated}
            onNavigateToStudio={(id) => navigate('studio', id)}
            toast={toast}
          />
        )}

        {currentRoute === 'templates' && (
          <TemplateGalleryView
            onProposalCreated={handleProposalGenerated}
            onNavigateToStudio={(id) => navigate('studio', id)}
            toast={toast}
          />
        )}

        {currentRoute === 'knowledge' && (
          <CompanyKnowledgeView toast={toast} />
        )}

        {currentRoute === 'pipeline' && (
          <DealPipelineView
            proposals={proposals}
            onUpdateProposal={handleUpdateProposal}
            onNavigateToStudio={(id) => navigate('studio', id)}
            toast={toast}
          />
        )}

        {currentRoute === 'settings' && (
          <SettingsView
            brandConfig={brandConfig}
            onUpdateBrandConfig={handleUpdateBrandConfig}
            toast={toast}
          />
        )}

        {currentRoute === 'new' && (
          <NewProposalView
            initialDraft={formDraft}
            onSaveDraft={handleSaveDraft}
            onProposalGenerated={(prop) => {
              handleProposalGenerated(prop)
              navigate('studio', prop.id)
            }}
            onNavigate={navigate}
            toast={toast}
          />
        )}
      </main>

      {/* Floating toast notification stack */}
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
