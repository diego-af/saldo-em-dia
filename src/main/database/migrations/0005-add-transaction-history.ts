export const addTransactionHistoryMigration = {
  version: 5,
  statements: [
    "ALTER TABLE transactions ADD COLUMN updated_at TEXT",
    "ALTER TABLE transactions ADD COLUMN deleted_at TEXT",
    "UPDATE transactions SET updated_at = created_at",
    `CREATE TABLE transaction_revisions (
      id TEXT PRIMARY KEY NOT NULL,
      transaction_id TEXT NOT NULL,
      before_json TEXT NOT NULL,
      after_json TEXT NOT NULL,
      changed_at TEXT NOT NULL,
      FOREIGN KEY (transaction_id) REFERENCES transactions (id)
    )`,
    "CREATE INDEX idx_transactions_deleted_at ON transactions (deleted_at)",
    "CREATE INDEX idx_transaction_revisions_transaction_id ON transaction_revisions (transaction_id)",
  ],
} as const;
