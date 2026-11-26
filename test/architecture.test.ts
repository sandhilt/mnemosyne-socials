import assert from 'node:assert/strict'
import { globSync, readFileSync } from 'node:fs'
import { posix } from 'node:path'
import { test } from 'node:test'

function allowsImport(file: string, specifier: string): boolean {
  const layer = file.split('/')[1]
  if (specifier.startsWith('node:')) {
    return layer === 'infrastructure' || file === 'src/main.ts' ||
      (file.endsWith('.test.ts') &&
        ['node:test', 'node:assert', 'node:assert/strict'].includes(specifier))
  }

  const alias = /^#(domain|application|infrastructure)\/(.+)$/.exec(specifier)
  const target = alias
    ? posix.normalize(`src/${alias[1]}/${alias[2]}`)
    : specifier.startsWith('./') || specifier.startsWith('../')
      ? posix.join(posix.dirname(file), specifier)
      : ''
  if (!target || target === '..' || target.startsWith('../')) return false

  if (file === 'src/main.ts' || layer === 'infrastructure') return true
  return target.startsWith('src/domain/') ||
    (layer === 'application' && target.startsWith('src/application/'))
}

// A text scan can flag an import written inside a comment. That fails loudly, which is the safe side.
function imports(source: string): string[] {
  const pattern = /\b(?:from\s*|import\s*(?:\(\s*)?)(['"])([^'"\n]+)\1|\bimport\s*\(\s*(?!['"\s])/g
  return Array.from(source.matchAll(pattern), (match) => match[2] ?? '<computed import>')
}

test('source imports respect layer boundaries', () => {
  const violations = globSync('src/**/*.ts').sort().flatMap((file) =>
    [...imports(readFileSync(file, 'utf8'))]
      .filter((specifier) => !allowsImport(file, specifier))
      .map((specifier) => `${file} imports ${specifier}`),
  )
  assert.deepEqual(violations, [])
})

test('dependency rules reject imports that cross layer boundaries', () => {
  assert.equal(allowsImport('src/domain/model.ts', '#application/use-case.ts'), false)
  assert.equal(allowsImport('src/domain/model.ts', 'node:fs'), false)
  assert.equal(allowsImport('src/domain/model.ts', 'some-package'), false)
  assert.equal(allowsImport('src/application/use-case.ts', '../infrastructure/config.ts'), false)
  assert.equal(allowsImport('src/infrastructure/config.ts', '../../../outside.ts'), false)
  assert.equal(allowsImport('src/application/use-case.ts', '#domain/model.ts'), true)
  assert.equal(allowsImport('src/domain/model.test.ts', 'node:assert/strict'), true)
  assert.equal(allowsImport('src/main.ts', '#infrastructure/config.ts'), true)
})

test('finds static, type-only, re-export and dynamic imports', () => {
  assert.deepEqual(imports(`
    import 'a'
    import config, { other } from 'b'
    import type { Config } from "c"
    export type { Config } from 'd'
    export * as config from 'e'
    const adapter = await import (
      'f'
    )
    const computed = await import(name)
    const url = import.meta.url
  `), ['a', 'b', 'c', 'd', 'e', 'f', '<computed import>'])
})
