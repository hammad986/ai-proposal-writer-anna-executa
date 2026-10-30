import test from 'node:test'
import assert from 'node:assert/strict'

function formatCurrency(value, currency = 'USD') {
  const localeMap = {
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB',
    INR: 'en-IN',
    CAD: 'en-CA',
    AUD: 'en-AU',
  }
  try {
    return new Intl.NumberFormat(localeMap[currency] || 'en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `${currency} ${value.toLocaleString()}`
  }
}

function calculatePricingTotals(pricing) {
  if (!pricing || !Array.isArray(pricing.items)) {
    return {
      subtotal: 0,
      optionalTotal: 0,
      selectedTotal: 0,
      discountAmount: 0,
      taxableAmount: 0,
      taxAmount: 0,
      grandTotal: 0,
      depositAmount: 0,
    }
  }

  let subtotal = 0
  let optionalTotal = 0
  let selectedTotal = 0

  for (const item of pricing.items) {
    const itemTotal = (item.quantity || 1) * (item.unitRate || 0)
    if (item.isOptional) {
      optionalTotal += itemTotal
      if (item.isSelected) {
        selectedTotal += itemTotal
      }
    } else {
      subtotal += itemTotal
      selectedTotal += itemTotal
    }
  }

  const discountRate = Math.max(0, Math.min(100, pricing.discountPercent || 0)) / 100
  const discountAmount = Math.round(selectedTotal * discountRate)
  const taxableAmount = Math.max(0, selectedTotal - discountAmount)

  const taxRate = Math.max(0, Math.min(100, pricing.taxPercent || 0)) / 100
  const taxAmount = Math.round(taxableAmount * taxRate)

  const grandTotal = taxableAmount + taxAmount

  const depositRate = Math.max(0, Math.min(100, pricing.depositPercent || 40)) / 100
  const depositAmount = Math.round(grandTotal * depositRate)

  return {
    subtotal,
    optionalTotal,
    selectedTotal,
    discountAmount,
    taxableAmount,
    taxAmount,
    grandTotal,
    depositAmount,
  }
}

function auditProposalLocally(proposal) {
  const sections = proposal.sections || []
  const secTitles = sections.map((s) => s.title.toLowerCase())
  const totalWords = sections.reduce((sum, s) => sum + (s.content ? s.content.split(/\s+/).length : 0), 0)

  const hasExec = secTitles.some((t) => t.includes('executive') || t.includes('summary'))
  const hasScope = secTitles.some((t) => t.includes('scope') || t.includes('deliverable') || t.includes('feature'))
  const hasTech = secTitles.some((t) => t.includes('technical') || t.includes('architecture') || t.includes('approach'))
  const hasTimeline = secTitles.some((t) => t.includes('timeline') || t.includes('milestone') || t.includes('phase'))
  const hasPricing = secTitles.some((t) => t.includes('pricing') || t.includes('investment') || t.includes('budget'))
  const hasTerms = secTitles.some((t) => t.includes('term') || t.includes('condition') || t.includes('warranty'))

  const completeness = Math.min(
    100,
    (hasExec ? 15 : 0) +
      (hasScope ? 20 : 0) +
      (hasTech ? 15 : 0) +
      (hasTimeline ? 20 : 0) +
      (hasPricing ? 20 : 0) +
      (hasTerms ? 10 : 0)
  )

  const clarity = totalWords > 700 ? 92 : totalWords > 400 ? 82 : totalWords > 200 ? 70 : 50

  const bullets = sections.reduce(
    (count, s) => count + (s.content.match(/^[-*•]\s+/gm) || []).length,
    0
  )
  const scopeSpecificity = Math.min(98, Math.max(50, 60 + bullets * 3))
  const hasTable = sections.some((s) => s.content.includes('|'))
  const pricingIntegrity = hasPricing && hasTable ? 94 : hasPricing ? 80 : 45

  const hasRisks = sections.some(
    (s) =>
      s.content.toLowerCase().includes('risk') ||
      s.content.toLowerCase().includes('warranty') ||
      s.content.toLowerCase().includes('contingency') ||
      s.content.toLowerCase().includes('mitigation')
  )
  const riskCoverage = hasRisks ? 90 : 60

  const hasNext = secTitles.some(
    (t) => t.includes('next') || t.includes('step') || t.includes('kickoff') || t.includes('action')
  )
  const actionability = hasNext ? 95 : 65

  const overallScore = Math.round(
    completeness * 0.25 +
      clarity * 0.15 +
      scopeSpecificity * 0.20 +
      pricingIntegrity * 0.20 +
      riskCoverage * 0.10 +
      actionability * 0.10
  )

  const grade =
    overallScore >= 90 ? 'A' : overallScore >= 75 ? 'B' : overallScore >= 60 ? 'C' : 'Needs Improvement'

  const strengths = []
  if (hasScope && bullets >= 4) {
    strengths.push('Granular scope of work with itemized deliverable breakdown.')
  }
  if (hasTimeline) {
    strengths.push('Clear delivery phases providing structured timeline visibility.')
  }
  if (pricingIntegrity >= 85) {
    strengths.push('Transparent investment breakdown with explicit milestone payment terms.')
  }
  if (hasExec) {
    strengths.push('Executive summary establishing clear client business problem alignment.')
  }
  if (strengths.length === 0) {
    strengths.push('Foundational proposal structure established.')
  }

  const recommendations = []
  const missingCriticalItems = []

  if (!hasTerms) {
    recommendations.push('Include explicit Terms & Conditions covering IP transfer, warranty period, and revisions.')
    missingCriticalItems.push('Terms & Conditions')
  }
  if (!hasTable && hasPricing) {
    recommendations.push('Convert investment text into an itemized tabular format for transparent client review.')
  }
  if (!hasRisks) {
    recommendations.push('Add a Risk Mitigation & Dependency section to build client trust and demonstrate foresight.')
    missingCriticalItems.push('Risk Mitigation Matrix')
  }
  if (!hasNext) {
    recommendations.push('Add an unambiguous Next Steps section outlining contract signature and kickoff scheduling.')
    missingCriticalItems.push('Next Steps / Call to Action')
  }

  return {
    overallScore,
    grade,
    metrics: {
      completeness,
      clarity,
      pricingIntegrity,
      scopeSpecificity,
      riskCoverage,
      actionability,
    },
    strengths,
    actionableRecommendations: recommendations,
    missingCriticalItems,
    lastAuditedAt: new Date().toISOString(),
  }
}

function extractBriefLocally(briefText) {
  const text = briefText.trim()
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)

  let clientCompany = 'Client Organization'
  let clientName = 'Client Partner'
  let projectName = 'Custom Software Solution'
  let budgetRange = '$15,000 – $25,000'

  let companyMatch = text.match(/(?:company|organization|client|at)\s+([A-Za-z0-9 &]+?)(?:\.|\n|!|\s+we|\s+our|$)/i)
  if (!companyMatch) {
    companyMatch = text.match(/(?:from)\s+([A-Za-z0-9 &]+?)(?:\.|\n|!|\s+we|\s+our|$)/i)
  }
  if (companyMatch) clientCompany = companyMatch[1].trim()

  let nameMatch = text.match(/(?:this is|i am|my name is|contact:?|name:?)\s+(?:dr\.?|mr\.?|ms\.?|mrs\.?)?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i)
  if (!nameMatch) {
    nameMatch = text.match(/(?:from|hi|hello)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:at|from|with)/i)
  }
  if (nameMatch) clientName = nameMatch[1].trim()

  const projMatch = text.match(/(?:project|building|develop|create|build)\s+(?:a|an|the|our)?\s*([A-Za-z0-9 &'-]+?)(?:\.|\n|!|\s+in|\s+for|$)/i)
  if (projMatch) {
    projectName = projMatch[1].trim()
  } else if (lines.length > 0) {
    projectName = lines[0].slice(0, 45)
  }

  const budgetMatch = text.match(/(\$|₹|€|£)\s?([0-9,]+(?:\s?-\s?[0-9,]+|\s?k)?)/i)
  if (budgetMatch) budgetRange = budgetMatch[0].trim()

  const rawBullets = lines
    .filter((l) => l.startsWith('-') || l.startsWith('*') || l.startsWith('•') || /^\d+\./.test(l))
    .map((l) => l.replace(/^[-*•\d.)\s]+/, '').trim())
    .filter(Boolean)

  const features = rawBullets.length > 0 ? rawBullets.slice(0, 6).join('\n') : lines.slice(0, 4).join('\n')

  return {
    clientName,
    clientCompany,
    projectName,
    problemStatement: text.slice(0, 350),
    keyFeatures: features,
    budgetRange,
    timeline: '4-6 weeks',
  }
}

test('calculatePricingTotals: computes subtotal, discount, tax and deposit deterministically', () => {
  const samplePricing = {
    pricingModel: 'fixed',
    currency: 'USD',
    items: [
      { id: '1', title: 'Design', category: 'design', quantity: 1, unitRate: 3000, isSelected: true },
      { id: '2', title: 'Dev', category: 'development', quantity: 2, unitRate: 4000, isSelected: true },
      { id: '3', title: 'SLA Support', category: 'consulting', quantity: 1, unitRate: 2000, isOptional: true, isSelected: false },
    ],
    discountPercent: 10,
    taxPercent: 5,
    depositPercent: 40,
    paymentTerms: '40-30-30',
  }

  const totals = calculatePricingTotals(samplePricing)

  // Subtotal = 3000 + (2 * 4000) = 11,000
  assert.equal(totals.subtotal, 11000)
  assert.equal(totals.optionalTotal, 2000)
  assert.equal(totals.selectedTotal, 11000)

  // 10% discount on 11,000 = 1,100 -> Taxable = 9,900
  assert.equal(totals.discountAmount, 1100)
  assert.equal(totals.taxableAmount, 9900)

  // 5% tax on 9,900 = 495 -> Grand total = 10,395
  assert.equal(totals.taxAmount, 495)
  assert.equal(totals.grandTotal, 10395)

  // 40% deposit on 10,395 = 4,158
  assert.equal(totals.depositAmount, 4158)
})

test('calculatePricingTotals: includes optional item when isSelected is true', () => {
  const samplePricing = {
    pricingModel: 'fixed',
    currency: 'USD',
    items: [
      { id: '1', title: 'Core', category: 'development', quantity: 1, unitRate: 5000, isSelected: true },
      { id: '2', title: 'Add-on', category: 'consulting', quantity: 1, unitRate: 2000, isOptional: true, isSelected: true },
    ],
    discountPercent: 0,
    taxPercent: 0,
    depositPercent: 50,
    paymentTerms: '50-50',
  }

  const totals = calculatePricingTotals(samplePricing)
  assert.equal(totals.subtotal, 5000)
  assert.equal(totals.optionalTotal, 2000)
  assert.equal(totals.selectedTotal, 7000)
  assert.equal(totals.grandTotal, 7000)
  assert.equal(totals.depositAmount, 3500)
})

test('auditProposalLocally: evaluates proposal quality accurately', () => {
  const mockProposal = {
    id: 'test_prop',
    title: 'Test Enterprise Proposal',
    subtitle: 'Prepared for Client Co',
    generatedDate: '2026-10-30',
    validUntil: '2026-11-29',
    status: 'draft',
    totalValue: '$15,000',
    createdAt: '2026-10-30',
    updatedAt: '2026-10-30',
    formData: {
      step1: { clientName: 'Alice', clientCompany: 'Client Co', projectName: 'Platform' },
    },
    sections: [
      { id: '1', title: 'Executive Summary', content: 'Comprehensive executive summary aligning on project goals and business value for Client Co.', type: 'text', isEdited: false },
      { id: '2', title: 'Scope of Work', content: '- Architecture\n- Core API\n- Frontend Portal\n- Cloud Deployment', type: 'list', isEdited: false },
      { id: '3', title: 'Timeline & Milestones', content: '## Phase 1: Build (3 weeks)\n- Implement core\n## Phase 2: Launch (1 week)\n- Go live', type: 'phases', isEdited: false },
      { id: '4', title: 'Investment & Pricing', content: '| Item | Cost |\n|---|---|\n| Core Dev | $15,000 |', type: 'table', isEdited: false },
      { id: '5', title: 'Terms & Conditions', content: 'Includes 90-day warranty support and full IP transfer.', type: 'text', isEdited: false },
      { id: '6', title: 'Next Steps', content: '1. Sign proposal\n2. Schedule technical kickoff meeting.', type: 'text', isEdited: false },
    ],
  }

  const audit = auditProposalLocally(mockProposal)
  assert.ok(audit.overallScore >= 75, `Expected score >= 75, got ${audit.overallScore}`)
  assert.ok(['A', 'B'].includes(audit.grade), `Expected grade A or B, got ${audit.grade}`)
  assert.ok(audit.strengths.length > 0, 'Should identify strengths')
  assert.equal(typeof audit.metrics.completeness, 'number')
  assert.equal(typeof audit.metrics.pricingIntegrity, 'number')
})

test('extractBriefLocally: correctly parses client, company, project and budget', () => {
  const sampleBrief = `
Hi from Jane Doe at Stellar Dynamics!
We are planning a project to develop an AI Customer Support Agent.
Our current problem is that customer support tickets take 48 hours to answer.
We need:
- Multi-channel ticket ingestion (Email, Chat)
- RAG search across Zendesk help center
- Automated response drafting with human approval
Budget is around $25,000 and we want to launch in 6 weeks.
  `

  const extracted = extractBriefLocally(sampleBrief)
  assert.equal(extracted.clientName, 'Jane Doe')
  assert.equal(extracted.clientCompany, 'Stellar Dynamics')
  assert.ok(extracted.problemStatement.includes('customer support tickets take 48 hours'))
  assert.ok(extracted.keyFeatures.includes('Multi-channel ticket ingestion'))
  assert.equal(extracted.budgetRange, '$25,000')
})

test('formatCurrency: handles different currency codes', () => {
  assert.ok(formatCurrency(15000, 'USD').includes('15,000'))
  assert.ok(formatCurrency(15000, 'GBP').includes('15,000') || formatCurrency(15000, 'GBP').includes('£'))
  assert.ok(formatCurrency(15000, 'INR').includes('15,000') || formatCurrency(15000, 'INR').includes('₹'))
})
