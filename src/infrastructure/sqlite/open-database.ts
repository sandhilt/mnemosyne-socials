import { DatabaseSync } from 'node:sqlite'

export function openDatabase(location: string): DatabaseSync {
  const database = new DatabaseSync(location, { enableForeignKeyConstraints: true })
  try {
    // In-memory databases keep their "memory" journal mode.
    database.exec('PRAGMA journal_mode = WAL')
    return database
  } catch (error) {
    database.close()
    throw error
  }
}
