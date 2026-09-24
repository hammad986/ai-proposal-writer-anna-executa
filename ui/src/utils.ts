import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function currencyToNumber(value: string): number {
  if (!value) return 0
  const normalized = value.replace(/[^\d]/g, '')
  return Number(normalized || 0)
}

export function formatCurrencyINR(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function isoDate(date = new Date()): string {
  return date.toISOString().slice(0, 10)
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
    .filter((phase) => phase.name)
}
