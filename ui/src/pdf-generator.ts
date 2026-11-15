import { jsPDF } from 'jspdf'
import type { GeneratedProposal, ProposalSection } from './types'
import { parsePhases, parseTable, calculatePricingTotals, formatCurrency } from './utils'

function hexToRgb(hex: string): [number, number, number] {
  let c = hex.replace('#', '')
  if (c.length === 3) {
    c = c.split('').map((char) => char + char).join('')
  }
  const num = parseInt(c, 16)
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255]
}

export function generateProposalPdf(
  proposal: GeneratedProposal,
  brandColorHex = '#4f46e5'
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const [brandR, brandG, brandB] = hexToRgb(brandColorHex)
  const pageWidth = 210
  const pageHeight = 297
  const margin = 20
  const contentWidth = pageWidth - margin * 2

  // ──────────────────────────────────────────────
  // PAGE 1: COVER PAGE
  // ──────────────────────────────────────────────

  // Header colored block
  doc.setFillColor(brandR, brandG, brandB)
  doc.rect(0, 0, pageWidth, 110, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(26)
  doc.text('PROJECT PROPOSAL', pageWidth / 2, 52, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(14)
  doc.setTextColor(240, 243, 255)
  const agency = proposal.formData?.step1?.agencyName || 'Software Agency'
  doc.text(agency, pageWidth / 2, 68, { align: 'center' })

  if (proposal.formData?.step1?.agencyTagline) {
    doc.setFontSize(10)
    doc.setTextColor(224, 231, 255)
    doc.text(proposal.formData.step1.agencyTagline, pageWidth / 2, 76, { align: 'center' })
  }

  // Cover body metadata
  let y = 145
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(17, 24, 39)

  // Split title if long
  const titleLines = doc.splitTextToSize(proposal.title, contentWidth)
  doc.text(titleLines, pageWidth / 2, y, { align: 'center' })
  y += titleLines.length * 8.5 + 14

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(107, 114, 128)

  const client = proposal.formData?.step1?.clientName
    ? `${proposal.formData.step1.clientName} (${proposal.formData.step1.clientCompany})`
    : proposal.formData?.step1?.clientCompany || 'Client Partner'
  doc.text(`Prepared for: ${client}`, pageWidth / 2, y, { align: 'center' })
  y += 7

  doc.text(`Prepared by: ${agency}`, pageWidth / 2, y, { align: 'center' })
  y += 7

  doc.text(
    `Date: ${proposal.generatedDate}  |  Valid until: ${proposal.validUntil}`,
    pageWidth / 2,
    y,
    { align: 'center' }
  )
  y += 8

  if (proposal.totalValue) {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(brandR, brandG, brandB)
    doc.text(`Authorized Investment: ${proposal.totalValue}`, pageWidth / 2, y, { align: 'center' })
    y += 10
  }

  // Cover footer note
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8.5)
  doc.setTextColor(156, 163, 175)
  doc.text(
    'Commercial in confidence. Prepared for formal evaluation and contractual authorization.',
    pageWidth / 2,
    pageHeight - 22,
    { align: 'center' }
  )

  // ──────────────────────────────────────────────
  // PAGE 2: TABLE OF CONTENTS
  // ──────────────────────────────────────────────
  doc.addPage()
  let currentPage = 2

  const printHeaderFooter = (pageNo: number) => {
    // Header
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(156, 163, 175)
    doc.text(agency, margin, 12)
    doc.text(proposal.title, pageWidth - margin, 12, { align: 'right' })
    doc.setDrawColor(229, 231, 235)
    doc.setLineWidth(0.3)
    doc.line(margin, 14, pageWidth - margin, 14)

    // Footer
    doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14)
    doc.text(`Prepared by ${agency}  |  Confidential`, margin, pageHeight - 9.5)
    doc.text(`Page ${pageNo}`, pageWidth - margin, pageHeight - 9.5, { align: 'right' })
  }

  printHeaderFooter(currentPage)

  // TOC Title
  doc.setFillColor(brandR, brandG, brandB)
  doc.rect(margin, 22, 2.5, 7, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(brandR, brandG, brandB)
  doc.text('Table of Contents', margin + 6, 27.5)

  let tocY = 38
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(55, 65, 81)

  proposal.sections.forEach((sec, idx) => {
    const titleText = `${idx + 1}.  ${sec.title}`
    doc.text(titleText, margin + 4, tocY)
    doc.setDrawColor(209, 213, 219)
    doc.line(margin + 60, tocY - 1, pageWidth - margin - 15, tocY - 1)
    doc.text(`Sec ${idx + 1}`, pageWidth - margin - 5, tocY, { align: 'right' })
    tocY += 8
  })

  // Executive Overview Summary Box in TOC Page
  tocY += 6
  doc.setDrawColor(229, 231, 235)
  doc.setFillColor(249, 250, 251)
  doc.roundedRect(margin, tocY, contentWidth, 38, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(brandR, brandG, brandB)
  doc.text('Proposal Overview & Commercial Summary', margin + 6, tocY + 8)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(75, 85, 99)
  doc.text(`• Project: ${proposal.formData?.step1?.projectName || proposal.title}`, margin + 6, tocY + 15)
  doc.text(`• Client Organization: ${proposal.formData?.step1?.clientCompany || 'Client Partner'}`, margin + 6, tocY + 21)
  doc.text(`• Engagement Model: ${proposal.formData?.step3?.complexity || 'Standard'} delivery roadmap`, margin + 6, tocY + 27)
  doc.text(`• Investment Structure: ${proposal.totalValue} (${proposal.formData?.step3?.paymentMilestone || 'Milestone schedule'})`, margin + 6, tocY + 33)

  // ──────────────────────────────────────────────
  // PAGE 3+: PROPOSAL SECTIONS
  // ──────────────────────────────────────────────
  doc.addPage()
  currentPage++
  printHeaderFooter(currentPage)
  let cursorY = 22

  const checkPageBreak = (neededHeight: number) => {
    if (cursorY + neededHeight > pageHeight - 22) {
      doc.addPage()
      currentPage++
      printHeaderFooter(currentPage)
      cursorY = 22
    }
  }

  for (const section of proposal.sections) {
    checkPageBreak(25)

    // Section title
    doc.setFillColor(brandR, brandG, brandB)
    doc.rect(margin, cursorY, 2.5, 7, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12.5)
    doc.setTextColor(brandR, brandG, brandB)
    doc.text(section.title, margin + 6, cursorY + 5.5)
    cursorY += 12

    // Section content rendering
    const isTable = section.type === 'table' || section.content.includes('|')
    const isPhases = section.type === 'phases' || section.content.includes('## Phase')

    if (isTable) {
      const table = parseTable(section.content)
      if (table.headers.length) {
        checkPageBreak(15 + table.rows.length * 8)
        const colWidth = contentWidth / table.headers.length

        // Table Header
        doc.setFillColor(brandR, brandG, brandB)
        doc.rect(margin, cursorY, contentWidth, 7, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.setTextColor(255, 255, 255)
        table.headers.forEach((h, idx) => {
          doc.text(h, margin + idx * colWidth + 3, cursorY + 5)
        })
        cursorY += 7

        // Table Rows
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8.5)
        table.rows.forEach((row, rIdx) => {
          checkPageBreak(8)
          if (rIdx % 2 === 1) {
            doc.setFillColor(249, 250, 251)
            doc.rect(margin, cursorY, contentWidth, 7, 'F')
          }
          doc.setDrawColor(229, 231, 235)
          doc.rect(margin, cursorY, contentWidth, 7, 'S')
          doc.setTextColor(31, 41, 55)
          row.forEach((cell, cIdx) => {
            const truncated = doc.splitTextToSize(cell, colWidth - 6)[0] || cell
            doc.text(truncated, margin + cIdx * colWidth + 3, cursorY + 4.8)
          })
          cursorY += 7
        })
        cursorY += 6
      }
    } else if (isPhases) {
      const phases = parsePhases(section.content)
      if (phases.length) {
        phases.forEach((phase) => {
          const needed = 14 + phase.tasks.length * 5
          checkPageBreak(needed)

          doc.setDrawColor(229, 231, 235)
          doc.setFillColor(255, 255, 255)
          doc.roundedRect(margin, cursorY, contentWidth, needed - 3, 1.5, 1.5, 'FD')

          doc.setFont('helvetica', 'bold')
          doc.setFontSize(9.5)
          doc.setTextColor(brandR, brandG, brandB)
          const phaseHeading = `Phase ${phase.number}: ${phase.name} ${
            phase.duration ? `(${phase.duration})` : ''
          }`
          doc.text(phaseHeading, margin + 4, cursorY + 5.5)

          doc.setFont('helvetica', 'normal')
          doc.setFontSize(8.5)
          doc.setTextColor(75, 85, 99)
          let taskY = cursorY + 10
          phase.tasks.forEach((task) => {
            doc.text(`• ${task}`, margin + 6, taskY)
            taskY += 4.5
          })

          cursorY += needed
        })
        cursorY += 4
      }
    } else {
      // Normal text paragraphs & lists
      const rawParagraphs = section.content.split(/\n{2,}/)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9.5)
      doc.setTextColor(55, 65, 81)

      for (const p of rawParagraphs) {
        const cleanP = p.replace(/\*\*/g, '').trim()
        if (!cleanP) continue
        const lines = doc.splitTextToSize(cleanP, contentWidth)
        checkPageBreak(lines.length * 4.8 + 4)
        doc.text(lines, margin, cursorY)
        cursorY += lines.length * 4.8 + 4
      }
      cursorY += 4
    }
  }

  // ──────────────────────────────────────────────
  // SIGNATURES & ACCEPTANCE BLOCK
  // ──────────────────────────────────────────────
  checkPageBreak(55)
  cursorY += 4

  doc.setFillColor(brandR, brandG, brandB)
  doc.rect(margin, cursorY, 2.5, 7, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12.5)
  doc.setTextColor(brandR, brandG, brandB)
  doc.text('Signatures & Project Authorization', margin + 6, cursorY + 5.5)
  cursorY += 12

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(107, 114, 128)
  doc.text(
    'By signing below, both parties acknowledge and accept the deliverables, investment schedules, and terms set forth.',
    margin,
    cursorY
  )
  cursorY += 10

  const boxWidth = (contentWidth - 10) / 2

  // Agency Sign Box
  doc.setDrawColor(209, 213, 219)
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(margin, cursorY, boxWidth, 32, 1.5, 1.5, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(55, 65, 81)
  doc.text(`For: ${agency}`, margin + 4, cursorY + 6)
  doc.line(margin + 4, cursorY + 18, margin + boxWidth - 4, cursorY + 18)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(156, 163, 175)
  doc.text('Authorized Representative Signature', margin + 4, cursorY + 23)
  doc.text(`Date: ${proposal.generatedDate}`, margin + 4, cursorY + 28)

  // Client Sign Box
  const clientBoxX = margin + boxWidth + 10
  doc.roundedRect(clientBoxX, cursorY, boxWidth, 32, 1.5, 1.5, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(55, 65, 81)
  doc.text(`For: ${proposal.formData?.step1?.clientCompany || 'Client Partner'}`, clientBoxX + 4, cursorY + 6)

  if (proposal.signoff) {
    // Digitally signed stamp
    doc.setTextColor(16, 185, 129)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.text(`[VERIFIED DIGITAL SIGNATURE]`, clientBoxX + 4, cursorY + 13)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(55, 65, 81)
    doc.text(`${proposal.signoff.signerName} (${proposal.signoff.signerTitle})`, clientBoxX + 4, cursorY + 19)
    doc.text(`Signed: ${proposal.signoff.signedAt.slice(0, 10)} · Total: ${proposal.signoff.acceptedTotal}`, clientBoxX + 4, cursorY + 24)
    if (proposal.signoff.digitalSignature) {
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(6.5)
      doc.setTextColor(107, 114, 128)
      doc.text(`Cert: ${proposal.signoff.digitalSignature.certificateId}`, clientBoxX + 4, cursorY + 29)
    }
  } else {
    doc.line(clientBoxX + 4, cursorY + 18, clientBoxX + boxWidth - 4, cursorY + 18)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(156, 163, 175)
    doc.text('Client Acceptance Signature', clientBoxX + 4, cursorY + 23)
    doc.text('Date: ____________________', clientBoxX + 4, cursorY + 28)
  }

  // Save PDF
  const cleanFilename = (proposal.title || 'proposal')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  doc.save(`${cleanFilename}.pdf`)
}
