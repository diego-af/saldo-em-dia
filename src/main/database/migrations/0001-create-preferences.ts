export const createPreferencesMigration = {
  version: 1,
  statements: [
    `CREATE TABLE IF NOT EXISTS app_preferences (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
  ],
} as const;
