import React from 'react'

export interface AetherionLogoProps {
  variant?: 'symbol' | 'horizontal' | 'mark-only'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  showTagline?: boolean
  className?: string
  theme?: 'dark' | 'light' | 'auto'
}

export function AetherionLogo({
  variant = 'horizontal',
  size = 'md',
  showTagline = false,
  className = '',
  theme = 'auto',
}: AetherionLogoProps) {
  // Dimensions map
  const sizeMap = {
    xs: { symbol: 'h-6 w-6', text: 'text-xs', subtitle: 'text-[8px]', box: 24 },
    sm: { symbol: 'h-8 w-8', text: 'text-sm', subtitle: 'text-[9px]', box: 32 },
    md: { symbol: 'h-9 w-9', text: 'text-base', subtitle: 'text-[10px]', box: 36 },
    lg: { symbol: 'h-11 w-11', text: 'text-lg', subtitle: 'text-xs', box: 44 },
    xl: { symbol: 'h-14 w-14', text: 'text-2xl', subtitle: 'text-xs', box: 56 },
  }

  const currentSize = sizeMap[size]

  // Render pure SVG Mark
  const renderMarkSvg = () => (
    <svg viewBox="0 0 100 100" fill="none" className="w-full h-full drop-shadow-sm">
      <defs>
        <linearGradient id="aeth-comp-l" x1="20" y1="10" x2="50" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#4338CA" />
        </linearGradient>
        <linearGradient id="aeth-comp-r" x1="80" y1="10" x2="50" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#4F46E5" />
        </linearGradient>
        <linearGradient id="aeth-comp-c" x1="35" y1="55" x2="65" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#C7D2FE" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
      </defs>

      {/* Left Structural Pillar */}
      <path d="M50 12 L16 86 L33 86 L50 48 Z" fill="url(#aeth-comp-l)" />

      {/* Right Structural Pillar */}
      <path d="M50 12 L50 48 L67 86 L84 86 Z" fill="url(#aeth-comp-r)" />

      {/* Keystone Bridge */}
      <polygon points="37,62 63,62 56,74 44,74" fill="url(#aeth-comp-c)" />

      {/* Apex Vertex Highlight */}
      <circle cx="50" cy="12" r="2.5" fill="#EEF2FF" />
    </svg>
  )

  if (variant === 'mark-only') {
    return (
      <div className={`inline-flex items-center justify-center ${currentSize.symbol} ${className}`}>
        {renderMarkSvg()}
      </div>
    )
  }

  if (variant === 'symbol') {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-[#0B0F19] p-1.5 border border-slate-800 shadow-md shadow-indigo-950/20 shrink-0 ${currentSize.symbol} ${className}`}
        title="Aetherion Labs"
      >
        {renderMarkSvg()}
      </div>
    )
  }

  // Horizontal Variant
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Symbol Badge */}
      <div
        className={`flex items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-[#0B0F19] p-1.5 border border-slate-800/80 shadow-md shadow-indigo-950/20 shrink-0 ${currentSize.symbol}`}
      >
        {renderMarkSvg()}
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col leading-tight min-w-0">
        <div className={`font-black tracking-tight text-foreground flex items-center ${currentSize.text}`}>
          <span>Aetherion</span>
          <span className="font-semibold text-primary ml-0.5">Labs</span>
        </div>
        {showTagline && (
          <span
            className={`font-semibold uppercase tracking-wider text-muted-foreground ${currentSize.subtitle}`}
          >
            AI Document Systems
          </span>
        )}
      </div>
    </div>
  )
}
