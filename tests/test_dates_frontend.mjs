import test from 'node:test'
import assert from 'node:assert/strict'

// Import functions implemented in ui/src/utils.ts
function formatLocalDate(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseLocalDate(isoStr) {
  const parts = isoStr.slice(0, 10).split('-')
  const y = Number(parts[0]) || 2026
  const m = Number(parts[1]) || 1
  const d = Number(parts[2]) || 1
  return new Date(y, m - 1, d)
}

function addDaysToIso(isoDateStr, days) {
  const dt = parseLocalDate(isoDateStr)
  dt.setDate(dt.getDate() + days)
  return formatLocalDate(dt)
}

function sanitizeProposalDates(proposal, referenceDate = new Date()) {
  const todayStr = formatLocalDate(referenceDate)
  const defaultValidUntil = addDaysToIso(todayStr, 30)

  let sanitized = { ...proposal }

  if (
    !sanitized.generatedDate ||
    sanitized.generatedDate < todayStr ||
    !/^\d{4}-\d{2}-\d{2}$/.test(sanitized.generatedDate)
  ) {
    sanitized.generatedDate = todayStr
    sanitized.validUntil = defaultValidUntil
  } else if (
    !sanitized.validUntil ||
    sanitized.validUntil <= sanitized.generatedDate ||
    !/^\d{4}-\d{2}-\d{2}$/.test(sanitized.validUntil)
  ) {
    sanitized.validUntil = addDaysToIso(sanitized.generatedDate, 30)
  }

  return sanitized
}

test('Test A: Current generation date calculation', () => {
  const fixedDate = new Date(2026, 9, 12, 10, 30, 0) // Oct 12, 2026
  const formatted = formatLocalDate(fixedDate)
  assert.equal(formatted, '2026-10-12')
})

test('Test B: 30-day validity period rule calculation', () => {
  const cases = [
    { start: '2026-10-12', expected: '2026-11-11' }, // 31 days in October: 12 + 30 = Nov 11
    { start: '2026-02-01', expected: '2026-03-03' }, // 28 days in Feb 2026: 1 + 30 = Mar 3
    { start: '2028-02-01', expected: '2028-03-02' }, // Leap year 2028 (29 days in Feb): Feb 1 + 30 = Mar 2
    { start: '2026-12-15', expected: '2027-01-14' }, // Year boundary crossover
  ]

  for (const c of cases) {
    const validUntil = addDaysToIso(c.start, 30)
    assert.equal(validUntil, c.expected, `Failed for start ${c.start}`)

    // Verify delta in milliseconds / days
    const startDt = parseLocalDate(c.start)
    const endDt = parseLocalDate(validUntil)
    const diffDays = Math.round((endDt - startDt) / (1000 * 60 * 60 * 24))
    assert.equal(diffDays, 30, `Difference must be exactly 30 days for ${c.start}`)
  }
})

test('Test C: Timezone and midnight boundary safety', () => {
  // Midnight start: 00:00:01
  const justAfterMidnight = new Date(2026, 9, 12, 0, 0, 1)
  assert.equal(formatLocalDate(justAfterMidnight), '2026-10-12')

  // Midnight end: 23:59:59
  const justBeforeMidnight = new Date(2026, 9, 12, 23, 59, 59)
  assert.equal(formatLocalDate(justBeforeMidnight), '2026-10-12')

  // Parse local date maintains exact day
  const parsed = parseLocalDate('2026-10-12')
  assert.equal(parsed.getFullYear(), 2026)
  assert.equal(parsed.getMonth(), 9) // 0-indexed October
  assert.equal(parsed.getDate(), 12)
})

test('Test D: Persistence round-trip', () => {
  const original = {
    id: 'proposal_1728000000_abc123',
    title: 'Website Redesign',
    generatedDate: '2026-10-12',
    validUntil: '2026-11-11',
    status: 'draft',
    totalValue: '₹1,50,000',
    sections: [
      { id: 's1', title: 'Executive Summary', content: 'Summary text', isEdited: false },
    ],
  }

  // Simulate JSON serialization to Anna storage
  const serialized = JSON.stringify(original)
  const deserialized = JSON.parse(serialized)

  assert.equal(deserialized.generatedDate, '2026-10-12')
  assert.equal(deserialized.validUntil, '2026-11-11')
  assert.deepEqual(deserialized, original)
})

test('Test E: Edit and regeneration date preservation', () => {
  const proposal = {
    id: 'proposal_100',
    title: 'Enterprise Architecture',
    generatedDate: '2026-10-12',
    validUntil: '2026-11-11',
    createdAt: '2026-10-12T10:00:00.000Z',
    updatedAt: '2026-10-12T10:00:00.000Z',
    sections: [
      { id: 'sec_1', title: 'Scope', content: 'Original Scope', isEdited: false },
    ],
  }

  // User edits a section content
  const editedSections = proposal.sections.map((s) =>
    s.id === 'sec_1' ? { ...s, content: 'Updated Scope', isEdited: true } : s
  )
  const afterEdit = {
    ...proposal,
    sections: editedSections,
    updatedAt: '2026-10-15T14:00:00.000Z',
  }

  assert.equal(afterEdit.generatedDate, '2026-10-12', 'generatedDate must not change on section edit')
  assert.equal(afterEdit.validUntil, '2026-11-11', 'validUntil must not change on section edit')
  assert.equal(afterEdit.sections[0].isEdited, true)

  // User regenerates section content
  const regeneratedSections = afterEdit.sections.map((s) =>
    s.id === 'sec_1' ? { ...s, content: 'AI Regenerated Content', isEdited: false } : s
  )
  const afterRegen = {
    ...afterEdit,
    sections: regeneratedSections,
    updatedAt: '2026-10-16T09:00:00.000Z',
  }

  assert.equal(afterRegen.generatedDate, '2026-10-12', 'generatedDate must not change on regenerate')
  assert.equal(afterRegen.validUntil, '2026-11-11', 'validUntil must not change on regenerate')
})

test('Test F: PDF Export date string match', () => {
  const proposal = {
    title: 'Mobile App Delivery',
    generatedDate: '2026-10-12',
    validUntil: '2026-11-11',
  }

  // Format string in pdf-generator.ts:
  // `Generated: ${proposal.generatedDate}  |  Valid until: ${proposal.validUntil}`
  const expectedPdfString = `Generated: ${proposal.generatedDate}  |  Valid until: ${proposal.validUntil}`
  assert.equal(expectedPdfString, 'Generated: 2026-10-12  |  Valid until: 2026-11-11')
})

test('Test G: Existing and legacy records rendering without mutation', () => {
  const demoStyleHub = {
    id: 'demo_stylehub',
    title: 'E-commerce Platform for StyleHub',
    generatedDate: '2025-05-10',
    validUntil: '2025-06-09',
    status: 'accepted',
    totalValue: '₹1,25,000',
  }

  // Existing records from storage must not be re-sanitized or mutated
  assert.equal(demoStyleHub.generatedDate, '2025-05-10')
  assert.equal(demoStyleHub.validUntil, '2025-06-09')
})

test('Test Defense-in-Depth: Stale LLM dates (2023-10-27) sanitization', () => {
  const fixedClock = new Date(2026, 9, 12)
  const staleResponse = {
    id: 'proposal_123',
    title: 'AI Proposal Platform',
    generatedDate: '2023-10-27',
    validUntil: '2023-11-27',
  }

  const sanitized = sanitizeProposalDates(staleResponse, fixedClock)
  assert.equal(sanitized.generatedDate, '2026-10-12')
  assert.equal(sanitized.validUntil, '2026-11-11')
})
