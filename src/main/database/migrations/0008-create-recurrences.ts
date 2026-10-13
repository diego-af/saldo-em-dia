export const createRecurrencesMigration = {
  version: 8,
  statements: [
    `CREATE TABLE recurrences (
      id TEXT PRIMARY KEY NOT NULL,
      description TEXT NOT NULL,
      category_id TEXT NOT NULL,
      amount_cents INTEGER NOT NULL,
      start_date TEXT NOT NULL,
      due_day INTEGER NOT NULL,
      is_salary INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES financial_categories (id)
    )`,
    `CREATE TABLE recurrence_occurrences (
      id TEXT PRIMARY KEY NOT NULL,
      recurrence_id TEXT NOT NULL,
      amount_cents INTEGER NOT NULL,
      actual_amount_cents INTEGER,
      due_date TEXT NOT NULL,
      confirmation_date TEXT,
      FOREIGN KEY (recurrence_id) REFERENCES recurrences (id),
      UNIQUE (recurrence_id, due_date)
    )`,
    "CREATE INDEX idx_recurrence_occurrences_due_date ON recurrence_occurrences (due_date)",
  ],
} as const;
