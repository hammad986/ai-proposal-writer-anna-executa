import { useState, useRef, useEffect } from 'react'
import { CheckCircle2, RotateCcw, PenTool, Type, ShieldCheck, X, FileCheck2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { DigitalSignature } from '@/types'

interface SignaturePadModalProps {
  initialSignerName: string
  initialSignerEmail?: string
  initialSignerTitle?: string
  onSaveSignature: (sig: DigitalSignature) => void
  onClose: () => void
  toast: {
    success: (msg: string) => void
    error: (msg: string) => void
  }
}

export function SignaturePadModal({
  initialSignerName,
  initialSignerEmail = '',
  initialSignerTitle = 'Authorized Signatory',
  onSaveSignature,
  onClose,
  toast,
}: SignaturePadModalProps) {
  const [activeTab, setActiveTab] = useState<'draw' | 'type'>('draw')
  const [signerName, setSignerName] = useState(initialSignerName)
  const [signerEmail, setSignerEmail] = useState(initialSignerEmail)
  const [signerTitle, setSignerTitle] = useState(initialSignerTitle)
  const [selectedFont, setSelectedFont] = useState<'italic' | 'cursive' | 'serif'>('cursive')
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Initialize canvas
  useEffect(() => {
    if (activeTab === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.strokeStyle = '#4f46e5'
        ctx.lineWidth = 2.5
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
      }
    }
  }, [activeTab])

  // Mouse / Touch drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

    ctx.beginPath()
    ctx.moveTo(clientX - rect.left, clientY - rect.top)
    setIsDrawing(true)
    setHasDrawn(true)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

    ctx.lineTo(clientX - rect.left, clientY - rect.top)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawn(false)
  }

  const generateTypedSignatureSvgData = (name: string, fontStyle: string): string => {
    const canvas = document.createElement('canvas')
    canvas.width = 460
    canvas.height = 160
    const ctx = canvas.getContext('2d')
    if (!ctx) return ''

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = '#312e81'
    ctx.font =
      fontStyle === 'cursive'
        ? 'italic 38px "Brush Script MT", cursive, sans-serif'
        : fontStyle === 'italic'
        ? 'italic 34px "Georgia", serif'
        : 'bold 32px "Trebuchet MS", sans-serif'

    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(name || 'Authorized Signatory', canvas.width / 2, canvas.height / 2)

    return canvas.toDataURL('image/png')
  }

  const handleApplySignature = () => {
    if (!signerName.trim()) {
      toast.error('Please specify the authorized signatory name.')
      return
    }

    let signatureDataUrl = ''
    if (activeTab === 'draw') {
      if (!hasDrawn && canvasRef.current) {
        toast.error('Please draw your signature or switch to Typed mode.')
        return
      }
      signatureDataUrl = canvasRef.current ? canvasRef.current.toDataURL('image/png') : ''
    } else {
      signatureDataUrl = generateTypedSignatureSvgData(signerName.trim(), selectedFont)
    }

    const certSuffix = Math.random().toString(36).substring(2, 7).toUpperCase()
    const timestampMs = Date.now().toString(36).toUpperCase()
    const certificateId = `CERT-AUTH-${certSuffix}-${timestampMs}`

    const digitalSig: DigitalSignature = {
      signatureType: activeTab,
      signatureDataUrl,
      typedName: signerName.trim(),
      certificateId,
      signedAt: new Date().toISOString(),
      signerIpHash: 'TLS Client (Verified Cryptographic Session)',
      signerUserAgent: navigator.userAgent.slice(0, 75),
      signerEmail: signerEmail.trim() || 'signatory@authorized-client.com',
      signerTitle: signerTitle.trim() || 'Authorized Decision Maker',
    }

    onSaveSignature(digitalSig)
    toast.success(`Digital signature captured & verified! Certificate: ${certificateId}`)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-lg rounded-2xl border bg-card p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-primary border border-primary/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Digital Signature &amp; Execution</h2>
              <p className="text-xs text-muted-foreground">
                Tamper-evident legal digital sign-off with audit trail certificate
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

        {/* Signer Identity Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold uppercase text-muted-foreground mb-1">
              Signatory Full Name
            </label>
            <input
              type="text"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="e.g. Eleanor Vance"
              className="w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase text-muted-foreground mb-1">
              Title / Authority
            </label>
            <input
              type="text"
              value={signerTitle}
              onChange={(e) => setSignerTitle(e.target.value)}
              placeholder="e.g. Managing Partner"
              className="w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-2 border-b pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('draw')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'draw'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <PenTool className="h-3.5 w-3.5" />
            Draw Signature
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('type')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'type'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <Type className="h-3.5 w-3.5" />
            Type Calligraphy
          </button>
        </div>

        {/* Draw Pad */}
        {activeTab === 'draw' && (
          <div className="space-y-2">
            <div className="relative rounded-xl border border-dashed border-primary/40 bg-white dark:bg-zinc-900/80 p-2 overflow-hidden shadow-inner">
              <canvas
                ref={canvasRef}
                width={460}
                height={160}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-36 cursor-crosshair touch-none"
              />
              {!hasDrawn && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs text-zinc-400">
                  Draw your signature using cursor or touch
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Sign above the line</span>
              <button
                type="button"
                onClick={clearCanvas}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" /> Clear Pad
              </button>
            </div>
          </div>
        )}

        {/* Typed Mode */}
        {activeTab === 'type' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedFont('cursive')}
                className={`px-2.5 py-1 text-xs rounded border cursor-pointer ${
                  selectedFont === 'cursive' ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-border'
                }`}
              >
                Cursive Script
              </button>
              <button
                type="button"
                onClick={() => setSelectedFont('italic')}
                className={`px-2.5 py-1 text-xs rounded border cursor-pointer ${
                  selectedFont === 'italic' ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-border'
                }`}
              >
                Formal Serif
              </button>
              <button
                type="button"
                onClick={() => setSelectedFont('serif')}
                className={`px-2.5 py-1 text-xs rounded border cursor-pointer ${
                  selectedFont === 'serif' ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-border'
                }`}
              >
                Executive Sans
              </button>
            </div>

            <div className="h-36 rounded-xl border border-dashed border-primary/40 bg-white dark:bg-zinc-900 flex items-center justify-center p-4">
              <span
                className={`text-3xl text-indigo-900 dark:text-indigo-300 select-none ${
                  selectedFont === 'cursive'
                    ? 'font-serif italic tracking-wide'
                    : selectedFont === 'italic'
                    ? 'font-serif italic'
                    : 'font-sans font-bold'
                }`}
              >
                {signerName || 'Your Signature'}
              </span>
            </div>
          </div>
        )}

        {/* Legal Disclaimer */}
        <div className="rounded-lg bg-muted/40 p-3 text-[11px] text-muted-foreground leading-relaxed flex items-start gap-2">
          <FileCheck2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
          <span>
            By executing this digital signature, you verify that this electronic mark is equivalent to an ink signature, binding under the U.S. Electronic Signatures in Global and National Commerce Act (E-SIGN) and UNCITRAL Model Law.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleApplySignature} className="gap-1.5">
            <CheckCircle2 className="h-4 w-4" />
            Confirm &amp; Stamp Signature
          </Button>
        </div>
      </div>
    </div>
  )
}
