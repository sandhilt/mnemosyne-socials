import { recordShare } from '#domain/link.ts'
import { personId } from '#domain/person.ts'
import { createShare } from '#domain/share.ts'
import type { Share } from '#domain/share.ts'
import { InvalidShareError } from '#domain/errors.ts'
import type { ShareRejection } from '#domain/errors.ts'
import type { LinkRepository, ShareInput } from '../ports.ts'

export type RegisterResult =
  | Readonly<{
      status: 'recorded' | 'duplicate'
      otherShares: readonly Share[]
      recipientViewedAt: Temporal.Instant | undefined
    }>
  | Readonly<{ status: 'rejected'; reason: ShareRejection }>

export function createRegisterShare(links: LinkRepository) {
  return function registerShare(input: ShareInput): RegisterResult {
    let share: Share
    try {
      share = createShare({ ...input, from: personId(input.from), to: personId(input.to) })
    } catch (error) {
      if (error instanceof InvalidShareError) return { status: 'rejected', reason: error.reason }
      throw error
    }

    const current = links.find(share.key)
    const { link, isNew, otherShares } = recordShare(current, share)
    if (isNew) links.save(link)
    return {
      status: isNew ? 'recorded' : 'duplicate',
      otherShares,
      recipientViewedAt: link.views.get(share.to)?.viewedAt,
    }
  }
}
