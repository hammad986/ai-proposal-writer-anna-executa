import { useState } from 'react'
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  X,
  FileCheck2,
  RefreshCw,
  PlusCircle,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { invokeExecutaTool } from '@/anna-bridge'
import { scanProposalContractRisks } from '@/defaults'
import type { GeneratedProposal, ContractRiskReport, ContractRiskItem } from '@/types'

interface RiskScannerModalProps {
  proposal: GeneratedProposal
  onUpdateProposal: (updated: GeneratedProposal) => void
  onClose: () => void
  toast: {
    success: (msg: string) => void
    error: (msg: string) => void
  }
}

export function RiskScannerModal({
  proposal,
  onUpdateProposal,
  onClose,
  toast,
}: RiskScannerModalProps) {
  const [report, setReport] = useState<ContractRiskReport>(() => {
    return proposal.riskReport || scanProposalContractRisks(proposal)
  })
  const [isScanning, setIsScanning] = useState(false)
  const [injectedRiskIds, setInjectedRiskIds] = useState<Set<string>>(new Set())

  const handleRescan = async () => {
    setIsScanning(true)
    try {
      let res: ContractRiskReport = scanProposalContractRisks(proposal)
      try {
        const resp = await invokeExecutaTool<{ riskReport: ContractRiskReport }>(
          'scan_contract_risks',
          { proposal }
        )
        if (resp?.riskReport && Array.isArray(resp.riskReport.risks)) {
          res = resp.riskReport
        }
      } catch (err) {
        res = scanProposalContractRisks(proposal)
      }

      setReport(res)
      onUpdateProposal({
        ...proposal,
        riskReport: res,
        updatedAt: new Date().toISOString(),
      })
      toast.success('Contract & scope risk scan updated!')
    } catch (e: any) {
      toast.error('Risk scan failed: ' + (e?.message || 'Unknown error'))
    } finally {
      setIsScanning(false)
    }
  }

  const handleInjectClause = (risk: ContractRiskItem) => {
    if (injectedRiskIds.has(risk.id)) return

    // Find terms section or add a new Governance section
    let updatedSections = [...proposal.sections]
    const termsIndex = updatedSections.findIndex(
      (s) => /terms|warrant|governance|conditions/i.test(s.title)
    )

    if (termsIndex >= 0) {
      const current = updatedSections[termsIndex]
      updatedSections[termsIndex] = {
        ...current,
        content: current.content + '\n\n' + risk.autoFixClause,
        isEdited: true,
      }
    } else {
      updatedSections.push({
        id: `sec_gov_${Date.now()}`,
        title: 'Governance & Risk Protections',
        content: risk.autoFixClause,
        type: 'text',
        isEdited: true,
      })
    }

    const nextInjected = new Set(injectedRiskIds)
    nextInjected.add(risk.id)
    setInjectedRiskIds(nextInjected)

    const updatedProposal: GeneratedProposal = {
      ...proposal,
      sections: updatedSections,
      updatedAt: new Date().toISOString(),
    }

    // Recalculate local risk after injection
    const updatedReport = scanProposalContractRisks(updatedProposal)
    setReport(updatedReport)
    updatedProposal.riskReport = updatedReport

    onUpdateProposal(updatedProposal)
    toast.success(`Protective clause for "${risk.issue}" injected into proposal terms!`)
  }

  const getSeverityBadge = (sev: ContractRiskItem['severity']) => {
    if (sev === 'high') return 'bg-rose-500/10 text-rose-500 border-rose-500/20'
    if (sev === 'medium') return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
    return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border bg-card p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                AI Contract Red-Flag &amp; Scope-Creep Scanner
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    report.overallRiskLevel === 'low'
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      : report.overallRiskLevel === 'moderate'
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                  }`}
                >
                  {report.overallRiskLevel.toUpperCase()} RISK
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Automated legal vulnerability scan detecting scope drift, cash flow traps, and liability exposure
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Risk Index Overview */}
        <div className="rounded-xl border bg-muted/20 p-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Vulnerability Index
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground">
                {report.riskIndex}/100
              </span>
              <span className="text-xs text-muted-foreground">
                {report.risks.length} Red-Flags Identified
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleRescan}
              disabled={isScanning}
              className="gap-1.5 text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              {isScanning ? 'Scanning...' : 'Re-scan Proposal'}
            </Button>
          </div>
        </div>

        {/* Identified Risks List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Contract Red-Flags &amp; 1-Click Mitigations
          </h3>

          {report.risks.length === 0 ? (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center space-y-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-bold text-foreground">No Critical Contract Risks Detected!</h4>
              <p className="text-xs text-muted-foreground">
                Your proposal terms include proper scope boundaries, review windows, IP protections, and liability disclaimers.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {report.risks.map((risk) => {
                const isInjected = injectedRiskIds.has(risk.id)
                return (
                  <div
                    key={risk.id}
                    className="rounded-xl border bg-background/60 p-4 space-y-2.5 text-xs shadow-xs"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getSeverityBadge(
                            risk.severity
                          )}`}
                        >
                          {risk.severity.toUpperCase()}
                        </span>
                        <span className="font-bold text-foreground">{risk.issue}</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground font-medium">
                        Category: {risk.category}
                      </span>
                    </div>

                    <p className="text-muted-foreground leading-relaxed text-[11px]">
                      {risk.riskExplanation}
                    </p>

                    <div className="rounded-lg bg-muted/40 p-2.5 text-[11px] text-foreground/90 font-mono space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-primary">
                        Recommended Protective Clause:
                      </div>
                      <div className="whitespace-pre-wrap">{risk.autoFixClause}</div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <Button
                        size="sm"
                        variant={isInjected ? 'secondary' : 'primary'}
                        onClick={() => handleInjectClause(risk)}
                        disabled={isInjected}
                        className="gap-1.5 text-xs"
                      >
                        {isInjected ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                            Clause Injected into Terms
                          </>
                        ) : (
                          <>
                            <PlusCircle className="h-3.5 w-3.5" />
                            Inject Protective Clause into Terms
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-3 border-t">
          <Button size="sm" onClick={onClose} className="text-xs">
            Done
          </Button>
        </div>
      </div>
    </div>
  )
}
