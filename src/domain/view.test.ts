import assert from 'node:assert/strict'
import { test } from 'node:test'
import { personId } from './person.ts'
import { earliestView } from './view.ts'

test('earliestView selects the earliest instant and keeps the first view on a tie', () => {
  const viewer = personId('viewer')
  const earlier = { viewer, viewedAt: Temporal.Instant.from('2026-11-26T10:00:00Z') }
  const later = { viewer, viewedAt: Temporal.Instant.from('2026-11-26T12:00:00Z') }

  assert.equal(earliestView(earlier, later), earlier)
  assert.equal(earliestView(later, earlier), earlier)
  assert.equal(earliestView(earlier, { ...earlier }), earlier)
})
