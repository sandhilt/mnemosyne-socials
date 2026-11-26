import assert from 'node:assert/strict'
import { test } from 'node:test'
import { loadConfig } from './config.ts'

test('defaults to a database in data/', () => {
  assert.deepEqual(loadConfig({}), { databasePath: 'data/mnemosyne.sqlite' })
})

test('uses the configured database path', () => {
  assert.deepEqual(loadConfig({ MNEMOSYNE_DB_PATH: 'custom.sqlite' }), {
    databasePath: 'custom.sqlite',
  })
})

test('rejects empty and whitespace-only database paths', () => {
  for (const value of ['', ' \t']) {
    assert.throws(() => loadConfig({ MNEMOSYNE_DB_PATH: value }), /MNEMOSYNE_DB_PATH/)
  }
})
