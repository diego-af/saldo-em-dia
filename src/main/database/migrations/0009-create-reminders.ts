export const createRemindersMigration = {
  version: 9,
  statements: [
    `CREATE TABLE silenced_reminders (
      reminder_key TEXT PRIMARY KEY NOT NULL,
      silenced_at TEXT NOT NULL
    )`,
    `CREATE TABLE reminder_deliveries (
      reminder_key TEXT NOT NULL,
      notification_date TEXT NOT NULL,
      notified_at TEXT NOT NULL,
      PRIMARY KEY (reminder_key, notification_date)
    )`,
  ],
} as const;
