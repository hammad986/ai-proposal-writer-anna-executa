import { jsPDF } from 'jspdf'
import type { GeneratedProposal, ProposalSection } from './types'
import { parsePhases, parseTable } from './utils'

export function generateProposalPdf(proposal: GeneratedProposal): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = 210
  const pageHeight = 297
  const margin = 20
  const contentWidth = pageWidth - margin * 2

  // ──────────────────────────────────────────────
  // PAGE 1: COVER PAGE
  // ──────────────────────────────────────────────

  // Header indigo block
  doc.setFillColor(99, 102, 241) // #6366f1
  doc.rect(0, 0, pageWidth, 110, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  doc.text('PROJECT PROPOSAL', pageWidth / 2, 55, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(14)
  doc.setTextColor(238, 242, 255) // #eef2ff
  const agency = proposal.formData.step1.agencyName || 'Software Agency'
  doc.text(agency, pageWidth / 2, 70, { align: 'center' })

  if (proposal.formData.step1.agencyTagline) {
    doc.setFontSize(10)
    doc.setTextColor(224, 231, 255)
    doc.text(proposal.formData.step1.agencyTagline, pageWidth / 2, 78, { align: 'center' })
  }

  // Cover body metadata
  let y = 145
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(17, 24, 39) // #111827

  // Split title if long
  const titleLines = doc.splitTextToSize(proposal.title, contentWidth)
  doc.text(titleLines, pageWidth / 2, y, { align: 'center' })
  y += titleLines.length * 9 + 15

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(107, 114, 128) // #6b7280

  const client = proposal.formData.step1.clientName
    ? `${proposal.formData.step1.clientName} (${proposal.formData.step1.clientCompany})`
    : proposal.formData.step1.clientCompany || 'Client'
  doc.text(`Prepared for: ${client}`, pageWidth / 2, y, { align: 'center' })
  y += 7

  doc.text(`Prepared by: ${agency}`, pageWidth / 2, y, { align: 'center' })
  y += 7

  doc.text(`Generated: ${proposal.generatedDate}  |  Valid until: ${proposal.validUntil}`, pageWidth / 2, y, {
    align: 'center',
  })
  y += 7

  if (proposal.totalValue) {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(79, 70, 229)
    doc.text(`Investment: ${proposal.totalValue}`, pageWidth / 2, y, { align: 'center' })
    y += 10
  }

  // Cover footer note
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(9)
  doc.setTextColor(156, 163, 175)
  doc.text('Confidential proposal prepared for review and approval.', pageWidth / 2, pageHeight - 25, {
    align: 'center',
  })

  // ──────────────────────────────────────────────
  // PAGE 2+: PROPOSAL SECTIONS
  // ──────────────────────────────────────────────
  doc.addPage()
  let currentPage = 2

  const printHeaderFooter = () => {
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
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(156, 163, 175)
    doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14)
    doc.text(`Powered by ${agency} | ${proposal.generatedDate}`, margin, pageHeight - 10)
    doc.text(`Page ${currentPage}`, pageWidth - margin, pageHeight - 10, { align: 'right' })
  }

  printHeaderFooter()
  let cursorY = 22

  const checkPageBreak = (neededHeight: number) => {
    if (cursorY + neededHeight > pageHeight - 22) {
      doc.addPage()
      currentPage++
      printHeaderFooter()
      cursorY = 22
    }
  }

  for (const section of proposal.sections) {
    checkPageBreak(25)

    // Section title
    doc.setFillColor(99, 102, 241)
    doc.rect(margin, cursorY, 2, 7, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(79, 70, 229) // #4f46e5
    doc.text(section.title, margin + 5, cursorY + 5.5)
    cursorY += 11

    // Section content rendering
    const isTable = section.type === 'table' || section.content.includes('|')
    const isPhases = section.type === 'phases' || section.content.includes('## Phase')

    if (isTable) {
      const table = parseTable(section.content)
      if (table.headers.length) {
        checkPageBreak(15 + table.rows.length * 8)
        const colWidth = contentWidth / table.headers.length

        // Table Header
        doc.setFillColor(99, 102, 241)
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
          doc.setTextColor(79, 70, 229)
          const phaseHeading = `Phase ${phase.number}: ${phase.name} ${phase.duration ? `(${phase.duration})` : ''}`
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
      doc.setTextColor(55, 65, 81) // #374151

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

  const cleanFilename = (proposal.title || 'proposal')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  doc.save(`${cleanFilename}.pdf`)
}
