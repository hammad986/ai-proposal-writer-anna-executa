/**
 * Aetherion Labs - Controlled Voice Engine
 * Zero-duplication speech recognition state machine and session manager.
 */

export type VoiceState =
  | 'idle'
  | 'requesting_permission'
  | 'listening'
  | 'processing'
  | 'ready'
  | 'error'

export interface VoiceResultAlternative {
  transcript: string
  confidence?: number
}

export interface VoiceResultItem {
  isFinal: boolean
  0: VoiceResultAlternative
  length: number
}

export interface VoiceEventLike {
  resultIndex: number
  results: ArrayLike<VoiceResultItem>
}

export interface VoiceEngineCallbacks {
  onStateChange: (state: VoiceState) => void
  onTranscriptUpdate: (finalTranscript: string, interimTranscript: string) => void
  onError: (error: string, isPermissionDenied: boolean) => void
  onEnd: () => void
}

export class VoiceEngine {
  private recognition: any = null
  private state: VoiceState = 'idle'
  private finalSegments: string[] = []
  private interimSegment = ''
  private sessionId = 0
  private callbacks: VoiceEngineCallbacks
  private lang = 'en-IN'

  constructor(callbacks: VoiceEngineCallbacks) {
    this.callbacks = callbacks
  }

  public setLanguage(lang: string) {
    this.lang = lang
    if (this.recognition && this.state === 'listening') {
      try {
        this.recognition.lang = lang
      } catch (e) {
        // Ignore if engine does not allow hot language swapping
      }
    }
  }

  public getLanguage(): string {
    return this.lang
  }

  public getState(): VoiceState {
    return this.state
  }

  public getFinalTranscript(): string {
    return this.finalSegments.join(' ').trim()
  }

  public getInterimTranscript(): string {
    return this.interimSegment.trim()
  }

  public setInitialTranscript(text: string) {
    const clean = text.trim()
    this.finalSegments = clean ? [clean] : []
    this.interimSegment = ''
  }

  /**
   * Start speech recognition session with exclusive sessionId guard.
   */
  public start(existingText = '') {
    this.stop() // Always teardown any active recognition first

    const SpeechRecognition =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null

    if (!SpeechRecognition) {
      this.setState('error')
      this.callbacks.onError('Web Speech API is not supported in this browser.', false)
      return
    }

    const currentSession = Date.now() + Math.random()
    this.sessionId = currentSession

    if (existingText.trim()) {
      this.finalSegments = [existingText.trim()]
    } else {
      this.finalSegments = []
    }
    this.interimSegment = ''

    try {
      this.setState('requesting_permission')
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = this.lang
      recognition.maxAlternatives = 1

      recognition.onstart = () => {
        if (this.sessionId !== currentSession) return
        this.setState('listening')
      }

      recognition.onresult = (event: any) => {
        if (this.sessionId !== currentSession) return
        this.processSpeechEvent(event)
      }

      recognition.onerror = (event: any) => {
        if (this.sessionId !== currentSession) return
        const isPerm = event.error === 'not-allowed' || event.error === 'permission-denied'
        this.setState('error')
        this.callbacks.onError(event.error || 'Speech recognition notice', isPerm)
      }

      recognition.onend = () => {
        if (this.sessionId !== currentSession) return
        this.setState(this.finalSegments.length > 0 ? 'ready' : 'idle')
        this.callbacks.onEnd()
      }

      this.recognition = recognition
      recognition.start()
    } catch (err: any) {
      this.setState('error')
      this.callbacks.onError(err?.message || 'Could not activate microphone', false)
    }
  }

  /**
   * Pure deterministic processing of Web Speech recognition events.
   * Eliminates duplication by strictly differentiating between isFinal and interim buffers.
   */
  public processSpeechEvent(event: VoiceEventLike) {
    let currentInterim = ''

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const item = event.results[i]
      if (!item || !item[0]) continue

      const text = (item[0].transcript || '').trim()
      if (!text) continue

      if (item.isFinal) {
        // Final utterance: committed exactly once
        this.finalSegments.push(text)
      } else {
        // Interim utterance: replaces previous interim preview without touching final history
        currentInterim += (currentInterim ? ' ' : '') + text
      }
    }

    this.interimSegment = currentInterim
    const fullFinal = this.finalSegments.join(' ').trim()
    this.callbacks.onTranscriptUpdate(fullFinal, this.interimSegment)
  }

  /**
   * Graceful stop: commits any pending interim text as final before shutting down.
   */
  public stop() {
    this.sessionId = 0
    if (this.recognition) {
      try {
        this.recognition.onstart = null
        this.recognition.onresult = null
        this.recognition.onerror = null
        this.recognition.onend = null
        this.recognition.stop()
      } catch (e) {
        // Ignore abort errors
      }
      this.recognition = null
    }

    // If an interim fragment remains upon stop, commit it cleanly
    if (this.interimSegment.trim()) {
      this.finalSegments.push(this.interimSegment.trim())
      this.interimSegment = ''
    }

    const fullFinal = this.finalSegments.join(' ').trim()
    this.callbacks.onTranscriptUpdate(fullFinal, '')
    this.setState(fullFinal ? 'ready' : 'idle')
  }

  /**
   * Reset all recorded state
   */
  public clear() {
    this.finalSegments = []
    this.interimSegment = ''
    this.callbacks.onTranscriptUpdate('', '')
    this.setState('idle')
  }

  private setState(state: VoiceState) {
    this.state = state
    this.callbacks.onStateChange(state)
  }
}
