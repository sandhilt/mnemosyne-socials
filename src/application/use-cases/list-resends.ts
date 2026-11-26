import { compareShares, resendsOf } from '#domain/link.ts'
import type { Resend } from '#domain/link.ts'
import type { LinkRepository } from '../ports.ts'

export function createListResends(links: LinkRepository) {
  return function listResends(): readonly Resend[] {
    return links.list()
      .flatMap(resendsOf)
      .sort((a, b) => compareShares(a.share, b.share))
  }
}
