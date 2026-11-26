import type { LinkKey } from './link-key.ts'
import type { PersonId } from './person.ts'
import type { Share } from './share.ts'
import { earliestView } from './view.ts'
import type { View } from './view.ts'

type ShareKey = `${Share['channel']}:${string}`

export type Link = Readonly<{
  key: LinkKey
  shares: ReadonlyMap<ShareKey, Share>
  views: ReadonlyMap<PersonId, View>
}>

export function recordShare(
  current: Link | undefined,
  share: Share,
): { link: Link; isNew: boolean; otherShares: readonly Share[] } {
  if (current && current.key !== share.key) throw new TypeError('Share belongs to a different link')

  const shareKey: ShareKey = `${share.channel}:${share.messageId}`
  const otherShares = current
    ? [...current.shares.entries().filter(([key]) => key !== shareKey).map(([, value]) => value)]
    : []
  if (current?.shares.has(shareKey)) return { link: current, isNew: false, otherShares }

  const shares = new Map(current?.shares)
  shares.set(shareKey, share)
  return {
    link: { key: share.key, shares, views: current?.views ?? new Map() },
    isNew: true,
    otherShares,
  }
}

export function recordView(link: Link, view: View): Link {
  const previous = link.views.get(view.viewer)
  if (previous && earliestView(previous, view) === previous) return link

  const views = new Map(link.views)
  views.set(view.viewer, view)
  return { ...link, views }
}

export function pendingShare(link: Link, person: PersonId): Share | undefined {
  if (link.views.has(person)) return
  return sharesOf(link).find((share) => share.to === person)
}

export function sharesOf(link: Link): readonly Share[] {
  return [...link.shares.values()].sort((a, b) => Temporal.Instant.compare(a.sentAt, b.sentAt))
}
