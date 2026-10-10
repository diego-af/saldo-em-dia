export const createCreditCardsMigration = {
  version: 6,
  statements: [
    `CREATE TABLE credit_cards (
      id TEXT PRIMARY KEY NOT NULL,
      institution_id TEXT NOT NULL,
      limit_cents INTEGER NOT NULL,
      closing_day INTEGER NOT NULL,
      due_day INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (institution_id) REFERENCES financial_institutions (id)
    )`,
    `CREATE TABLE credit_card_purchases (
      id TEXT PRIMARY KEY NOT NULL,
      card_id TEXT NOT NULL,
      category_id TEXT NOT NULL,
      description TEXT NOT NULL,
      notes TEXT,
      total_cents INTEGER NOT NULL,
      purchase_date TEXT NOT NULL,
      installment_count INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (card_id) REFERENCES credit_cards (id),
      FOREIGN KEY (category_id) REFERENCES financial_categories (id)
    )`,
    `CREATE TABLE credit_card_installments (
      id TEXT PRIMARY KEY NOT NULL,
      purchase_id TEXT NOT NULL,
      card_id TEXT NOT NULL,
      installment_number INTEGER NOT NULL,
      amount_cents INTEGER NOT NULL,
      invoice_month TEXT NOT NULL,
      due_date TEXT NOT NULL,
      FOREIGN KEY (purchase_id) REFERENCES credit_card_purchases (id),
      FOREIGN KEY (card_id) REFERENCES credit_cards (id)
    )`,
    `CREATE TABLE invoice_payments (
      id TEXT PRIMARY KEY NOT NULL,
      card_id TEXT NOT NULL,
      invoice_month TEXT NOT NULL,
      amount_cents INTEGER NOT NULL,
      payment_date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE (card_id, invoice_month),
      FOREIGN KEY (card_id) REFERENCES credit_cards (id)
    )`,
    "CREATE INDEX idx_card_installments_invoice ON credit_card_installments (card_id, invoice_month)",
  ],
} as const;
