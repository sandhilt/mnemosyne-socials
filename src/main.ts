import { createGetLinkHistory } from '#application/use-cases/get-link-history.ts'
import { createImportShares } from '#application/use-cases/import-shares.ts'
import { createListPending } from '#application/use-cases/list-pending.ts'
import { createMarkViewed } from '#application/use-cases/mark-viewed.ts'
import { createRegisterShare } from '#application/use-cases/register-share.ts'
import { personId } from '#domain/person.ts'
import { createInMemoryLinkRepository } from '#infrastructure/memory/in-memory-link-repository.ts'
import { createMockShareSource } from '#infrastructure/mock/mock-share-source.ts'
import { samplePeople, sampleShares } from '#infrastructure/mock/sample-shares.ts'

const links = createInMemoryLinkRepository()
const importShares = createImportShares(createRegisterShare(links))
const listPending = createListPending(links)
const markViewed = createMarkViewed(links)
const getLinkHistory = createGetLinkHistory(links)
const source = createMockShareSource(sampleShares)

console.log('Primeira importação', await importShares(source))
console.log('Segunda importação', await importShares(source))

for (const person of samplePeople) {
  console.log('Pendentes de', person, listPending(personId(person)).map((share) => share.url))
}

const share = sampleShares[0]
if (share) {
  const { url } = share
  const viewer = personId(share.to)
  const view = markViewed({ url, viewer, at: Temporal.Now.instant() })
  console.log('Visualização', JSON.stringify(view))
  console.log('Pendentes após visualização', viewer, listPending(viewer))
  const history = getLinkHistory(url)
  if (history) {
    console.log('Histórico', JSON.stringify({
      shares: history.shares,
      views: Object.fromEntries(history.views),
    }, null, 2))
  }
}
