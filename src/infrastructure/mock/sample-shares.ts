import type { ShareInput } from '#application/ports.ts'

const alex = 'example-alex'
const sam = 'example-sam'

export const samplePeople = [alex, sam]

export const sampleShares: readonly ShareInput[] = [
  {
    from: alex, to: sam, channel: 'whatsapp', messageId: 'example-1',
    sentAt: Temporal.Instant.from('2026-11-26T12:00:00Z'),
    url: 'https://example.com/videos/one?utm_source=chat',
  },
  {
    from: alex, to: sam, channel: 'messenger', messageId: 'example-2',
    sentAt: Temporal.Instant.from('2026-11-26T12:05:00Z'),
    url: 'https://example.com/videos/one',
  },
  {
    from: sam, to: alex, channel: 'whatsapp', messageId: 'example-3',
    sentAt: Temporal.Instant.from('2026-11-26T12:10:00Z'),
    url: 'https://example.com/videos/two',
  },
]
