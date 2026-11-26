import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { openDatabase } from './open-database.ts'

test('enforces foreign keys', () => {
  using database = openDatabase(':memory:')
  database.exec(`
    CREATE TABLE parent (id INTEGER PRIMARY KEY);
    CREATE TABLE child (parent_id INTEGER REFERENCES parent(id));
  `)
  assert.throws(
    () => database.exec('INSERT INTO child VALUES (1)'),
    /FOREIGN KEY constraint failed/,
  )
})

test('uses WAL for a file database', () => {
  const directory = mkdtempSync(join(tmpdir(), 'mnemosyne-'))
  try {
    using database = openDatabase(join(directory, 'test.sqlite'))
    assert.equal(database.prepare('PRAGMA journal_mode').get()?.journal_mode, 'wal')
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})
