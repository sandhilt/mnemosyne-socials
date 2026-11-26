export type LinkKey = string & { readonly __brand: 'LinkKey' }

type KeyRule = (url: URL) => LinkKey | undefined

const key = (value: string) => value as LinkKey

const instagram: KeyRule = (url) => {
  if (url.hostname !== 'instagram.com' && url.hostname !== 'www.instagram.com') return
  const id = /^\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)\/?$/.exec(url.pathname)?.[1]
  if (id !== undefined) return key(`instagram:${id}`)
}

const tiktok: KeyRule = (url) => {
  if (url.hostname !== 'tiktok.com' && url.hostname !== 'www.tiktok.com' &&
      url.hostname !== 'm.tiktok.com') return
  const id = /^\/@[^/]+\/video\/([0-9]+)\/?$/.exec(url.pathname)?.[1]
  if (id !== undefined) return key(`tiktok:${id}`)
}

const trackingParams = new Set([
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id',
  'fbclid', 'gclid', 'igsh', 'igshid', 'ttclid',
])

const web: KeyRule = (url) => {
  url.hash = ''
  for (const name of new Set(url.searchParams.keys())) {
    if (trackingParams.has(name)) url.searchParams.delete(name)
  }
  url.searchParams.sort()
  return key(`web:${url.href}`)
}

const rules: readonly KeyRule[] = [instagram, tiktok, web]

export function linkKeyOf(raw: string): LinkKey | undefined {
  const input = raw.trim()
  if (!/^https?:\/\//i.test(input)) return
  const url = URL.parse(input)
  if (!url) return

  for (const rule of rules) {
    const result = rule(url)
    if (result !== undefined) return result
  }
}
