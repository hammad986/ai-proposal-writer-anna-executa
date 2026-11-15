import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
} from 'docx'
import type { GeneratedProposal } from './types'

export async function generateProposalDocx(proposal: GeneratedProposal): Promise<Blob> {
  const agency = proposal.formData?.step1?.agencyName || 'Software & AI Agency'
  const client = proposal.formData?.step1?.clientName
    ? `${proposal.formData.step1.clientName} (${proposal.formData.step1.clientCompany})`
    : proposal.formData?.step1?.clientCompany || 'Client Partner'

  const children: any[] = []

  // 1. Cover Page / Title Header
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 720, after: 240 },
      children: [
        new TextRun({
          text: 'PROJECT PROPOSAL',
          bold: true,
          size: 36, // 18pt
          color: '4F46E5',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 480 },
      children: [
        new TextRun({
          text: proposal.title,
          bold: true,
          size: 48, // 24pt
          color: '111827',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 720 },
      children: [
        new TextRun({
          text: proposal.subtitle || 'Strategic Scoping, Technical Architecture & Commercial Agreement',
          italics: true,
          size: 24, // 12pt
          color: '6B7280',
        }),
      ],
    })
  )

  // 2. Metadata Box (Table)
  const metaTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'PREPARED FOR:', bold: true, size: 20, color: '4B5563' }),
                  new TextRun({ text: `\n${client}`, size: 22, color: '111827' }),
                  new TextRun({
                    text: `\n${proposal.formData?.step1?.clientCompany || ''}`,
                    size: 20,
                    color: '6B7280',
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'PREPARED BY:', bold: true, size: 20, color: '4B5563' }),
                  new TextRun({ text: `\n${agency}`, size: 22, color: '111827' }),
                  new TextRun({
                    text: `\nDate: ${proposal.generatedDate} | Valid Until: ${proposal.validUntil}`,
                    size: 20,
                    color: '6B7280',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  })

  children.push(metaTable)

  children.push(
    new Paragraph({
      spacing: { before: 480, after: 480 },
      children: [
        new TextRun({
          text: `Total Authorized Investment: ${proposal.totalValue}`,
          bold: true,
          size: 26,
          color: '4F46E5',
        }),
      ],
    })
  )

  // 3. Proposal Sections
  for (const [idx, sec] of proposal.sections.entries()) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 480, after: 180 },
        children: [
          new TextRun({
            text: `${idx + 1}. ${sec.title}`,
            bold: true,
            size: 30, // 15pt
            color: '1E3A8A',
          }),
        ],
      })
    )

    const paragraphs = sec.content.split(/\n\n+/)
    for (const pText of paragraphs) {
      if (pText.trim().startsWith('- ') || pText.trim().startsWith('* ')) {
        const bullets = pText.split(/\n/)
        for (const b of bullets) {
          children.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { after: 100 },
              children: [
                new TextRun({
                  text: b.replace(/^[-*]\s*/, ''),
                  size: 22,
                  color: '374151',
                }),
              ],
            })
          )
        }
      } else {
        children.push(
          new Paragraph({
            spacing: { after: 180 },
            children: [
              new TextRun({
                text: pText.trim(),
                size: 22,
                color: '374151',
              }),
            ],
          })
        )
      }
    }
  }

  // 4. RFP Compliance Appendix if present
  if (proposal.complianceMatrix && proposal.complianceMatrix.requirements.length > 0) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 480, after: 180 },
        children: [
          new TextRun({
            text: 'Appendix: RFP Requirements Compliance Matrix',
            bold: true,
            size: 30,
            color: '1E3A8A',
          }),
        ],
      })
    )

    const rfpRows: TableRow[] = [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: 'Category', bold: true })] })],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: 'Requirement', bold: true })] })],
          }),
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: 'Compliance', bold: true })] })],
          }),
        ],
      }),
    ]

    for (const req of proposal.complianceMatrix.requirements) {
      rfpRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: req.category.toUpperCase() })] })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: req.requirementText })] })],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: req.complianceStatus.toUpperCase(),
                      bold: true,
                      color: req.complianceStatus === 'compliant' ? '059669' : 'D97706',
                    }),
                  ],
                }),
              ],
            }),
          ],
        })
      )
    }

    children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: rfpRows }))
  }

  // 5. Digital Sign-off Section
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 480, after: 180 },
      children: [
        new TextRun({
          text: 'Project Authorization & Execution',
          bold: true,
          size: 26,
          color: '111827',
        }),
      ],
    })
  )

  if (proposal.signoff) {
    children.push(
      new Paragraph({
        spacing: { after: 180 },
        children: [
          new TextRun({
            text: `[DIGITALLY SIGNED & AUTHORIZED]`,
            bold: true,
            color: '059669',
          }),
          new TextRun({
            text: `\nSigner: ${proposal.signoff.signerName} (${proposal.signoff.signerTitle})`,
          }),
          new TextRun({
            text: `\nDate: ${proposal.signoff.signedAt} | Authorized Investment: ${proposal.signoff.acceptedTotal}`,
          }),
        ],
      })
    )
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  })

  return await Packer.toBlob(doc)
}
