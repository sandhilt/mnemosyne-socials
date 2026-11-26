import type { PersonId } from './person.ts'

export type View = Readonly<{
  viewer: PersonId
  viewedAt: Temporal.Instant
}>

export function earliestView(a: View, b: View): View {
  return Temporal.Instant.compare(a.viewedAt, b.viewedAt) <= 0 ? a : b
}
