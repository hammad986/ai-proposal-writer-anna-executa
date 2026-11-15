import { useState, useEffect, useMemo, useRef } from 'react'
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
  Search,
  Upload,
  Eye,
  FileText,
  SlidersHorizontal,
  Tag,
  RefreshCw,
  HelpCircle,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { storageGet, storageSet } from '@/anna-bridge'
import {
  RagIndex,
  type KnowledgeDocument,
  type RagRetrievalResult,
  chunkDocument,
} from '@/rag-knowledge-engine'
import { AetherionLogo } from '@/components/branding/AetherionLogo'

const STORAGE_KNOWLEDGE_KEY = 'aetherion:company_knowledge_v3'

const DEFAULT_DOCUMENTS: KnowledgeDocument[] = [
  {
    id: 'k_1',
    title: 'Enterprise Fintech Mobile App Case Study',
    category: 'case_study',
    tags: ['Fintech', 'React Native', 'AWS', 'Security'],
    rawContent:
      'Aetherion Labs engineered a high-throughput mobile trading platform for Apex Global handling $45M+ in monthly transaction volume with sub-100ms WebSocket price streaming and 99.99% uptime.\n\nThe system includes automated portfolio rebalancing, multi-broker FIX protocol order routing, and biometric authentication for zero-trust customer access.',
    sourceType: 'manual',
    createdAt: '2026-10-15',
    updatedAt: '2026-10-15',
  },
  {
    id: 'k_2',
    title: 'SOC2 Type II & HIPAA Security Architecture',
    category: 'security',
    tags: ['Security', 'SOC2', 'HIPAA', 'Encryption'],
    rawContent:
      'All systems engineered by Aetherion Labs enforce TLS 1.3 in transit, AES-256 for persistent databases, automated vulnerability scanning in GitHub Actions CI/CD pipelines, and audited role-based access control (RBAC).\n\nCustomer data isolation is enforced at the PostgreSQL schema layer with encrypted cryptographic tenant keys rotated every 90 days.',
    sourceType: 'manual',
    createdAt: '2026-10-20',
    updatedAt: '2026-10-20',
  },
  {
    id: 'k_3',
    title: 'Senior Engineering Team Squad Profile',
    category: 'team',
    tags: ['Team', 'DevOps', 'Architecture', 'AI'],
    rawContent:
      'Our core development squad includes 1 Principal Architect with 12+ years experience in distributed cloud systems, 2 Senior Full-Stack Engineers, 1 AI/ML Systems Specialist with LLM fine-tuning experience, and 1 Certified AWS Cloud Solutions Architect.\n\nAll engineers are full-time dedicated employees operating in unified sprint cadences with daily standups.',
    sourceType: 'manual',
    createdAt: '2026-11-01',
    updatedAt: '2026-11-01',
  },
  {
    id: 'k_4',
    title: 'Intellectual Property Transfer & 60-Day Warranty Term',
    category: 'legal_term',
    tags: ['Legal', 'IP', 'Warranty'],
    rawContent:
      'Full, unrestricted intellectual property ownership of all custom software, repositories, and design assets transfers permanently to the Client upon final milestone payment receipt.\n\nAetherion Labs includes an industry-leading 60-day post-launch warranty covering all defect remediation, bug fixes, and performance tuning at zero additional cost.',
    sourceType: 'manual',
    createdAt: '2026-11-05',
    updatedAt: '2026-11-05',
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
  const [documents, setDocuments] = useState<KnowledgeDocument[]>(DEFAULT_DOCUMENTS)
  const [isAdding, setIsAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState<KnowledgeDocument['category']>('case_study')
  const [newContent, setNewContent] = useState('')
  const [newTags, setNewTags] = useState('AI, Engineering')

  // Live RAG Search Simulator
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<RagRetrievalResult[]>([])
  const [inspectingDoc, setInspectingDoc] = useState<KnowledgeDocument | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load from Anna storage
  useEffect(() => {
    async function load() {
      const stored = await storageGet<KnowledgeDocument[]>(STORAGE_KNOWLEDGE_KEY, DEFAULT_DOCUMENTS)
      if (Array.isArray(stored) && stored.length > 0) {
        setDocuments(stored)
      }
    }
    load()
  }, [])

  // Build BM25 Index
  const ragIndex = useMemo(() => {
    return new RagIndex(documents)
  }, [documents])

  // Handle Search in Simulator
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }
    const results = ragIndex.search(searchQuery, 4, 0.2)
    setSearchResults(results)
  }, [searchQuery, ragIndex])

  const handleAddDocument = () => {
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error('Title and content are required.')
      return
    }

    const doc: KnowledgeDocument = {
      id: `doc_${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      rawContent: newContent.trim(),
      tags: newTags.split(',').map((t) => t.trim()).filter(Boolean),
      sourceType: 'manual',
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
    }

    const updated = [doc, ...documents]
    setDocuments(updated)
    storageSet(STORAGE_KNOWLEDGE_KEY, updated)

    setNewTitle('')
    setNewContent('')
    setIsAdding(false)
    toast.success(`Indexed new document into RAG knowledge engine (${chunkDocument(doc).length} chunks).`)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      if (content) {
        const title = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ')
        const doc: KnowledgeDocument = {
          id: `doc_${Date.now()}`,
          title: title.charAt(0).toUpperCase() + title.slice(1),
          category: 'case_study',
          rawContent: content.trim(),
          tags: ['File Import', file.name.split('.').pop()?.toUpperCase() || 'DOC'],
          sourceType: 'file_upload',
          fileName: file.name,
          createdAt: new Date().toISOString().slice(0, 10),
          updatedAt: new Date().toISOString().slice(0, 10),
        }

        const updated = [doc, ...documents]
        setDocuments(updated)
        storageSet(STORAGE_KNOWLEDGE_KEY, updated)
        toast.success(`Ingested & indexed "${file.name}" into RAG engine!`)
      }
    }
    reader.readAsText(file)
  }

  const handleDeleteDocument = (id: string) => {
    const updated = documents.filter((d) => d.id !== id)
    setDocuments(updated)
    storageSet(STORAGE_KNOWLEDGE_KEY, updated)
    if (inspectingDoc?.id === id) setInspectingDoc(null)
    toast.info('Document deleted from knowledge index.')
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              Production RAG Engine 3.0
            </span>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              Okapi-BM25 &amp; Context Grounding
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-foreground">
            Aetherion Labs Knowledge Base &amp; Context Grounder
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Store verified agency case studies, security certifications, team credentials, and legal guarantees. The RAG engine chunks, indexes, and retrieves facts with exact source citations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5" />
            Upload Document
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.json"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            size="sm"
            onClick={() => setIsAdding(!isAdding)}
            className="gap-1.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-md"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Knowledge Asset
          </Button>
        </div>
      </div>

      {/* Index Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-card p-3 shadow-2xs space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Indexed Documents</span>
          <p className="text-lg font-black text-foreground">{documents.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-3 shadow-2xs space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active Chunks</span>
          <p className="text-lg font-black text-primary">{ragIndex.getChunkCount()}</p>
        </div>
        <div className="rounded-xl border bg-card p-3 shadow-2xs space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Retrieval Model</span>
          <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 truncate">Okapi BM25</p>
        </div>
        <div className="rounded-xl border bg-card p-3 shadow-2xs space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Grounding Status</span>
          <p className="text-sm font-black text-foreground flex items-center gap-1">
            <Check className="h-3.5 w-3.5 text-emerald-500" /> Active
          </p>
        </div>
      </div>

      {/* Add Document Form Modal/Collapsible */}
      {isAdding && (
        <Card className="border-2 border-primary/30 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-foreground">Add Verified Company Knowledge</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Document / Asset Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., ISO 27001 Certification, Healthcare App Case Study"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="case_study">Case Study</option>
                  <option value="security">Security &amp; Compliance</option>
                  <option value="team">Team &amp; Personnel</option>
                  <option value="methodology">Delivery Methodology</option>
                  <option value="legal_term">Legal &amp; Warranty Terms</option>
                  <option value="pricing_catalog">Pricing Catalog</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Factual Document Content (Raw Text / Markdown)
              </label>
              <textarea
                rows={4}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Paste the factual narrative, metrics, certifications, or technical specifications..."
                className="w-full rounded-lg border bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="SOC2, AWS, Healthcare, React"
                className="w-full rounded-lg border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-end gap-2 border-t pt-3">
              <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddDocument} className="font-bold">
                Chunk &amp; Index Document
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live RAG Retrieval Simulator */}
      <Card className="border shadow-md bg-muted/10">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Live RAG Retrieval Simulator</h3>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">
              Simulates query retrieval used in Proposal Studio
            </span>
          </div>

          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Test query: e.g., 'fintech mobile app with SOC2 compliance and 60-day warranty'..."
              className="w-full rounded-xl border bg-background pl-10 pr-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Top Ranked Knowledge Chunks ({searchResults.length})
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {searchResults.map((res, i) => (
                  <div
                    key={res.chunk.id}
                    className="rounded-xl border bg-card p-3 shadow-xs space-y-2 hover:border-primary/50 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary font-mono">
                        Rank #{i + 1} &bull; Score: {res.score}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {res.citationLabel}
                      </span>
                    </div>
                    <p className="text-xs text-foreground leading-relaxed line-clamp-3">
                      {res.chunk.text}
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {res.matchedTerms.map((t) => (
                        <span
                          key={t}
                          className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded-md font-mono"
                        >
                          matched: {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stored Knowledge Asset Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">Indexed Knowledge Repository ({documents.length})</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((doc) => {
            const chunks = chunkDocument(doc)
            return (
              <Card
                key={doc.id}
                className="border hover:shadow-md transition bg-card overflow-hidden flex flex-col justify-between"
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                          {doc.category.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {chunks.length} chunks
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-foreground">{doc.title}</h4>
                    </div>

                    <button
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="text-muted-foreground hover:text-rose-500 p-1 transition cursor-pointer"
                      title="Delete document from RAG index"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                    {doc.rawContent}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {doc.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </CardContent>

                <div className="border-t bg-muted/10 px-5 py-2.5 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Source: {doc.sourceType}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="h-3 w-3" /> Grounding Enabled
                  </span>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
