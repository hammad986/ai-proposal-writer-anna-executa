import React, { useState } from 'react'
import {
  X,
  Lock,
  KeyRound,
  FileCheck,
  ShieldAlert,
  Save,
  Check,
  AlertTriangle,
} from 'lucide-react'
import type { ProposalSecurity } from '../../types'

interface SecuritySettingsModalProps {
  isOpen: boolean
  onClose: () => void
  security: ProposalSecurity
  onSave: (updatedSecurity: ProposalSecurity) => void
}

export const SecuritySettingsModal: React.FC<SecuritySettingsModalProps> = ({
  isOpen,
  onClose,
  security,
  onSave,
}) => {
  const [requirePasscode, setRequirePasscode] = useState(security.requirePasscode)
  const [passcode, setPasscode] = useState(security.passcode || '')
  const [requireNdaAgreement, setRequireNdaAgreement] = useState(security.requireNdaAgreement)
  const [ndaText, setNdaText] = useState(
    security.ndaText ||
      'This proposal contains proprietary business concepts, itemized architecture, and confidential commercial pricing. Access is restricted exclusively to authorized client personnel.'
  )
  const [watermarkConfidential, setWatermarkConfidential] = useState(security.watermarkConfidential)
  const [saved, setSaved] = useState(false)

  if (!isOpen) return null

  const handleSave = () => {
    onSave({
      requirePasscode,
      passcode: passcode.trim(),
      requireNdaAgreement,
      ndaText: ndaText.trim(),
      expiryNoticeDays: security.expiryNoticeDays || 7,
      watermarkConfidential,
    })
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      onClose()
    }, 600)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Proposal Security & Access Controls</h3>
              <p className="text-xs text-zinc-400">
                Protect sensitive IP, pricing, and client confidential information
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          {/* Client Passcode Protection */}
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                  Client Passcode Protection
                </div>
                <div className="text-[11px] text-zinc-400">
                  Require recipient to enter a security PIN to unlock the proposal
                </div>
              </div>
              <input
                type="checkbox"
                checked={requirePasscode}
                onChange={(e) => setRequirePasscode(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-zinc-800 border-zinc-700 cursor-pointer"
              />
            </div>

            {requirePasscode && (
              <div className="pt-2 border-t border-zinc-800 space-y-1.5">
                <label className="text-[11px] font-medium text-zinc-300">Set 4 to 8 Digit PIN / Passcode</label>
                <input
                  type="text"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="e.g. 2026 or SecurePass#1"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            )}
          </div>

          {/* NDA / Mutual Confidentiality Agreement Gate */}
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Mandatory NDA Acceptance Gate
                </div>
                <div className="text-[11px] text-zinc-400">
                  Client must accept mutual confidentiality terms before viewing
                </div>
              </div>
              <input
                type="checkbox"
                checked={requireNdaAgreement}
                onChange={(e) => setRequireNdaAgreement(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-zinc-800 border-zinc-700 cursor-pointer"
              />
            </div>

            {requireNdaAgreement && (
              <div className="pt-2 border-t border-zinc-800 space-y-1.5">
                <label className="text-[11px] font-medium text-zinc-300">Confidentiality Statement</label>
                <textarea
                  value={ndaText}
                  onChange={(e) => setNdaText(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>
            )}
          </div>

          {/* Confidential Watermark */}
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                Confidential Document Watermark
              </div>
              <div className="text-[11px] text-zinc-400">
                Display prominent 'CONFIDENTIAL' watermark across preview and exports
              </div>
            </div>
            <input
              type="checkbox"
              checked={watermarkConfidential}
              onChange={(e) => setWatermarkConfidential(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-zinc-800 border-zinc-700 cursor-pointer"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 flex items-center justify-end gap-2 bg-zinc-900/40">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="py-2 px-4 rounded-xl text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-colors shadow-sm"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Apply Security
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
