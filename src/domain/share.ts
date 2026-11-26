import { InvalidShareError } from './errors.ts'
import { linkKeyOf } from './link-key.ts'
import type { LinkKey } from './link-key.ts'
import type { PersonId } from './person.ts'

export type Channel = 'whatsapp' | 'tiktok' | 'messenger' | 'instagram' | 'other'

export type Share = Readonly<{
  from: PersonId
  to: PersonId
  channel: Channel
  messageId: string
  sentAt: Temporal.Instant
  url: string
  key: LinkKey
}>

export function createShare(fields: Omit<Share, 'key'>): Share {
  const key = linkKeyOf(fields.url)
  if (key === undefined) throw new InvalidShareError('invalid-url')
  if (fields.from === fields.to) throw new InvalidShareError('same-person')
  return { ...fields, key }
}
