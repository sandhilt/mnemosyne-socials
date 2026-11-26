export type PersonId = string & { readonly __brand: 'PersonId' }

function isPersonId(id: string): id is PersonId {
  return id.trim().length > 0
}

export function personId(id: string): PersonId {
  if (!isPersonId(id)) throw new TypeError('Blank person ID')
  return id
}
