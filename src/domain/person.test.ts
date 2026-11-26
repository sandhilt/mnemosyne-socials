import assert from 'node:assert/strict'
import { test } from 'node:test'
import { personId } from './person.ts'

test('personId rejects blank IDs and preserves the supplied ID', () => {
  assert.throws(() => personId(' \t '), TypeError)
  assert.equal(personId(' example-person '), ' example-person ')
})
