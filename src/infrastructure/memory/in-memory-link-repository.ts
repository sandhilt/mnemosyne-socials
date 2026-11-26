import type { LinkRepository } from '#application/ports.ts'
import type { LinkKey } from '#domain/link-key.ts'
import type { Link } from '#domain/link.ts'

export function createInMemoryLinkRepository(): LinkRepository {
  const links = new Map<LinkKey, Link>()
  return {
    find: (key) => links.get(key),
    save: (link) => { links.set(link.key, link) },
    findSharedTo(person) {
      return [...links.values()].filter((link) =>
        link.shares.values().some((share) => share.to === person),
      )
    },
  }
}
