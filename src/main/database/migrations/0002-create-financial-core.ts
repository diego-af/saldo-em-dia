export const createFinancialCoreMigration = {
  version: 2,
  statements: [
    `CREATE TABLE IF NOT EXISTS financial_categories (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS financial_institutions (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY NOT NULL,
      description TEXT NOT NULL,
      amount_cents INTEGER NOT NULL,
      category_id TEXT NOT NULL,
      institution_id TEXT NOT NULL,
      date TEXT NOT NULL,
      is_confirmed INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES financial_categories (id),
      FOREIGN KEY (institution_id) REFERENCES financial_institutions (id)
    )`,
    `CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions (date)`,
    `CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions (category_id)`,
    `CREATE INDEX IF NOT EXISTS idx_transactions_institution_id ON transactions (institution_id)`,
  ],
} as const;
