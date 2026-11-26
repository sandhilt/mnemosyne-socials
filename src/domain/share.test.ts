import assert from 'node:assert/strict'
import { test } from 'node:test'
import { InvalidShareError } from './errors.ts'
import { personId } from './person.ts'
import { createShare } from './share.ts'

const from = personId('sender')
const to = personId('recipient')
const sentAt = Temporal.Instant.from('2026-11-26T10:00:00Z')
const url = 'https://example.com/video?utm_source=chat'
const fields = { from, to, sentAt, url, channel: 'whatsapp', messageId: 'message-1' } as const

test('Share exposes the supplied fields and derives the canonical key', () => {
  const input = { ...fields, messageId: 'actual-message' }
  const share = createShare(input)
  input.messageId = 'modified-message'
  assert.equal(share.from, from)
  assert.equal(share.to, to)
  assert.equal(share.sentAt, sentAt)
  assert.equal(share.url, url)
  assert.equal(share.channel, 'whatsapp')
  assert.equal(share.messageId, 'actual-message')
  assert.equal(share.key, 'web:https://example.com/video')
})

test('Share rejects equal person IDs and gives an invalid URL precedence', () => {
  const self = { ...fields, to: from }
  assert.throws(() => createShare(self),
    (error) => error instanceof InvalidShareError && error.reason === 'same-person')
  assert.throws(() => createShare({ ...self, url: '/video' }),
    (error) => error instanceof InvalidShareError && error.reason === 'invalid-url')
})
