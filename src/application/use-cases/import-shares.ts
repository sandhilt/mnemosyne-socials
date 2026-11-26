import type { ShareInput, ShareSource } from '../ports.ts'
import type { RegisterResult } from './register-share.ts'

type RejectedShare = Readonly<{
  share: ShareInput
  reason: Extract<RegisterResult, { status: 'rejected' }>['reason']
}>

export type ImportReport = Readonly<{
  recorded: number
  duplicates: number
  rejected: readonly RejectedShare[]
}>

export function createImportShares(registerShare: (share: ShareInput) => RegisterResult) {
  return async function importShares(source: ShareSource): Promise<ImportReport> {
    let recorded = 0
    let duplicates = 0
    const rejected: RejectedShare[] = []

    for await (const share of source.read()) {
      const result = registerShare(share)
      switch (result.status) {
        case 'recorded':
          recorded++
          break
        case 'duplicate':
          duplicates++
          break
        case 'rejected':
          rejected.push({ share, reason: result.reason })
          break
      }
    }
    return { recorded, duplicates, rejected }
  }
}
