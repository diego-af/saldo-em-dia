export const addInitialBalanceMigration = {
  version: 3,
  statements: [
    `CREATE TABLE IF NOT EXISTS initial_balance (
      singleton INTEGER PRIMARY KEY NOT NULL CHECK (singleton = 1),
      amount_cents INTEGER NOT NULL,
      date TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
  ],
} as const;
