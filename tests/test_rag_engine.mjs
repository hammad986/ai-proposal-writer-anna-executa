import test from 'node:test'
import assert from 'node:assert/strict'

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were', 'will',
  'with', 'the', 'this', 'our', 'we', 'they', 'their', 'you', 'your', 'all', 'any'
])

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
}

function chunkDocument(doc, maxWordsPerChunk = 60) {
  const paragraphs = doc.rawContent
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)

  const chunks = []
  let chunkIndex = 1

  for (const para of paragraphs) {
    const words = para.split(/\s+/)
    chunks.push({
      id: `${doc.id}_c${chunkIndex}`,
      documentId: doc.id,
      documentTitle: doc.title,
      category: doc.category,
      chunkIndex: chunkIndex++,
      text: para,
      wordCount: words.length,
    })
  }
  return chunks
}

class TestRagIndex {
  constructor(documents = []) {
    this.chunks = []
    this.invertedIndex = new Map()
    this.docLengths = new Map()
    this.avgDocLength = 0

    let totalWords = 0
    for (const doc of documents) {
      const docChunks = chunkDocument(doc)
      for (const chunk of docChunks) {
        this.chunks.push(chunk)
        const tokens = tokenize(chunk.text + ' ' + chunk.documentTitle)
        this.docLengths.set(chunk.id, tokens.length)
        totalWords += tokens.length

        const freqMap = new Map()
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

  search(query, topK = 4, threshold = 0.4) {
    const queryTokens = tokenize(query)
    if (queryTokens.length === 0 || this.chunks.length === 0) return []

    const k1 = 1.5
    const b = 0.75
    const N = this.chunks.length
    const scores = new Map()

    for (const token of queryTokens) {
      const postings = this.invertedIndex.get(token)
      if (!postings) continue

      const df = postings.length
      const idf = Math.log((N - df + 0.5) / (df + 0.5) + 1)

      for (const { chunkId, freq } of postings) {
        const docLen = this.docLengths.get(chunkId) || this.avgDocLength
        const tf = (freq * (k1 + 1)) / (freq + k1 * (1 - b + b * (docLen / this.avgDocLength)))
        const termScore = idf * tf
        scores.set(chunkId, (scores.get(chunkId) || 0) + termScore)
      }
    }

    const chunkMap = new Map(this.chunks.map((c) => [c.id, c]))
    return Array.from(scores.entries())
      .filter(([_, score]) => score >= threshold)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topK)
      .map(([id, score]) => ({
        chunk: chunkMap.get(id),
        score: Math.round(score * 100) / 100,
        citationLabel: `[Source: ${chunkMap.get(id).documentTitle}]`,
      }))
  }
}

const SAMPLE_DOCS = [
  {
    id: 'doc_sec',
    title: 'SOC2 Type II & HIPAA Security Standards',
    category: 'security',
    rawContent:
      'Aetherion Labs enforces TLS 1.3 in transit, AES-256 at rest, automated vulnerability scanning in GitHub Actions CI/CD pipelines, and audited role-based access control (RBAC).\n\nAll infrastructure is audited annually against SOC2 Type II criteria and meets HIPAA healthcare data privacy mandates.',
  },
  {
    id: 'doc_case',
    title: 'Enterprise Fintech Mobile App Case Study',
    category: 'case_study',
    rawContent:
      'Engineered a high-throughput mobile trading platform for Apex Global handling $45M+ in monthly transaction volume with sub-100ms WebSocket price streaming and 99.99% uptime.',
  },
  {
    id: 'doc_team',
    title: 'Senior Engineering Team Squad Profile',
    category: 'team',
    rawContent:
      'Our development squad includes 1 Principal Architect with 12+ years experience, 2 Senior Full-Stack Engineers, 1 AI/ML Systems Specialist, and 1 Certified AWS Cloud Architect.',
  },
]

test('RAG Engine: Exact fact retrieval ranks security chunk as Rank 1', () => {
  const index = new TestRagIndex(SAMPLE_DOCS)
  const results = index.search('SOC2 Type II and HIPAA encryption standards')

  assert.ok(results.length > 0, 'Must retrieve matching chunks')
  assert.equal(results[0].chunk.documentId, 'doc_sec', 'Rank 1 must be the security document')
  assert.match(results[0].citationLabel, /SOC2/, 'Citation label must reference document title')
})

test('RAG Engine: Multi-document retrieval extracts relevant diverse sources', () => {
  const index = new TestRagIndex(SAMPLE_DOCS)
  const results = index.search('fintech mobile trading platform with certified AWS cloud architect', 2)

  assert.equal(results.length, 2, 'Must retrieve top 2 diverse matching documents')
  const docIds = results.map((r) => r.chunk.documentId)
  assert.ok(docIds.includes('doc_case'), 'Must include case study')
  assert.ok(docIds.includes('doc_team'), 'Must include team profile')
})

test('RAG Engine: Irrelevant query drops below threshold with 0 false matches', () => {
  const index = new TestRagIndex(SAMPLE_DOCS)
  const results = index.search('deep sea oceanography submarine exploration')

  assert.equal(results.length, 0, 'Must return 0 false positive chunks for irrelevant query')
})
