export const optionalTransactionInstitutionMigration = {
  version: 4,
  statements: [
    `CREATE TABLE transactions_next (
      id TEXT PRIMARY KEY NOT NULL,
      description TEXT NOT NULL,
      amount_cents INTEGER NOT NULL,
      category_id TEXT NOT NULL,
      institution_id TEXT,
      date TEXT NOT NULL,
      is_confirmed INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES financial_categories (id),
      FOREIGN KEY (institution_id) REFERENCES financial_institutions (id)
    )`,
    `INSERT INTO transactions_next SELECT * FROM transactions`,
    `DROP TABLE transactions`,
    `ALTER TABLE transactions_next RENAME TO transactions`,
    `CREATE INDEX idx_transactions_date ON transactions (date)`,
    `CREATE INDEX idx_transactions_category_id ON transactions (category_id)`,
    `CREATE INDEX idx_transactions_institution_id ON transactions (institution_id)`,
  ],
} as const;
