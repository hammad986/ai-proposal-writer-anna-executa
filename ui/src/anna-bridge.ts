/**
 * Anna Bridge: Handles Host API connection, Executa tool calls,
 * storage synchronization, and window lifecycle with fallback for standalone preview.
 */

const BUNDLED_HANDLE = 'ai-proposal-writer-anna'
const FALLBACK_DEV_TOOL_ID = 'tool-hammad-ai-proposal-writer-anna-84jkbu68'

export function getResolvedToolId(): string {
  if (typeof window !== 'undefined') {
    const ids = (window as any).__ANNA_TOOL_IDS__
    if (ids && typeof ids === 'object') {
      if (ids[BUNDLED_HANDLE]) {
        return ids[BUNDLED_HANDLE]
      }
    }
  }
  return FALLBACK_DEV_TOOL_ID
}

interface AnnaClient {
  tools?: {
    invoke: (req: {
      tool_id: string
      method: string
      args: Record<string, any>
      timeoutMs?: number
    }) => Promise<any>
  }
  storage?: {
    get: (req: { key: string }) => Promise<{ value: any; exists?: boolean }>
    set: (req: { key: string; value: any }) => Promise<any>
    delete?: (req: { key: string }) => Promise<any>
    list?: (req: { prefix?: string }) => Promise<any>
  }
  window?: {
    set_title: (req: { title: string }) => Promise<any>
    ready: (req: Record<string, any>) => Promise<any>
  }
}

let annaClient: AnnaClient | null = null
let hasConnected = false
let isStandalone = false

export async function initAnnaBridge(): Promise<{ isStandalone: boolean }> {
  if (hasConnected) {
    return { isStandalone }
  }

  try {
    // Dynamic import to prevent bundler resolving non-local path
    const sdkModule = await import(/* @vite-ignore */ '/static/anna-apps/_sdk/latest/index.js')
    const { AnnaAppRuntime } = sdkModule
    annaClient = await AnnaAppRuntime.connect()
    isStandalone = false

    if (annaClient?.window?.set_title) {
      await annaClient.window.set_title({ title: 'AI Proposal Writer' }).catch(() => {})
    }
    if (annaClient?.window?.ready) {
      await annaClient.window.ready({}).catch(() => {})
    }
  } catch (err) {
    console.info('Anna runtime not connected (standalone preview mode).', err)
    isStandalone = true
  }

  hasConnected = true
  return { isStandalone }
}

export async function setWindowTitle(title: string): Promise<void> {
  if (annaClient?.window?.set_title) {
    await annaClient.window.set_title({ title }).catch(() => {})
  }
}

export async function storageGet<T>(key: string, defaultValue: T): Promise<T> {
  // Try Anna Host storage first
  if (annaClient?.storage?.get) {
    try {
      const resp = await annaClient.storage.get({ key })
      if (resp && resp.value !== undefined && resp.value !== null) {
        return resp.value as T
      }
    } catch (e) {
      console.warn(`Anna storage get failed for ${key}, falling back to localStorage:`, e)
    }
  }

  // Fallback to browser localStorage
  try {
    const raw = localStorage.getItem(key)
    if (raw) {
      return JSON.parse(raw) as T
    }
  } catch (e) {
    console.warn(`localStorage get failed for ${key}:`, e)
  }

  return defaultValue
}

export async function storageSet<T>(key: string, value: T): Promise<void> {
  // Always update localStorage as immediate fast cache
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.warn(`localStorage set failed for ${key}:`, e)
  }

  // Update Anna Host storage if available
  if (annaClient?.storage?.set) {
    try {
      await annaClient.storage.set({ key, value })
    } catch (e) {
      console.warn(`Anna storage set failed for ${key}:`, e)
    }
  }
}

export async function storageDelete(key: string): Promise<void> {
  try {
    localStorage.removeItem(key)
  } catch {}

  if (annaClient?.storage?.delete) {
    try {
      await annaClient.storage.delete({ key })
    } catch (e) {
      console.warn(`Anna storage delete failed for ${key}:`, e)
    }
  }
}

export async function invokeExecutaTool<T = any>(
  method: string,
  args: Record<string, any>
): Promise<T> {
  if (!annaClient?.tools?.invoke) {
    throw new Error(
      'Executa tool cannot be called because Anna host runtime is not connected in standalone preview.'
    )
  }

  const tool_id = getResolvedToolId()

  const raw = await annaClient.tools.invoke({
    tool_id,
    method,
    args,
    timeoutMs: 65000,
  })

  // Normalize envelope: result.success / result.data vs direct success / data
  const envelope = raw?.result || raw

  if (!envelope) {
    throw new Error('Empty response from Executa tool.')
  }

  if (envelope.success === false) {
    throw new Error(envelope.error || `Tool call ${method} failed.`)
  }

  return (envelope.data ?? envelope) as T
}
