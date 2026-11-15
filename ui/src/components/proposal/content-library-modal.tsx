import React, { useState } from 'react'
import {
  X,
  BookOpen,
  Search,
  Plus,
  Check,
  Tag,
  ShieldCheck,
  Award,
  Layers,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react'
import type { ContentLibraryBlock, ProposalSection } from '../../types'
import { defaultContentLibrary } from '../../defaults'

interface ContentLibraryModalProps {
  isOpen: boolean
  onClose: () => void
  onInsertSection: (section: ProposalSection) => void
  customBlocks?: ContentLibraryBlock[]
}

export const ContentLibraryModal: React.FC<ContentLibraryModalProps> = ({
  isOpen,
  onClose,
  onInsertSection,
  customBlocks = [],
}) => {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [insertedId, setInsertedId] = useState<string | null>(null)

  if (!isOpen) return null

  const allBlocks = [...customBlocks, ...defaultContentLibrary]

  const categories = [
    { id: 'all', label: 'All Blocks' },
    { id: 'case_study', label: 'Case Studies' },
    { id: 'security', label: 'Security & Compliance' },
    { id: 'agency', label: 'Agile & Squad' },
    { id: 'warranty', label: 'Warranties & SLA' },
    { id: 'tech_stack', label: 'Architecture' },
    { id: 'terms', label: 'Terms & Escrow' },
  ]

  const filteredBlocks = allBlocks.filter((b) => {
    const matchesCategory = selectedCategory === 'all' || b.category === selectedCategory
    const matchesSearch =
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.description.toLowerCase().includes(search.toLowerCase()) ||
      b.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  const handleInsert = (block: ContentLibraryBlock) => {
    const newSection: ProposalSection = {
      id: `sec_${Date.now()}`,
      title: block.title,
      content: block.content,
      type: block.format,
      isEdited: false,
    }

    onInsertSection(newSection)
    setInsertedId(block.id)
    setTimeout(() => {
      setInsertedId(null)
      onClose()
    }, 600)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl max-h-[85vh] bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Agency Content Library</h3>
              <p className="text-xs text-zinc-400">
                Browse and insert pre-approved, battle-tested proposal sections
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="p-4 border-b border-zinc-800/80 bg-zinc-900/40 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search blocks by title, keywords, or tags (e.g. SOC2, SLA, ROI, Agile)..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`py-1 px-3 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content List */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {filteredBlocks.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-xs space-y-1">
              <p>No reusable blocks match your criteria.</p>
              <p className="text-[11px] text-zinc-600">Try adjusting your search terms or category filter.</p>
            </div>
          ) : (
            filteredBlocks.map((block) => (
              <div
                key={block.id}
                className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-all space-y-3 group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
                        {block.category.replace('_', ' ')}
                      </span>
                      <h4 className="text-sm font-semibold text-zinc-100 group-hover:text-indigo-300 transition-colors">
                        {block.title}
                      </h4>
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-2">{block.description}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleInsert(block)}
                    disabled={insertedId === block.id}
                    className={`py-1.5 px-3.5 rounded-lg text-xs font-medium flex items-center gap-1.5 shrink-0 transition-all ${
                      insertedId === block.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm hover:shadow'
                    }`}
                  >
                    {insertedId === block.id ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Inserted!
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        Insert Block
                      </>
                    )}
                  </button>
                </div>

                {/* Preview Snippet */}
                <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80 text-[11px] font-mono text-zinc-400 max-h-24 overflow-y-auto whitespace-pre-wrap">
                  {block.content}
                </div>

                {/* Tags */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[10px]">
                  {block.tags.map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-medium flex items-center gap-1"
                    >
                      <Tag className="w-2.5 h-2.5 text-zinc-500" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
          <span>{filteredBlocks.length} available content block(s)</span>
          <button
            onClick={onClose}
            className="py-1.5 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
