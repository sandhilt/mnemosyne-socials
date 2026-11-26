import type { Link } from '#domain/link.ts'
import type { PersonId } from '#domain/person.ts'
import type { Channel } from '#domain/share.ts'
import type { LinkKey } from '#domain/link-key.ts'

/**
 * Repository. Synchronous on purpose (node:sqlite is synchronous), so a
 * read-modify-write cannot interleave inside one process.
 */
export interface LinkRepository {
  find(key: LinkKey): Link | undefined
  list(): readonly Link[]
  /** Replaces the whole aggregate. */
  save(link: Link): void
  /** Links with at least one share to `person`, each with its full history. */
  findSharedTo(person: PersonId): readonly Link[]
}

export type ShareInput = Readonly<{
  from: string
  to: string
  channel: Channel
  messageId: string
  sentAt: Temporal.Instant
  url: string
}>

/** Adapter port: how links arrive is not decided. May yield messages already imported. */
export interface ShareSource {
  read(): AsyncIterable<ShareInput>
}
