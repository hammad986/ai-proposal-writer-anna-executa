import { useState } from 'react'
import { FileUp, Loader2, Sparkles, X, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { invokeExecutaTool } from '@/anna-bridge'
import { extractBriefLocally } from '@/utils'
import type { FormStep1, FormStep2, FormStep3 } from '@/types'

const SAMPLE_BRIEFS = [
  {
    title: 'SaaS Customer Portal',
    snippet:
      'Hi from John Smith at Acronis Logistics.\nWe need to build a customer shipment tracking portal. Our current problem is manual Excel tracking and frequent phone inquiries from shippers.\nFeatures needed:\n- Real-time GPS shipment tracking map\n- Customer authentication and PDF bill-of-lading download\n- Automated dispatch notification webhooks\n- Admin operational dispatch dashboard\nBudget is approximately $18,000 to $25,000 with a 6-week target delivery window.',
  },
  {
    title: 'AI Contract Review Agent',
    snippet:
      'Hello, Dr. Elena Rostova from Veracity Legal Systems.\nWe are soliciting proposals for an Enterprise AI Contract Review platform. Our attorneys spend 15+ hours weekly manually vetting vendor agreements.\nRequirements:\n- PDF and DOCX contract ingestion\n- Automated clause risk categorization against standard legal playbook\n- Attorney redline approval interface\n- Strict HIPAA and SOC2 data privacy compliance\nTarget budget is $30,000 with phased deployment over 2 months.',
  },
]

export function BriefImporterModal({
  onExtractSuccess,
  onClose,
  toast,
}: {
  onExtractSuccess: (extracted: {
    step1Patch: Partial<FormStep1>
    step2Patch: Partial<FormStep2>
    step3Patch: Partial<FormStep3>
  }) => void
  onClose: () => void
  toast: {
    success: (msg: string) => void
    error: (msg: string) => void
  }
}) {
  const [briefText, setBriefText] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)

  const handleExtract = async () => {
    if (!briefText.trim()) {
      toast.error('Please enter or paste a project brief.')
      return
    }

    setIsExtracting(true)
    try {
      let data: any = null
      try {
        const resp = await invokeExecutaTool<{ extractedData: any }>('extract_brief', {
          briefText,
        })
        if (resp?.extractedData && typeof resp.extractedData === 'object') {
          data = resp.extractedData
        }
      } catch (err) {
        data = extractBriefLocally(briefText)
      }

      if (!data) {
        data = extractBriefLocally(briefText)
      }

      onExtractSuccess({
        step1Patch: {
          clientName: data.clientName || '',
          clientCompany: data.clientCompany || '',
          projectName: data.projectName || '',
          problemStatement: data.problemStatement || '',
        },
        step2Patch: {
          keyFeatures: data.keyFeatures || '',
        },
        step3Patch: {
          budgetRange: data.budgetRange || '$15,000 – $25,000',
        },
      })

      toast.success('Project brief extracted and applied to scoping wizard!')
      onClose()
    } catch (e: any) {
      toast.error('Brief extraction failed: ' + (e?.message || 'Unknown error'))
    } finally {
      setIsExtracting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-xl rounded-xl border bg-card p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-primary">
              <Wand2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Brief-to-Proposal AI Extractor</h2>
              <p className="text-xs text-muted-foreground">
                Paste an unstructured client email, RFP, or meeting notes to auto-populate the proposal wizard.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Text Input */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            Client Brief / RFP Text
          </label>
          <textarea
            rows={7}
            value={briefText}
            onChange={(e) => setBriefText(e.target.value)}
            placeholder="Paste raw RFP, email thread, or scope description here..."
            className="w-full rounded-lg border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Quick Sample Presets */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1.5">Or try a sample client brief:</p>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_BRIEFS.map((sb) => (
              <button
                key={sb.title}
                type="button"
                onClick={() => setBriefText(sb.snippet)}
                className="rounded-md border bg-muted/30 px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
              >
                + {sb.title}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleExtract} disabled={isExtracting || !briefText.trim()}>
            {isExtracting ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Extracting Scope...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-1.5" />
                Extract & Populate Wizard
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
