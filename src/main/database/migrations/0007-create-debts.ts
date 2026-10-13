export const createDebtsMigration = {
  version: 7,
  statements: [
    `CREATE TABLE personal_debts (
      id TEXT PRIMARY KEY NOT NULL,
      creditor_name TEXT NOT NULL,
      total_cents INTEGER NOT NULL,
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE debt_installments (
      id TEXT PRIMARY KEY NOT NULL,
      debt_id TEXT NOT NULL,
      installment_number INTEGER NOT NULL,
      amount_cents INTEGER NOT NULL,
      due_date TEXT NOT NULL,
      payment_date TEXT,
      FOREIGN KEY (debt_id) REFERENCES personal_debts (id),
      UNIQUE (debt_id, installment_number)
    )`,
    "CREATE INDEX idx_debt_installments_due_date ON debt_installments (due_date)",
  ],
} as const;
