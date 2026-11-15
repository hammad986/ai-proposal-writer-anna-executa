import { useState, useEffect } from 'react'
import {
  BookOpen,
  Plus,
  Trash2,
  Shield,
  Award,
  Users,
  FileCheck,
  Layers,
  Sparkles,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { storageGet, storageSet } from '@/anna-bridge'
import type { CompanyKnowledgeAsset } from '@/types'

const STORAGE_KNOWLEDGE_KEY = 'ai-proposal-writer:company_knowledge'

const DEFAULT_ASSETS: CompanyKnowledgeAsset[] = [
  {
    id: 'k_1',
    title: 'Enterprise Fintech Mobile App Case Study',
    category: 'case_study',
    tags: ['Fintech', 'React Native', 'AWS', 'Security'],
    content: 'Engineered a high-throughput mobile trading platform for Apex Global handling $45M+ in monthly transaction volume with sub-100ms WebSocket price streaming and 99.99% uptime.',
    createdAt: '2026-10-15',
  },
  {
    id: 'k_2',
    title: 'SOC2 Type II & HIPAA Compliance Standards',
    category: 'security',
    tags: ['Security', 'SOC2', 'HIPAA', 'Encryption'],
    content: 'All systems enforce TLS 1.3 in transit, AES-256 at rest, automated vulnerability scanning in GitHub Actions CI/CD pipelines, and audited role-based access control (RBAC).',
    createdAt: '2026-10-20',
  },
  {
    id: 'k_3',
    title: 'Senior Engineering Team Squad Profile',
    category: 'team',
    tags: ['Team', 'DevOps', 'Architecture', 'AI'],
    content: 'Our core development squad includes 1 Principal Architect (12+ yrs experience), 2 Senior Full-Stack Engineers, 1 AI/ML Systems Specialist, and 1 Certified AWS Cloud Architect.',
    createdAt: '2026-11-01',
  },
  {
    id: 'k_4',
    title: 'Intellectual Property & 60-Day Warranty Term',
    category: 'legal_term',
    tags: ['Legal', 'IP', 'Warranty'],
    content: 'Full, unrestricted intellectual property ownership of all custom software, repositories, and design assets transfers permanently to the Client upon final milestone payment receipt. Includes a 60-day post-launch warranty.',
    createdAt: '2026-11-05',
  },
]

export function CompanyKnowledgeView({
  toast,
}: {
  toast: {
    success: (msg: string) => void
    error: (msg: string) => void
    info: (msg: string) => void
  }
}) {
  const [assets, setAssets] = useState<CompanyKnowledgeAsset[]>(DEFAULT_ASSETS)
  const [isAdding, setIsAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState<CompanyKnowledgeAsset['category']>('case_study')
  const [newContent, setNewContent] = useState('')

  useEffect(() => {
    async function load() {
      const stored = await storageGet<CompanyKnowledgeAsset[]>(STORAGE_KNOWLEDGE_KEY, DEFAULT_ASSETS)
      if (Array.isArray(stored) && stored.length > 0) {
        setAssets(stored)
      }
    }
    load()
  }, [])

  const handleSave = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error('Please enter asset title and detailed factual content.')
      return
    }

    const newAsset: CompanyKnowledgeAsset = {
      id: `k_${Date.now()}`,
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
    toast.success('Knowledge asset persisted!')
  }

  const handleDelete = async (id: string) => {
    const updated = assets.filter((a) => a.id !== id)
    setAssets(updated)
    await storageSet(STORAGE_KNOWLEDGE_KEY, updated)
    toast.info('Asset removed.')
  }

  const getIcon = (cat: CompanyKnowledgeAsset['category']) => {
    switch (cat) {
      case 'case_study':
        return <Award className="h-4 w-4 text-amber-500" />
      case 'security':
        return <Shield className="h-4 w-4 text-emerald-500" />
      case 'team':
        return <Users className="h-4 w-4 text-blue-500" />
      default:
        return <FileCheck className="h-4 w-4 text-purple-500" />
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-bold text-primary flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              Company Knowledge 3.0
            </span>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
              Local RAG Grounding
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-foreground">
            Agency Knowledge Base & Context Grounder
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Store verified agency case studies, security certifications, team credentials, and legal guarantees. AI Proposal Studio injects these verified facts to eliminate hallucinations.
          </p>
        </div>

        <Button
          onClick={() => setIsAdding(!isAdding)}
          className="text-xs font-semibold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus className="h-4 w-4" />
          <span>{isAdding ? 'Cancel' : 'Add Knowledge Asset'}</span>
        </Button>
      </div>

      {/* Add form */}
      {isAdding && (
        <Card className="border-2 border-primary/40 bg-card shadow-lg p-6 space-y-4">
          <h3 className="text-sm font-bold text-foreground">New Verified Knowledge Asset</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Asset Title (e.g. Healthcare Clinical Portal Case Study)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="case_study">Case Study / Portfolio</option>
                <option value="security">Security & Compliance</option>
                <option value="team">Team & Squad Profile</option>
                <option value="legal_term">Legal & Warranty Term</option>
              </select>
            </div>
          </div>
          <textarea
            rows={4}
            placeholder="Enter verifiable facts, architectural specs, metrics, and deliverable commitments..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            className="w-full rounded-lg border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              Save to Knowledge Base
            </Button>
          </div>
        </Card>
      )}

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {assets.map((asset) => (
          <Card key={asset.id} className="border bg-card hover:shadow-md transition p-5 space-y-3 relative group">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50">
                  {getIcon(asset.category)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">{asset.title}</h4>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {asset.category.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleDelete(asset.id)}
                className="text-muted-foreground hover:text-rose-500 opacity-0 group-hover:opacity-100 transition p-1"
                title="Delete Asset"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {asset.content}
            </p>

            <div className="flex items-center justify-between pt-2 border-t text-[10px] text-muted-foreground">
              <span>Added: {asset.createdAt}</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="h-3 w-3" /> Grounding Enabled
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
