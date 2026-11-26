import { pendingShare } from '#domain/link.ts'
import type { PersonId } from '#domain/person.ts'
import type { Share } from '#domain/share.ts'
import type { LinkRepository } from '../ports.ts'

export function createListPending(links: LinkRepository) {
  return function listPending(person: PersonId): readonly Share[] {
    return links.findSharedTo(person)
      .map((link) => pendingShare(link, person))
      .filter((share) => share !== undefined)
      .sort((a, b) => Temporal.Instant.compare(a.sentAt, b.sentAt))
  }
}
