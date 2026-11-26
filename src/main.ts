import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { loadConfig } from '#infrastructure/config.ts'
import { openDatabase } from '#infrastructure/sqlite/open-database.ts'

const { databasePath } = loadConfig(process.env)
mkdirSync(dirname(databasePath), { recursive: true })
using database = openDatabase(databasePath)
console.log('Database ready')
