import test from 'node:test'
import assert from 'node:assert/strict'

// Import VoiceEngine compiled from TS or direct class mirror
class TestVoiceEngine {
  constructor(callbacks) {
    this.callbacks = callbacks
    this.state = 'idle'
    this.finalSegments = []
    this.interimSegment = ''
    this.sessionId = 0
  }

  processSpeechEvent(event, eventSessionId = this.sessionId) {
    if (eventSessionId !== this.sessionId) return

    let currentInterim = ''
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const item = event.results[i]
      if (!item || !item[0]) continue
      const text = (item[0].transcript || '').trim()
      if (!text) continue

      if (item.isFinal) {
        this.finalSegments.push(text)
      } else {
        currentInterim += (currentInterim ? ' ' : '') + text
      }
    }

    this.interimSegment = currentInterim
    const fullFinal = this.finalSegments.join(' ').trim()
    this.callbacks.onTranscriptUpdate(fullFinal, this.interimSegment)
  }

  start(existing = '') {
    this.sessionId = Date.now() + Math.random()
    this.finalSegments = existing.trim() ? [existing.trim()] : []
    this.interimSegment = ''
    this.state = 'listening'
    this.callbacks.onStateChange('listening')
  }

  stop() {
    this.sessionId = 0
    if (this.interimSegment.trim()) {
      this.finalSegments.push(this.interimSegment.trim())
      this.interimSegment = ''
    }
    const fullFinal = this.finalSegments.join(' ').trim()
    this.callbacks.onTranscriptUpdate(fullFinal, '')
    this.state = fullFinal ? 'ready' : 'idle'
    this.callbacks.onStateChange(this.state)
  }

  clear() {
    this.finalSegments = []
    this.interimSegment = ''
    this.callbacks.onTranscriptUpdate('', '')
    this.state = 'idle'
  }
}

test('VoiceEngine: Prevents duplicated interim accumulation', () => {
  let latestFinal = ''
  let latestInterim = ''

  const engine = new TestVoiceEngine({
    onStateChange: () => {},
    onTranscriptUpdate: (f, i) => {
      latestFinal = f
      latestInterim = i
    },
    onError: () => {},
    onEnd: () => {},
  })

  engine.start()

  // Simulate 3 rapid interim speech events for the same phrase
  // e.g. "I want" -> "I want to build" -> "I want to build a website for a restaurant."
  engine.processSpeechEvent({
    resultIndex: 0,
    results: [{ 0: { transcript: 'I want' }, isFinal: false, length: 1 }],
  })
  assert.equal(latestFinal, '', 'Final must remain empty during interim events')
  assert.equal(latestInterim, 'I want')

  engine.processSpeechEvent({
    resultIndex: 0,
    results: [{ 0: { transcript: 'I want to build' }, isFinal: false, length: 1 }],
  })
  assert.equal(latestFinal, '', 'Final must remain empty')
  assert.equal(latestInterim, 'I want to build', 'Interim must replace previous interim, not append')

  engine.processSpeechEvent({
    resultIndex: 0,
    results: [{ 0: { transcript: 'I want to build a website for a restaurant.' }, isFinal: true, length: 1 }],
  })
  assert.equal(latestFinal, 'I want to build a website for a restaurant.', 'Final must appear EXACTLY ONCE')
  assert.equal(latestInterim, '', 'Interim must clear when final is committed')
})

test('VoiceEngine: Multiple sequential utterances accumulate correctly without duplicating', () => {
  let latestFinal = ''
  let latestInterim = ''

  const engine = new TestVoiceEngine({
    onStateChange: () => {},
    onTranscriptUpdate: (f, i) => {
      latestFinal = f
      latestInterim = i
    },
    onError: () => {},
    onEnd: () => {},
  })

  engine.start()

  // First sentence
  engine.processSpeechEvent({
    resultIndex: 0,
    results: [{ 0: { transcript: 'Client is Nexa Logistics.' }, isFinal: true, length: 1 }],
  })
  assert.equal(latestFinal, 'Client is Nexa Logistics.')

  // Second sentence after brief pause
  engine.processSpeechEvent({
    resultIndex: 1,
    results: [
      { 0: { transcript: 'Client is Nexa Logistics.' }, isFinal: true, length: 1 },
      { 0: { transcript: 'Budget is $28,000 with an 8-week delivery.' }, isFinal: true, length: 1 },
    ],
  })
  assert.equal(latestFinal, 'Client is Nexa Logistics. Budget is $28,000 with an 8-week delivery.')
})

test('VoiceEngine: Intentional user repetition is preserved', () => {
  let latestFinal = ''

  const engine = new TestVoiceEngine({
    onStateChange: () => {},
    onTranscriptUpdate: (f) => {
      latestFinal = f
    },
    onError: () => {},
    onEnd: () => {},
  })

  engine.start()
  engine.processSpeechEvent({
    resultIndex: 0,
    results: [{ 0: { transcript: 'Security is very very important.' }, isFinal: true, length: 1 }],
  })

  assert.equal(latestFinal, 'Security is very very important.')
})

test('VoiceEngine: Discards stale events from previous sessions', () => {
  let latestFinal = ''

  const engine = new TestVoiceEngine({
    onStateChange: () => {},
    onTranscriptUpdate: (f) => {
      latestFinal = f
    },
    onError: () => {},
    onEnd: () => {},
  })

  engine.start()
  const oldSession = engine.sessionId

  // Restart rapidly
  engine.start()
  assert.notEqual(engine.sessionId, oldSession)

  // Stale event arriving from old session
  engine.processSpeechEvent(
    {
      resultIndex: 0,
      results: [{ 0: { transcript: 'Zombie utterance from canceled session' }, isFinal: true, length: 1 }],
    },
    oldSession
  )

  assert.equal(latestFinal, '', 'Late events from defunct sessions must be safely dropped')
})

test('VoiceEngine: Stop commits pending interim buffer', () => {
  let latestFinal = ''

  const engine = new TestVoiceEngine({
    onStateChange: () => {},
    onTranscriptUpdate: (f) => {
      latestFinal = f
    },
    onError: () => {},
    onEnd: () => {},
  })

  engine.start()
  engine.processSpeechEvent({
    resultIndex: 0,
    results: [{ 0: { transcript: 'Finalizing live brief now' }, isFinal: false, length: 1 }],
  })

  engine.stop()
  assert.equal(latestFinal, 'Finalizing live brief now', 'Pending interim committed upon stop')
  assert.equal(engine.state, 'ready')
})
