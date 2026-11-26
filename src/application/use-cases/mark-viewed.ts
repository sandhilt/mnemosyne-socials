import { recordView } from '#domain/link.ts'
import { linkKeyOf } from '#domain/link-key.ts'
import type { PersonId } from '#domain/person.ts'
import type { LinkRepository } from '../ports.ts'

export type ViewResult =
  | Readonly<{ status: 'viewed' | 'already-viewed'; viewedAt: Temporal.Instant }>
  | Readonly<{ status: 'unknown-link' }>

export function createMarkViewed(links: LinkRepository) {
  return function markViewed(input: { url: string; viewer: PersonId; at: Temporal.Instant }): ViewResult {
    const { url, viewer, at } = input
    const key = linkKeyOf(url)
    const link = key === undefined ? undefined : links.find(key)
    if (!link) return { status: 'unknown-link' }

    const previous = link.views.get(viewer)
    const updated = recordView(link, { viewer, viewedAt: at })
    if (updated !== link) links.save(updated)
    return {
      status: previous === undefined ? 'viewed' : 'already-viewed',
      viewedAt: updated.views.get(viewer)?.viewedAt ?? at,
    }
  }
}
