export function loadConfig(env: Readonly<Record<string, string | undefined>>) {
  const databasePath = env.MNEMOSYNE_DB_PATH ?? 'data/mnemosyne.sqlite'
  if (databasePath.trim() === '') {
    throw new Error('MNEMOSYNE_DB_PATH must not be blank')
  }
  return { databasePath }
}
