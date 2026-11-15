import { useState, useEffect } from 'react'
import {
  BookOpen,
  Plus,
  Trash2,
  Check,
  X,
  FileCheck,
  Award,
  Users,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { storageGet, storageSet } from '@/anna-bridge'
import type { CompanyKnowledgeAsset, GeneratedProposal } from '@/types'

const STORAGE_KNOWLEDGE_KEY = 'ai-proposal-writer:company_knowledge'

const DEFAULT_ASSETS: CompanyKnowledgeAsset[] = [
  {
    id: 'k_asset_1',
    title: 'Fintech Trading System Case Study',
    category: 'case_study',
    tags: ['Fintech', 'React Native', 'AWS', 'PostgreSQL'],
    content:
      'Engineered a high-frequency mobile trading and wealth management application handling $45M+ in monthly transaction volume. Implemented sub-100ms WebSocket price streaming, biometric 2FA authentication, and achieved 99.99% uptime with zero critical security defects during independent KPMG penetration testing.',
    createdAt: '2026-09-15',
  },
  {
    id: 'k_asset_2',
    title: 'SOC2 Type II & HIPAA Compliance Standard',
    category: 'security',
    tags: ['Security', 'SOC2', 'HIPAA', 'Encryption'],
    content:
      'All source code and cloud infrastructure adhere strictly to SOC2 Type II and HIPAA security controls. Enforces TLS 1.3 in transit, AES-256 at rest, automated vulnerability scanning in GitHub Actions CI/CD pipelines, and role-based access control (RBAC) with audited access logs.',
    createdAt: '2026-09-20',
  },
  {
    id: 'k_asset_3',
    title: 'Senior Engineering Team & Architecture Practice',
    category: 'team',
    tags: ['Team', 'DevOps', 'AI/ML', 'Full-Stack'],
    content:
      'Our dedicated squad comprises 1 Principal Software Architect (12+ yrs experience), 2 Senior Full-Stack Engineers, 1 AI/ML Systems Specialist, and 1 Certified AWS Solutions Architect. We operate in bi-weekly Agile sprints with transparent Jira/Linear tracking and weekly client demo sessions.',
    createdAt: '2026-10-01',
  },
  {
    id: 'k_asset_4',
    title: 'Standard Intellectual Property & Warranty Guarantee',
    category: 'legal_term',
    tags: ['IP', 'Warranty', 'Contract'],
    content:
      'Full, unrestricted intellectual property ownership of all custom software, repositories, design assets, and architectural schematics transfers permanently to the Client upon final payment milestone receipt. Includes a comprehensive 60-day post-launch warranty guaranteeing zero-cost resolution of critical defects.',
    createdAt: '2026-10-05',
  },
]

export function CompanyKnowledgeModal({
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
  const [assets, setAssets] = useState<CompanyKnowledgeAsset[]>(DEFAULT_ASSETS)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newCategory, setNewCategory] = useState<CompanyKnowledgeAsset['category']>('case_study')
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    async function load() {
      const stored = await storageGet<CompanyKnowledgeAsset[]>(STORAGE_KNOWLEDGE_KEY, DEFAULT_ASSETS)
      if (Array.isArray(stored) && stored.length > 0) {
        setAssets(stored)
      }
    }
    load()
  }, [])

  const handleSaveAsset = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error('Please enter an asset title and detailed content.')
      return
    }

    const newAsset: CompanyKnowledgeAsset = {
      id: `k_asset_${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      content: newContent.trim(),
      tags: [newCategory],
      createdAt: new Date().toISOString().slice(0, 10),
    }

    const updated = [newAsset, ...assets]
    setAssets(updated)
    await storageSet(STORAGE_KNOWLEDGE_KEY, updated)
    setNewTitle('')
    setNewContent('')
    setIsAdding(false)
    toast.success('Company knowledge asset added!')
  }

  const handleDeleteAsset = async (id: string) => {
    const updated = assets.filter((a) => a.id !== id)
    setAssets(updated)
    await storageSet(STORAGE_KNOWLEDGE_KEY, updated)
    toast.info('Knowledge asset removed.')
  }

  const handleInjectIntoProposal = (asset: CompanyKnowledgeAsset) => {
    // Find appropriate section
    let targetTitle = 'Technical Approach'
    if (asset.category === 'case_study') targetTitle = 'Executive Summary'
    if (asset.category === 'security' || asset.category === 'legal_term') targetTitle = 'Terms & Conditions'
    if (asset.category === 'team') targetTitle = 'Scope of Work'

    const secIndex = proposal.sections.findIndex(
      (s) => s.title.toLowerCase() === targetTitle.toLowerCase()
    )

    if (secIndex === -1) {
      toast.error(`Target section '${targetTitle}' not found.`)
      return
    }

    const targetSection = proposal.sections[secIndex]
    const injectionSnippet = `\n\n### Proven Experience & Capability: ${asset.title}\n${asset.content}\n`

    const updatedSections = [...proposal.sections]
    updatedSections[secIndex] = {
      ...targetSection,
      content: targetSection.content + injectionSnippet,
      isEdited: true,
    }

    const updatedProposal: GeneratedProposal = {
      ...proposal,
      sections: updatedSections,
      updatedAt: new Date().toISOString(),
    }

    onUpdateProposal(updatedProposal)
    toast.success(`Injected '${asset.title}' into '${targetSection.title}'!`)
  }

  const filteredAssets = assets.filter(
    (a) => selectedCategory === 'all' || a.category === selectedCategory
  )

  const getCategoryIcon = (category: CompanyKnowledgeAsset['category']) => {
    switch (category) {
      case 'case_study':
        return <Award className="h-4 w-4 text-amber-500" />
      case 'security':
        return <Shield className="h-4 w-4 text-emerald-500" />
      case 'team':
        return <Users className="h-4 w-4 text-blue-500" />
      case 'legal_term':
        return <FileCheck className="h-4 w-4 text-purple-500" />
      default:
        return <Layers className="h-4 w-4 text-indigo-500" />
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl border bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-primary">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground">Company Knowledge Base & Context Grounder</h2>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary uppercase tracking-wider">
                  RAG Grounding
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Persist authentic case studies, security credentials, and team capabilities to ground AI proposals in real evidence.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setIsAdding(!isAdding)}
              className="h-8 text-xs gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" /> {isAdding ? 'Cancel' : 'Add Knowledge Asset'}
            </Button>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Adding form */}
        {isAdding && (
          <div className="p-5 border-b bg-muted/30 space-y-3">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">New Knowledge Asset</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="Asset Title (e.g. Enterprise E-commerce Case Study)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full rounded-md border bg-background px-3 py-1.5 text-xs text-foreground"
                >
                  <option value="case_study">Case Study / Portfolio</option>
                  <option value="security">Security & Compliance</option>
                  <option value="team">Team & Squad Profile</option>
                  <option value="legal_term">Legal & Warranty Clause</option>
                  <option value="methodology">Engineering Methodology</option>
                </select>
              </div>
            </div>
            <div>
              <textarea
                rows={3}
                placeholder="Factual description, metrics, statistics, and verifiable claims..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="w-full rounded-md border bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveAsset}>
                Save Asset
              </Button>
            </div>
          </div>
        )}

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 border-b px-6 py-2.5 bg-muted/10 overflow-x-auto text-xs">
          {['all', 'case_study', 'security', 'team', 'legal_term'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Asset Cards Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className="group flex flex-col justify-between rounded-xl border bg-card p-4 hover:shadow-md transition space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(asset.category)}
                    <h4 className="text-xs font-bold text-foreground">{asset.title}</h4>
                  </div>
                  <button
                    onClick={() => handleDeleteAsset(asset.id)}
                    className="text-muted-foreground hover:text-rose-500 transition opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">
                  {asset.content}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-[10px] text-muted-foreground font-mono">
                  {asset.createdAt}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleInjectIntoProposal(asset)}
                  className="h-7 text-[11px] gap-1 text-primary hover:bg-primary/10 border-primary/30"
                >
                  <Sparkles className="h-3 w-3" /> Ground in Proposal
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-6 py-4 bg-muted/20">
          <p className="text-xs text-muted-foreground">
            Knowledge assets are securely persisted in local Anna Storage without external database leaks.
          </p>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  )
}
