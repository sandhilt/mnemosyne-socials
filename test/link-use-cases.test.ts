import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { ShareInput, ShareSource } from '#application/ports.ts'
import { createGetLinkHistory } from '#application/use-cases/get-link-history.ts'
import { createImportShares } from '#application/use-cases/import-shares.ts'
import { createListPending } from '#application/use-cases/list-pending.ts'
import { createListResends } from '#application/use-cases/list-resends.ts'
import { createMarkViewed } from '#application/use-cases/mark-viewed.ts'
import { createRegisterShare } from '#application/use-cases/register-share.ts'
import { personId } from '#domain/person.ts'
import { createShare } from '#domain/share.ts'
import { createInMemoryLinkRepository } from '#infrastructure/memory/in-memory-link-repository.ts'
import { createMockShareSource } from '#infrastructure/mock/mock-share-source.ts'

const alex = personId('example-alex')
const sam = personId('example-sam')
const sentAt = Temporal.Instant.from('2026-11-26T10:00:00Z')
const later = Temporal.Instant.from('2026-11-26T12:00:00Z')
const share: ShareInput = {
  from: alex, to: sam, sentAt, channel: 'whatsapp', messageId: 'example-1',
  url: 'https://example.com/one?utm_source=chat',
}

function expectedShare(input: ShareInput) {
  return createShare({ ...input, from: personId(input.from), to: personId(input.to) })
}

function setup() {
  const links = createInMemoryLinkRepository()
  const registerShare = createRegisterShare(links)
  return {
    registerShare,
    importShares: createImportShares(registerShare),
    markViewed: createMarkViewed(links),
    listPending: createListPending(links),
    listResends: createListResends(links),
    getLinkHistory: createGetLinkHistory(links),
  }
}

test('rejected shares leave pending and history empty', async () => {
  const { importShares, listPending, getLinkHistory } = setup()
  const invalid = { ...share, url: '/one' }
  const self = { ...share, to: alex }
  assert.deepEqual(await importShares(createMockShareSource([invalid, self])), {
    recorded: 0,
    duplicates: 0,
    rejected: [
      { share: invalid, reason: 'invalid-url' },
      { share: self, reason: 'same-person' },
    ],
  })
  assert.deepEqual(listPending(sam), [])
  assert.deepEqual(listPending(alex), [])
  assert.equal(getLinkHistory(share.url), undefined)
})

test('resends from all links are listed oldest first', () => {
  const { registerShare, listResends, markViewed } = setup()
  const second = { ...share, url: 'https://example.com/two' }
  const latest = { ...share, messageId: 'example-2', sentAt: later }
  const middle = {
    ...second, messageId: 'example-2',
    sentAt: Temporal.Instant.from('2026-11-26T11:00:00Z'),
  }

  registerShare(latest)
  registerShare(share)
  registerShare(second)
  registerShare(middle)
  markViewed({ url: second.url, viewer: sam, at: sentAt })
  registerShare({ ...share, url: 'https://example.com/three' })

  assert.deepEqual(listResends(), [
    { share: expectedShare(middle), original: expectedShare(second), seenAt: sentAt },
    { share: expectedShare(latest), original: expectedShare(share), seenAt: undefined },
  ])
})

test('registering a share with a blank person ID throws', () => {
  const { registerShare, getLinkHistory } = setup()
  assert.throws(() => registerShare({ ...share, from: ' ' }), TypeError)
  assert.equal(getLinkHistory(share.url), undefined)
})

test('re-import deduplicates per link and message, including a retry after failure', async () => {
  const { importShares, listPending } = setup()
  const secondLink = { ...share, url: 'https://example.com/two' }
  const source = createMockShareSource([share, secondLink])
  const interrupted: ShareSource = {
    async *read() {
      yield share
      throw new Error('Source interrupted')
    },
  }

  await assert.rejects(importShares(interrupted), /Source interrupted/)
  assert.deepEqual(await importShares(source), { recorded: 1, duplicates: 1, rejected: [] })
  assert.deepEqual(await importShares(source), { recorded: 0, duplicates: 2, rejected: [] })
  assert.deepEqual(listPending(sam), [share, secondLink].map(expectedShare))
})

test('pending is oldest first, per recipient and per link, and stays gone after re-send', () => {
  const { registerShare, listPending, markViewed, getLinkHistory } = setup()
  const canonical = 'https://example.com/one'
  const repeat = { ...share, messageId: 'example-2', sentAt: later, url: canonical }
  const second = { ...repeat, messageId: 'example-3', url: 'https://example.com/two' }
  const reciprocal = { ...share, from: sam, to: alex, messageId: 'example-4' }

  assert.deepEqual(markViewed({ url: canonical, viewer: sam, at: later }), { status: 'unknown-link' })
  registerShare(second)
  registerShare(repeat)
  const registered = registerShare(share)
  assert.equal(registered.status, 'recorded')
  assert.deepEqual(registered.otherShares, [repeat].map(expectedShare))
  assert.equal(registered.recipientViewedAt, undefined)
  registerShare(reciprocal)
  assert.deepEqual(listPending(sam), [share, second].map(expectedShare))
  assert.deepEqual(listPending(alex), [reciprocal].map(expectedShare))

  assert.deepEqual(markViewed({ url: canonical, viewer: sam, at: later }), {
    status: 'viewed', viewedAt: later,
  })
  assert.deepEqual(markViewed({ url: share.url, viewer: sam, at: sentAt }), {
    status: 'already-viewed', viewedAt: sentAt,
  })
  assert.deepEqual(markViewed({ url: canonical, viewer: sam, at: later }), {
    status: 'already-viewed', viewedAt: sentAt,
  })
  assert.deepEqual(listPending(sam), [second].map(expectedShare))

  const resend = { ...repeat, messageId: 'example-5' }
  const result = registerShare(resend)
  assert.equal(result.status, 'recorded')
  assert.equal(result.recipientViewedAt, sentAt)
  assert.deepEqual(listPending(sam), [second].map(expectedShare))
  assert.deepEqual(listPending(alex), [reciprocal].map(expectedShare))
  const history = getLinkHistory(canonical)
  assert.ok(history)
  assert.deepEqual(history.shares, [share, reciprocal, repeat, resend].map(expectedShare))
  assert.equal(history.views.size, 1)
  assert.equal(history.views.get(sam), sentAt)
})
