import assert from 'node:assert/strict'
import { test } from 'node:test'
import { linkKeyOf } from './link-key.ts'

test('Instagram routes share a case-sensitive content ID', () => {
  const reel = linkKeyOf('https://www.instagram.com/reel/EXa/?igsh=example')
  assert.equal(reel, 'instagram:EXa')
  assert.equal(reel, linkKeyOf('https://instagram.com/p/EXa'))
  assert.notEqual(reel, linkKeyOf('https://instagram.com/p/exa'))
  assert.notEqual(reel, linkKeyOf('https://instagram.com.example.com/reel/EXa'))
})

test('TikTok video identity is independent of account name and query', () => {
  const video = linkKeyOf('https://www.tiktok.com/@example/video/123456?_t=example')
  assert.equal(video, 'tiktok:123456')
  assert.equal(video, linkKeyOf('https://m.tiktok.com/@example-other/video/123456'))
  assert.notEqual(video, linkKeyOf('https://www.tiktok.com/@example/video/123457'))
})

test('web URLs remove known tracking and keep unknown query parameters', () => {
  const url = linkKeyOf('https://EXAMPLE.com:443/video?z=2&fbclid=example&v=1&utm_source=chat#preview')
  assert.equal(url, 'web:https://example.com/video?v=1&z=2')
  assert.notEqual(url, linkKeyOf('https://example.com/video?v=2&z=2'))
  assert.notEqual(url, linkKeyOf('https://example.com/video?v=1&z=2&utm_unknown=example'))
})

test('invalid and non-HTTP URLs have no key', () => {
  for (const url of ['invalid', '/video', 'https://', 'http:example.com', 'ftp://example.com/video']) {
    assert.equal(linkKeyOf(url), undefined)
  }
})
