import { useEffect, useState, useCallback } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import {
  initAnnaBridge,
  storageGet,
  storageSet,
  setWindowTitle,
} from './anna-bridge'
import { demoProposals, emptyFormData } from './defaults'
import type { GeneratedProposal, ProposalFormData } from './types'
import { DashboardView } from './views/DashboardView'
import { NewProposalView } from './views/NewProposalView'
import { ProposalDetailView } from './views/ProposalDetailView'

const STORAGE_PROPOSALS_KEY = 'ai-proposal-writer:proposals'
const STORAGE_DRAFT_KEY = 'ai-proposal-writer:form_draft'

interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'info'
  text: string
}

export function App() {
  const [proposals, setProposals] = useState<GeneratedProposal[]>([])
  const [formDraft, setFormDraft] = useState<Partial<ProposalFormData>>(emptyFormData)
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

      // Fetch saved proposals from Anna Storage (with demo fallback)
      const savedProposals = await storageGet<GeneratedProposal[]>(
        STORAGE_PROPOSALS_KEY,
        demoProposals
      )
      setProposals(savedProposals)

      // Fetch saved draft
      const savedDraft = await storageGet<Partial<ProposalFormData>>(
        STORAGE_DRAFT_KEY,
        emptyFormData
      )
      setFormDraft(savedDraft)

      // Route based on current hash
      applyHashRoute(window.location.hash, savedProposals)
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
      setProposals((prev) => {
        const next = [newProposal, ...prev.filter((p) => p.id !== newProposal.id)]
        storageSet(STORAGE_PROPOSALS_KEY, next)
        return next
      })
      // Clear draft
      setFormDraft(emptyFormData)
      storageSet(STORAGE_DRAFT_KEY, emptyFormData)
    },
    []
  )

  // Update proposal (e.g. after edit or regenerate)
  const handleUpdateProposal = useCallback((updated: GeneratedProposal) => {
    setProposals((prev) => {
      const next = prev.map((p) => (p.id === updated.id ? updated : p))
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
          onNavigate={navigate}
          onDeleteProposal={handleDeleteProposal}
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
              <h2 className="text-xl font-semibold">Proposal Not Found</h2>
              <p className="text-sm text-muted-foreground">
                This proposal may have been deleted or does not exist.
              </p>
              <button
                onClick={() => navigate('dashboard')}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-600"
              >
                Return to Proposals
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
