import assert from 'node:assert/strict'
import { test } from 'node:test'
import { pendingShare, recordShare, recordView, resendsOf, sharesOf } from './link.ts'
import { personId } from './person.ts'
import { createShare } from './share.ts'

const from = personId('example-from')
const to = personId('example-to')
const url = 'https://example.com/video'
const earlier = Temporal.Instant.from('2026-11-26T10:00:00Z')
const later = Temporal.Instant.from('2026-11-26T12:00:00Z')
const fields = { from, to, url, channel: 'whatsapp', messageId: 'example-1', sentAt: later } as const
const share = createShare(fields)

test('the first record of a message wins and other messages stay in the history', () => {
  const first = recordShare(undefined, share)
  const other = createShare({ ...fields, channel: 'messenger', sentAt: earlier })
  const second = recordShare(first.link, other)
  const duplicate = recordShare(second.link, createShare({ ...fields, sentAt: earlier }))

  assert.equal(first.link.key, share.key)
  assert.equal(first.isNew, true)
  assert.deepEqual(first.otherShares, [])
  assert.deepEqual(first.link.shares, new Map([['whatsapp:example-1', share]]))
  assert.deepEqual(second.otherShares, [share])
  assert.equal(duplicate.isNew, false)
  assert.equal(duplicate.link, second.link)
  assert.deepEqual(duplicate.otherShares, [other])
  assert.deepEqual(sharesOf(duplicate.link), [other, share])
  assert.equal(pendingShare(duplicate.link, to), other)
})

test('a link rejects shares with a different key', () => {
  const { link } = recordShare(undefined, share)
  const unrelated = createShare({ ...fields, url: 'https://example.com/unrelated' })
  assert.throws(() => recordShare(link, unrelated), TypeError)
  assert.deepEqual(sharesOf(link), [share])
})

test('views preserve the earliest instant and affect only the viewer', () => {
  const { link } = recordShare(undefined, share)
  const senderView = { viewer: from, viewedAt: earlier }
  const senderViewed = recordView(link, senderView)
  assert.equal(pendingShare(senderViewed, to), share)

  const lateView = { viewer: to, viewedAt: later }
  const earlyView = { viewer: to, viewedAt: earlier }
  const first = recordView(senderViewed, lateView)
  const corrected = recordView(first, earlyView)
  assert.equal(recordView(corrected, lateView), corrected)
  assert.deepEqual(corrected.views, new Map([[from, senderView], [to, earlyView]]))
  assert.equal(first.views.get(to), lateView)
  assert.equal(pendingShare(corrected, to), undefined)
  assert.equal(link.views.size, 0)
})

test('changing the sorted history snapshot leaves the link intact', () => {
  const { link } = recordShare(undefined, share)
  Reflect.deleteProperty(sharesOf(link), 0)
  assert.deepEqual(sharesOf(link), [share])
})

test('resends use the earliest share and show when the recipient saw the link, before or after', () => {
  const original = createShare({ ...fields, channel: 'messenger', sentAt: earlier })
  const tied = createShare({ ...fields, messageId: 'example-3', sentAt: earlier, from: to, to: from })
  const laterMessage = createShare({ ...fields, messageId: 'example-2' })
  const first = recordShare(undefined, laterMessage).link
  const viewed = recordView(first, { viewer: to, viewedAt: later })
  const reciprocalView = recordView(viewed, { viewer: from, viewedAt: later })
  const recorded = recordShare(recordShare(reciprocalView, share).link, tied).link
  const link = recordShare(recorded, original).link

  assert.deepEqual(resendsOf(first), [])
  assert.deepEqual(resendsOf(recordShare(first, original).link), [
    { share: laterMessage, original, seenAt: undefined },
  ])
  assert.deepEqual(sharesOf(link), [original, tied, share, laterMessage])
  assert.deepEqual(resendsOf(link), [
    { share: tied, original, seenAt: later },
    { share, original, seenAt: later },
    { share: laterMessage, original, seenAt: later },
  ])
})
