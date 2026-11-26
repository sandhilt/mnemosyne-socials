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

export type Resend = Readonly<{
  share: Share
  original: Share
  seenAt: Temporal.Instant | undefined
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
  return [...link.shares.values()].sort(compareShares)
}

function compareText(a: string, b: string): number {
  if (a === b) return 0
  return a < b ? -1 : 1
}

export function compareShares(a: Share, b: Share): number {
  return Temporal.Instant.compare(a.sentAt, b.sentAt)
    || compareText(a.channel, b.channel)
    || compareText(a.messageId, b.messageId)
    || compareText(a.key, b.key)
}

export function resendsOf(link: Link): readonly Resend[] {
  const [original, ...resends] = sharesOf(link)
  if (!original) return []

  return resends.map((share) => ({ share, original, seenAt: link.views.get(share.to)?.viewedAt }))
}
