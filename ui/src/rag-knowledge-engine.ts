/**
 * Aetherion Labs - Production-Grade RAG Knowledge Engine
 * Implements Document Ingestion, Semantic Chunking, Inverted Indexing,
 * Okapi-BM25 Retrieval, Contextual Reranking, and Source Citation.
 */

export interface KnowledgeDocument {
  id: string
  title: string
  category: 'case_study' | 'security' | 'team' | 'methodology' | 'legal_term' | 'pricing_catalog'
  rawContent: string
  tags: string[]
  createdAt: string
  updatedAt: string
  sourceType: 'manual' | 'file_upload' | 'proposal_import'
  fileName?: string
}

export interface KnowledgeChunk {
  id: string
  documentId: string
  documentTitle: string
  category: KnowledgeDocument['category']
  chunkIndex: number
  text: string
  wordCount: number
  tags: string[]
}

export interface RagRetrievalResult {
  chunk: KnowledgeChunk
  score: number // BM25 relevance score
  matchedTerms: string[]
  citationLabel: string // e.g. "[Source: SOC2 Standards, Chunk 1]"
}

export interface GroundedContext {
  retrievedChunks: RagRetrievalResult[]
  formattedContextPrompt: string
  citations: Array<{ id: string; title: string; category: string; snippet: string }>
}

export const DEFAULT_KNOWLEDGE_DOCUMENTS: KnowledgeDocument[] = [
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

// Stop words for high-accuracy token filtering
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were', 'will',
  'with', 'the', 'this', 'our', 'we', 'they', 'their', 'you', 'your', 'all', 'any'
])

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
}

/**
 * Splits document content into semantic paragraphs and sliding-window chunks.
 */
export function chunkDocument(doc: KnowledgeDocument, maxWordsPerChunk = 80, overlapWords = 15): KnowledgeChunk[] {
  const paragraphs = doc.rawContent
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)

  const chunks: KnowledgeChunk[] = []
  let chunkIndex = 1

  for (const para of paragraphs) {
    const words = para.split(/\s+/)
    if (words.length <= maxWordsPerChunk) {
      chunks.push({
        id: `${doc.id}_c${chunkIndex}`,
        documentId: doc.id,
        documentTitle: doc.title,
        category: doc.category,
        chunkIndex: chunkIndex++,
        text: para,
        wordCount: words.length,
        tags: doc.tags,
      })
    } else {
      // Sliding window over long paragraphs
      let start = 0
      while (start < words.length) {
        const end = Math.min(start + maxWordsPerChunk, words.length)
        const chunkWords = words.slice(start, end)
        chunks.push({
          id: `${doc.id}_c${chunkIndex}`,
          documentId: doc.id,
          documentTitle: doc.title,
          category: doc.category,
          chunkIndex: chunkIndex++,
          text: chunkWords.join(' '),
          wordCount: chunkWords.length,
          tags: doc.tags,
        })
        start += maxWordsPerChunk - overlapWords
      }
    }
  }

  return chunks
}

/**
 * Okapi BM25 Index & Retrieval Engine
 */
export class RagIndex {
  private chunks: KnowledgeChunk[] = []
  private invertedIndex: Map<string, Array<{ chunkId: string; freq: number }>> = new Map()
  private docLengths: Map<string, number> = new Map()
  private avgDocLength = 0

  constructor(documents: KnowledgeDocument[] = []) {
    this.indexDocuments(documents)
  }

  public indexDocuments(documents: KnowledgeDocument[]) {
    this.chunks = []
    this.invertedIndex.clear()
    this.docLengths.clear()

    let totalWords = 0

    // 1. Chunk all documents
    for (const doc of documents) {
      const docChunks = chunkDocument(doc)
      for (const chunk of docChunks) {
        this.chunks.push(chunk)
        const tokens = tokenize(chunk.text + ' ' + chunk.documentTitle + ' ' + chunk.tags.join(' '))
        this.docLengths.set(chunk.id, tokens.length)
        totalWords += tokens.length

        // Frequency mapping
        const freqMap = new Map<string, number>()
        for (const token of tokens) {
          freqMap.set(token, (freqMap.get(token) || 0) + 1)
        }

        for (const [term, freq] of freqMap.entries()) {
          const posting = this.invertedIndex.get(term) || []
          posting.push({ chunkId: chunk.id, freq })
          this.invertedIndex.set(term, posting)
        }
      }
    }

    this.avgDocLength = this.chunks.length > 0 ? totalWords / this.chunks.length : 1
  }

  /**
   * Performs BM25 ranked retrieval against the indexed knowledge base.
   */
  public search(query: string, topK = 4, minScoreThreshold = 0.5): RagRetrievalResult[] {
    const queryTokens = tokenize(query)
    if (queryTokens.length === 0 || this.chunks.length === 0) return []

    const k1 = 1.5
    const b = 0.75
    const N = this.chunks.length

    const scores = new Map<string, { score: number; matched: Set<string> }>()

    for (const token of queryTokens) {
      const postings = this.invertedIndex.get(token)
      if (!postings) continue

      // Compute Inverse Document Frequency (IDF)
      const df = postings.length
      const idf = Math.log((N - df + 0.5) / (df + 0.5) + 1)

      for (const { chunkId, freq } of postings) {
        const docLen = this.docLengths.get(chunkId) || this.avgDocLength
        const tf = (freq * (k1 + 1)) / (freq + k1 * (1 - b + b * (docLen / this.avgDocLength)))
        const termScore = idf * tf

        const current = scores.get(chunkId) || { score: 0, matched: new Set() }
        current.score += termScore
        current.matched.add(token)
        scores.set(chunkId, current)
      }
    }

    // Rank, filter and map
    const results: RagRetrievalResult[] = []
    const chunkMap = new Map<string, KnowledgeChunk>(this.chunks.map((c) => [c.id, c]))

    const sortedEntries = Array.from(scores.entries())
      .filter(([_, data]) => data.score >= minScoreThreshold)
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, topK)

    for (const [chunkId, data] of sortedEntries) {
      const chunk = chunkMap.get(chunkId)
      if (chunk) {
        results.push({
          chunk,
          score: Math.round(data.score * 100) / 100,
          matchedTerms: Array.from(data.matched),
          citationLabel: `[Source: ${chunk.documentTitle}, Chunk ${chunk.chunkIndex}]`,
        })
      }
    }

    return results
  }

  /**
   * Synthesizes grounded prompt context from relevant proposal parameters.
   */
  public buildGroundedContext(proposalScopeQuery: string): GroundedContext {
    const results = this.search(proposalScopeQuery, 4, 0.4)

    if (results.length === 0) {
      return {
        retrievedChunks: [],
        formattedContextPrompt: '',
        citations: [],
      }
    }

    const formattedPrompt =
      `### VERIFIED AETHERION LABS KNOWLEDGE EVIDENCE (RAG GROUNDING)\n` +
      `The following verified company facts, case studies, and compliance standards MUST be used to eliminate hallucinations:\n\n` +
      results
        .map(
          (r, idx) =>
            `--- Evidence ${idx + 1} ${r.citationLabel} [Category: ${r.chunk.category}] ---\n${r.chunk.text}`
        )
        .join('\n\n')

    const citations = results.map((r) => ({
      id: r.chunk.id,
      title: r.chunk.documentTitle,
      category: r.chunk.category,
      snippet: r.chunk.text.slice(0, 140) + '...',
    }))

    return {
      retrievedChunks: results,
      formattedContextPrompt: formattedPrompt,
      citations,
    }
  }

  public getChunkCount(): number {
    return this.chunks.length
  }
}
