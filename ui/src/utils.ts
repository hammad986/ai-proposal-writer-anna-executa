import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type {
  CurrencyCode,
  GeneratedProposal,
  PricingStructure,
  QualityAuditResult,
} from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function currencyToNumber(value: string): number {
  if (!value) return 0
  const normalized = value.replace(/[^\d]/g, '')
  return Number(normalized || 0)
}

export function formatCurrency(value: number, currency: CurrencyCode = 'USD'): string {
  const localeMap: Record<CurrencyCode, string> = {
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB',
    INR: 'en-IN',
    CAD: 'en-CA',
    AUD: 'en-AU',
    AED: 'en-AE',
    SGD: 'en-SG',
    JPY: 'ja-JP',
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

export function formatCurrencyINR(value: number): string {
  return formatCurrency(value, 'INR')
}

export function formatLocalDate(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseLocalDate(isoStr: string): Date {
  const parts = isoStr.slice(0, 10).split('-')
  const y = Number(parts[0]) || 2026
  const m = Number(parts[1]) || 1
  const d = Number(parts[2]) || 1
  return new Date(y, m - 1, d)
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function addDaysToIso(isoDateStr: string, days: number): string {
  const dt = parseLocalDate(isoDateStr)
  dt.setDate(dt.getDate() + days)
  return formatLocalDate(dt)
}

export function getDaysRemaining(validUntilIso: string): number {
  if (!validUntilIso) return 30
  const valid = new Date(validUntilIso).getTime()
  const now = new Date().getTime()
  const diffDays = Math.ceil((valid - now) / 86400000)
  return isNaN(diffDays) ? 30 : diffDays
}

export function isoDate(date = new Date()): string {
  return formatLocalDate(date)
}

export function uid(prefix = 'proposal'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function parseTable(content: string): { headers: string[]; rows: string[][] } {
  const rows = content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.includes('|'))
    .map((line) =>
      line
        .split('|')
        .map((cell) => cell.trim())
        .filter(Boolean)
    )
    .filter((row) => row.length > 1)

  const filtered = rows.filter((row) => !row.every((cell) => /^-+$/.test(cell)))
  return {
    headers: filtered[0] || [],
    rows: filtered.slice(1),
  }
}

export interface ParsedPhase {
  number: string
  name: string
  duration: string
  tasks: string[]
}

export function parsePhases(content: string): ParsedPhase[] {
  return content
    .split(/(?=##\s*Phase)/g)
    .map((block, index) => {
      const lines = block
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
      const heading = lines[0] || `Phase ${index + 1}`
      const match = heading.match(/##\s*Phase\s*(\d+)?:?\s*(.*?)\s*(?:\((.*?)\))?$/i)
      return {
        number: match?.[1] || String(index + 1),
        name: match?.[2] || heading.replace(/^##\s*/, ''),
        duration: match?.[3] || '',
        tasks: lines
          .slice(1)
          .map((line) => line.replace(/^[-*]\s*/, ''))
          .filter(Boolean),
      }
    })
    .filter((phase) => phase.tasks.length > 0 || phase.name)
}

export interface PricingTotals {
  subtotal: number
  optionalTotal: number
  selectedTotal: number
  discountAmount: number
  taxableAmount: number
  taxAmount: number
  grandTotal: number
  depositAmount: number
}

export function calculatePricingTotals(pricing?: PricingStructure): PricingTotals {
  if (!pricing) {
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

  if (pricing.mode === 'tiered' && Array.isArray(pricing.tiers) && pricing.tiers.length > 0) {
    const activeTier =
      pricing.tiers.find((t) => t.id === pricing.selectedTierId) ||
      pricing.tiers.find((t) => t.isPopular) ||
      pricing.tiers[0]
    subtotal = activeTier ? activeTier.price : 0
    selectedTotal = subtotal
  } else if (Array.isArray(pricing.items)) {
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

export function auditProposalLocally(proposal: GeneratedProposal): QualityAuditResult {
  const sections = proposal.sections || []
  const secTitles = sections.map((s) => s.title.toLowerCase())
  const totalWords = sections.reduce((sum, s) => sum + (s.content ? s.content.split(/\s+/).length : 0), 0)

  const hasExec = secTitles.some((t) => t.includes('executive') || t.includes('summary'))
  const hasScope = secTitles.some((t) => t.includes('scope') || t.includes('deliverable') || t.includes('feature'))
  const hasTech = secTitles.some((t) => t.includes('technical') || t.includes('architecture') || t.includes('approach'))
  const hasTimeline = secTitles.some((t) => t.includes('timeline') || t.includes('milestone') || t.includes('phase'))
  const hasPricing = secTitles.some((t) => t.includes('pricing') || t.includes('investment') || t.includes('budget'))
  const hasTerms = secTitles.some((t) => t.includes('term') || t.includes('condition') || t.includes('warranty'))

  // Completeness (0-100)
  const completeness = Math.min(
    100,
    (hasExec ? 15 : 0) +
      (hasScope ? 20 : 0) +
      (hasTech ? 15 : 0) +
      (hasTimeline ? 20 : 0) +
      (hasPricing ? 20 : 0) +
      (hasTerms ? 10 : 0)
  )

  // Clarity (0-100)
  const clarity = totalWords > 700 ? 92 : totalWords > 400 ? 82 : totalWords > 200 ? 70 : 50

  // Scope Specificity (0-100)
  const bullets = sections.reduce(
    (count, s) => count + (s.content.match(/^[-*•]\s+/gm) || []).length,
    0
  )
  const scopeSpecificity = Math.min(98, Math.max(50, 60 + bullets * 3))

  // Pricing Integrity (0-100)
  const hasTable = sections.some((s) => s.content.includes('|'))
  const pricingIntegrity = hasPricing && hasTable ? 94 : hasPricing ? 80 : 45

  // Risk Coverage (0-100)
  const hasRisks = sections.some(
    (s) =>
      s.content.toLowerCase().includes('risk') ||
      s.content.toLowerCase().includes('warranty') ||
      s.content.toLowerCase().includes('contingency') ||
      s.content.toLowerCase().includes('mitigation')
  )
  const riskCoverage = hasRisks ? 90 : 60

  // Actionability (0-100)
  const hasNext = secTitles.some(
    (t) => t.includes('next') || t.includes('step') || t.includes('kickoff') || t.includes('action')
  )
  const actionability = hasNext ? 95 : 65

  // Weighted overall score
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

  const strengths: string[] = []
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

  const recommendations: string[] = []
  const missingCriticalItems: string[] = []

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
  if (totalWords < 500) {
    recommendations.push('Elaborate on technical implementation specifics to strengthen competitive value.')
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

export function extractBriefLocally(briefText: string): {
  clientName: string
  clientCompany: string
  projectName: string
  problemStatement: string
  keyFeatures: string
  budgetRange: string
  timeline: string
} {
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

/**
 * Export Proposal as Clean GitHub-Flavored Markdown
 */
export function exportProposalAsMarkdown(proposal: GeneratedProposal): string {
  const brand = proposal.brandConfig || {}
  const agency = brand.companyName || proposal.formData.step1.agencyName || 'Agency'
  const client = proposal.formData.step1.clientCompany || 'Client'

  let md = `# ${proposal.title}\n\n`
  md += `**Client:** ${client} | **Prepared by:** ${agency}  \n`
  md += `**Date:** ${proposal.generatedDate} | **Valid Until:** ${proposal.validUntil}  \n`
  md += `**Commercial Value:** ${proposal.totalValue} | **Status:** ${proposal.status.toUpperCase()}\n\n`
  md += `---\n\n`

  for (const s of proposal.sections) {
    md += `## ${s.title}\n\n`
    md += `${s.content}\n\n`
  }

  if (proposal.pricingStructure && proposal.pricingStructure.items.length > 0) {
    md += `## Itemized Commercial Schedule\n\n`
    md += `| Item | Category | Qty | Rate | Total |\n`
    md += `| :--- | :--- | :--- | :--- | :--- |\n`
    for (const item of proposal.pricingStructure.items) {
      if (!item.isOptional || item.isSelected) {
        md += `| ${item.title} | ${item.category} | ${item.quantity} | ${formatCurrency(item.unitRate, proposal.pricingStructure.currency)} | ${formatCurrency(item.quantity * item.unitRate, proposal.pricingStructure.currency)} |\n`
      }
    }
    const totals = calculatePricingTotals(proposal.pricingStructure)
    md += `\n**Grand Total:** ${formatCurrency(totals.grandTotal, proposal.pricingStructure.currency)}\n\n`
  }

  if (proposal.signoff) {
    md += `---\n\n### Digital Sign-Off\n\n`
    md += `**Signer:** ${proposal.signoff.signerName} (${proposal.signoff.signerTitle})  \n`
    md += `**Timestamp:** ${proposal.signoff.signedAt}  \n`
    md += `**Accepted Amount:** ${proposal.signoff.acceptedTotal}\n`
  }

  return md
}

/**
 * Export Proposal as Standalone Interactive HTML Pitch Deck
 */
export function exportProposalAsHtml(proposal: GeneratedProposal): string {
  const brand = proposal.brandConfig || {}
  const agency = brand.companyName || proposal.formData.step1.agencyName || 'Agency'
  const client = proposal.formData.step1.clientCompany || 'Client'
  const color = brand.primaryColor || '#4f46e5'

  const sectionsHtml = proposal.sections
    .map(
      (s) => `
    <section class="section-card">
      <h2>${s.title}</h2>
      <div class="content">${s.content.replace(/\n/g, '<br/>')}</div>
    </section>
  `
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${proposal.title}</title>
  <style>
    :root { --primary: ${color}; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #09090b; color: #f4f4f5; margin: 0; padding: 40px 20px; line-height: 1.6; }
    .container { max-width: 860px; margin: 0 auto; background: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 48px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
    .header { border-bottom: 2px solid #27272a; padding-bottom: 24px; margin-bottom: 32px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; background: rgba(79, 70, 229, 0.15); color: #818cf8; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 12px; }
    h1 { font-size: 28px; margin: 0 0 8px 0; color: #ffffff; }
    .meta { font-size: 14px; color: #a1a1aa; }
    .section-card { margin-bottom: 36px; padding-bottom: 24px; border-bottom: 1px solid #27272a; }
    .section-card:last-child { border-bottom: none; }
    h2 { font-size: 18px; color: #818cf8; margin-top: 0; border-left: 3px solid var(--primary); padding-left: 12px; }
    .content { font-size: 14px; color: #d4d4d8; }
    .footer { text-align: center; font-size: 12px; color: #71717a; margin-top: 40px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="badge">Commercial Proposal</span>
      <h1>${proposal.title}</h1>
      <div class="meta">
        <strong>Client:</strong> ${client} &bull; <strong>Agency:</strong> ${agency} &bull; <strong>Valid Until:</strong> ${proposal.validUntil}
      </div>
    </div>
    ${sectionsHtml}
    <div class="footer">
      Generated securely via AI Proposal Creation & Management Workspace
    </div>
  </div>
</body>
</html>`
}

/**
 * Browser file download helper
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
