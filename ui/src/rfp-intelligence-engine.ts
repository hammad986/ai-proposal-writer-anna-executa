/**
 * Aetherion Labs - Advanced RFP Intelligence Engine
 * Enterprise document understanding, semantic requirement shredding,
 * Bid/No-Bid evaluation, and compliance traceability matrix.
 */

export type RfpRequirementCategory =
  | 'mandatory'
  | 'functional'
  | 'non_functional'
  | 'security'
  | 'integration'
  | 'deliverables'
  | 'timeline'
  | 'commercial'
  | 'evaluation'
  | 'acceptance'
  | 'assumptions'
  | 'exclusions'

export type RfpComplianceStatus =
  | 'addressed_with_evidence'
  | 'partially_addressed'
  | 'requires_clarification'
  | 'not_addressed'
  | 'not_applicable'

export interface TraceableRfpRequirement {
  id: string
  code: string // e.g. REQ-M01, REQ-S02
  category: RfpRequirementCategory
  requirementText: string
  priority: 'high' | 'medium' | 'low'
  sourceSection: string
  sourceLine: number
  sourceSnippet: string
  targetProposalSection: string
  complianceStatus: RfpComplianceStatus
  evidenceOrResponse: string
  riskNotes?: string
  isApproved: boolean
}

export interface BidNoBidAssessment {
  score: number // 0 - 100
  verdict: 'STRONG_BID' | 'BID_WITH_CLARIFICATIONS' | 'HIGH_RISK_REVIEW' | 'NO_BID'
  winProbability: number
  keyStrengths: string[]
  criticalRisks: string[]
  clarificationQuestions: string[]
  mandatoryCount: number
  missingMandatoryCount: number
}

export interface ComprehensiveRfpMatrix {
  id: string
  title: string
  sourceDocumentName: string
  parsedAt: string
  totalClauses: number
  requirements: TraceableRfpRequirement[]
  assessment: BidNoBidAssessment
  complianceScore: number
  unaddressedCount: number
  clarificationCount: number
}

/**
 * Shreds complex RFP solicitations into structured, traceable requirements.
 */
export function analyzeRfpDocument(
  rawText: string,
  filename = 'Solicitation_Document.txt'
): ComprehensiveRfpMatrix {
  if (!rawText || !rawText.trim()) {
    return {
      id: `rfp_${Date.now()}`,
      title: 'Empty Solicitation Analysis',
      sourceDocumentName: filename,
      parsedAt: new Date().toISOString(),
      totalClauses: 0,
      requirements: [],
      assessment: {
        score: 0,
        verdict: 'NO_BID',
        winProbability: 0,
        keyStrengths: [],
        criticalRisks: ['Document contains no parsable text.'],
        clarificationQuestions: [],
        mandatoryCount: 0,
        missingMandatoryCount: 0,
      },
      complianceScore: 0,
      unaddressedCount: 0,
      clarificationCount: 0,
    }
  }

  const lines = rawText.split(/\r?\n/)
  const requirements: TraceableRfpRequirement[] = []

  let currentSection = 'General Specifications'
  let counter = 1

  const categoryCounters: Record<string, number> = {}

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const rawLine = lines[lineIdx].trim()
    if (!rawLine) continue

    // Detect Section Headings (Markdown, numbered e.g. 1.0, 2.1, or uppercase headers)
    const headingMatch = rawLine.match(/^(?:#{1,4}\s+|[0-9]{1,2}\.[0-9]{0,2}\s+|[A-Z\s]{4,30}:)(.*)/)
    if (headingMatch && rawLine.length < 80) {
      currentSection = rawLine.replace(/^[#*\d.:\s]+/, '').trim() || currentSection
      continue
    }

    const lower = rawLine.toLowerCase()

    // Classification Rules
    const isMandatory = /\b(shall|must|mandatory|strictly required|will be required to|is obligated)\b/i.test(lower)
    const isSecurity = /\b(soc2|hipaa|gdpr|pci-dss|encryption|tls|aes-256|penetration test|audit log|vulnerability|rbac|iso 27001)\b/i.test(lower)
    const isIntegration = /\b(api|webhook|salesforce|stripe|zendesk|postgresql|database|third-party|rest|graphql|oauth)\b/i.test(lower)
    const isNonFunctional = /\b(uptime|sla|latency|sub-[\d]+ms|throughput|concurrent|scalability|performance|99\.\d+%)\b/i.test(lower)
    const isTimeline = /\b(deadline|weeks|months|delivery schedule|due date|turnaround|milestone schedule|kickoff)\b/i.test(lower)
    const isCommercial = /\b(budget|pricing|cost|payment schedule|fixed price|rate card|invoice|deposit|liquidated damages)\b/i.test(lower)
    const isEvaluation = /\b(evaluation criteria|scoring weight|selection criteria|technical score|proposal weighting)\b/i.test(lower)
    const isDeliverable = /\b(deliverables?|source code|repository|documentation|training manual|handover|wireframes)\b/i.test(lower)
    const isAcceptance = /\b(acceptance testing|uat|warranty|sign-off|defect remediation|inspection period)\b/i.test(lower)
    const isExclusion = /\b(out of scope|excluded|not included|vendor shall not be responsible)\b/i.test(lower)
    const isAssumption = /\b(assumes that|client will provide|dependent upon|assumption)\b/i.test(lower)
    const isFunctional = /\b(system shall allow|user can|ability to|generate|export|workflow|manage|create|update)\b/i.test(lower)

    const isBullet = rawLine.startsWith('-') || rawLine.startsWith('*') || /^\d+\./.test(rawLine)

    if (
      isMandatory ||
      isSecurity ||
      isIntegration ||
      isNonFunctional ||
      isTimeline ||
      isCommercial ||
      isEvaluation ||
      isDeliverable ||
      isAcceptance ||
      isExclusion ||
      isAssumption ||
      isFunctional ||
      (isBullet && rawLine.length > 25)
    ) {
      const cleanText = rawLine.replace(/^[-*•\d.)]+\s*/, '').trim()
      if (cleanText.length < 12) continue

      let category: RfpRequirementCategory = 'functional'
      let targetProposalSection = 'Scope of Work & Deliverables'
      let priority: 'high' | 'medium' | 'low' = 'medium'
      let prefix = 'F'
      let complianceStatus: RfpComplianceStatus = 'not_addressed'
      let evidenceOrResponse = ''

      if (isSecurity) {
        category = 'security'
        priority = 'high'
        prefix = 'SEC'
        targetProposalSection = 'Security, Governance & Compliance'
        complianceStatus = 'addressed_with_evidence'
        evidenceOrResponse = 'Enforces TLS 1.3 in transit, AES-256 at rest, and audited RBAC.'
      } else if (isCommercial) {
        category = 'commercial'
        priority = 'high'
        prefix = 'COM'
        targetProposalSection = 'Commercial Investment & Terms'
        complianceStatus = 'requires_clarification'
        evidenceOrResponse = 'Contingent on agreed payment terms and advance schedule.'
      } else if (isTimeline) {
        category = 'timeline'
        priority = 'high'
        prefix = 'TIME'
        targetProposalSection = 'Implementation Timeline & Milestones'
        complianceStatus = 'partially_addressed'
        evidenceOrResponse = 'Phased milestone delivery schedule tailored to target deadline.'
      } else if (isNonFunctional) {
        category = 'non_functional'
        priority = 'high'
        prefix = 'NFR'
        targetProposalSection = 'Technical Architecture & Performance SLA'
        complianceStatus = 'addressed_with_evidence'
        evidenceOrResponse = 'Engineered with auto-scaling infrastructure and 99.9% uptime SLA.'
      } else if (isIntegration) {
        category = 'integration'
        priority = 'medium'
        prefix = 'INT'
        targetProposalSection = 'API & System Integrations'
        complianceStatus = 'addressed_with_evidence'
        evidenceOrResponse = 'Integrated via standard RESTful/GraphQL adapters.'
      } else if (isMandatory) {
        category = 'mandatory'
        priority = 'high'
        prefix = 'M'
        targetProposalSection = 'Mandatory Compliance & Architecture'
        complianceStatus = 'addressed_with_evidence'
        evidenceOrResponse = 'Fully committed; covered in Core Engineering Architecture.'
      } else if (isEvaluation) {
        category = 'evaluation'
        priority = 'medium'
        prefix = 'EVAL'
        targetProposalSection = 'Executive Summary & Alignment'
        complianceStatus = 'addressed_with_evidence'
        evidenceOrResponse = 'Structured to directly satisfy procurement scoring rubrics.'
      } else if (isDeliverable) {
        category = 'deliverables'
        priority = 'high'
        prefix = 'DEL'
        targetProposalSection = 'Scope of Work & Deliverables'
        complianceStatus = 'addressed_with_evidence'
        evidenceOrResponse = 'Includes repository handover, documentation, and source code.'
      } else if (isAcceptance) {
        category = 'acceptance'
        priority = 'medium'
        prefix = 'ACC'
        targetProposalSection = 'Terms, Warranties & Governance'
        complianceStatus = 'addressed_with_evidence'
        evidenceOrResponse = 'Includes structured 10-day UAT sign-off and 30-day warranty.'
      } else if (isExclusion) {
        category = 'exclusions'
        priority = 'low'
        prefix = 'EXC'
        targetProposalSection = 'Scope Boundaries & Out-of-Scope Items'
        complianceStatus = 'not_applicable'
        evidenceOrResponse = 'Explicitly recorded as non-billable out-of-scope boundary.'
      } else if (isAssumption) {
        category = 'assumptions'
        priority = 'low'
        prefix = 'ASM'
        targetProposalSection = 'Operational Assumptions & Prerequisites'
        complianceStatus = 'requires_clarification'
        evidenceOrResponse = 'Requires client provision of staging access and credentials.'
      }

      categoryCounters[prefix] = (categoryCounters[prefix] || 0) + 1
      const code = `REQ-${prefix}${String(categoryCounters[prefix]).padStart(2, '0')}`

      requirements.push({
        id: `req_${counter++}`,
        code,
        category,
        requirementText: cleanText,
        priority,
        sourceSection: currentSection,
        sourceLine: lineIdx + 1,
        sourceSnippet: rawLine,
        targetProposalSection,
        complianceStatus,
        evidenceOrResponse,
        isApproved: true,
      })
    }
  }

  // Bid / No-Bid Assessment Synthesis
  const total = requirements.length
  const mandatoryItems = requirements.filter((r) => r.category === 'mandatory' || r.category === 'security')
  const highRiskItems = requirements.filter((r) => /liquidated damages|unlimited liability|penalty/i.test(r.requirementText))
  const unaddressedCount = requirements.filter((r) => r.complianceStatus === 'not_addressed').length
  const clarificationCount = requirements.filter((r) => r.complianceStatus === 'requires_clarification').length

  let score = 82
  const strengths: string[] = []
  const risks: string[] = []

  if (mandatoryItems.length > 0) {
    strengths.push(`Identified ${mandatoryItems.length} mandatory & security compliance standards with full technical feasibility.`)
  } else {
    strengths.push('Standard commercial delivery scope without prohibitive mandatory lock-in.')
  }

  if (highRiskItems.length > 0) {
    score -= 20
    risks.push(`Detected ${highRiskItems.length} high-liability commercial terms requiring contractual negotiation.`)
  }

  if (unaddressedCount > 3) {
    score -= 15
    risks.push(`${unaddressedCount} requirements currently lack affirmative proposal commitments.`)
  }

  if (clarificationCount > 0) {
    risks.push(`${clarificationCount} clauses contain ambiguous scope parameters.`)
  }

  score = Math.max(30, Math.min(96, score))

  let verdict: BidNoBidAssessment['verdict'] = 'STRONG_BID'
  if (score >= 80) verdict = 'STRONG_BID'
  else if (score >= 65) verdict = 'BID_WITH_CLARIFICATIONS'
  else if (score >= 50) verdict = 'HIGH_RISK_REVIEW'
  else verdict = 'NO_BID'

  const clarificationQuestions: string[] = [
    'Can the evaluation committee clarify the target API rate limits and daily transaction volume anticipated at peak hours?',
    'Will staging environments and third-party API test credentials be provisioned prior to sprint kickoff?',
    'Is the requested completion schedule fixed, or is a phased delivery with early functional MVP acceptable?',
  ]

  const assessment: BidNoBidAssessment = {
    score,
    verdict,
    winProbability: Math.round(score * 0.9),
    keyStrengths: strengths,
    criticalRisks: risks,
    clarificationQuestions,
    mandatoryCount: mandatoryItems.length,
    missingMandatoryCount: unaddressedCount,
  }

  const compliantCount = requirements.filter((r) => r.complianceStatus === 'addressed_with_evidence').length
  const complianceScore = total > 0 ? Math.round((compliantCount / total) * 100) : 100

  return {
    id: `rfp_${Date.now()}`,
    title: filename.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ') + ' Analysis',
    sourceDocumentName: filename,
    parsedAt: new Date().toISOString(),
    totalClauses: total,
    requirements,
    assessment,
    complianceScore,
    unaddressedCount,
    clarificationCount,
  }
}
