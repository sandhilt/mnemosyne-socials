import { sharesOf } from '#domain/link.ts'
import { linkKeyOf } from '#domain/link-key.ts'
import type { PersonId } from '#domain/person.ts'
import type { Share } from '#domain/share.ts'
import type { LinkRepository } from '../ports.ts'

export type LinkHistory = Readonly<{
  shares: readonly Share[]
  views: ReadonlyMap<PersonId, Temporal.Instant>
}>

export function createGetLinkHistory(links: LinkRepository) {
  return function getLinkHistory(url: string): LinkHistory | undefined {
    const key = linkKeyOf(url)
    const link = key === undefined ? undefined : links.find(key)
    if (link) return {
      shares: sharesOf(link),
      views: new Map(link.views.entries().map(([viewer, view]) => [viewer, view.viewedAt])),
    }
  }
}
