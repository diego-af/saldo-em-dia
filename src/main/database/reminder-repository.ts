import type { SqlValue } from "sql.js";
import {
  type PendingReminder,
  pendingReminder,
} from "../../core/features/reminders/select-due-reminders";
import { type ReminderKey, reminderKeySchema } from "../../shared/contracts/reminder";
import type { DatabaseClient } from "./database-client";

export interface ReminderRepository {
  listPending(): PendingReminder[];
  listSilenced(): ReminderKey[];
  silence(key: ReminderKey): void;
  wasDelivered(key: ReminderKey, notificationDate: string): boolean;
  markDelivered(key: ReminderKey, notificationDate: string, notifiedAt: string): void;
}

function query(client: DatabaseClient, sql: string, parameters: SqlValue[] = []): unknown[][] {
  const statement = client.database.prepare(sql);
  try {
    statement.bind(parameters);
    const rows: unknown[][] = [];
    while (statement.step()) rows.push(statement.get());
    return rows;
  } finally {
    statement.free();
  }
}

export function createReminderRepository(
  client: DatabaseClient,
  now: () => Date = () => new Date(),
): ReminderRepository {
  const listSilenced = () =>
    query(client, "SELECT reminder_key FROM silenced_reminders ORDER BY reminder_key").map(
      ([key]) => reminderKeySchema.parse(key),
    );

  return {
    listPending: () => {
      const rows = query(
        client,
        `SELECT 'invoice:' || i.card_id || ':' || i.invoice_month,
          'Fatura do cartão', SUM(i.amount_cents), MIN(i.due_date)
         FROM credit_card_installments i
         LEFT JOIN invoice_payments p
           ON p.card_id = i.card_id AND p.invoice_month = i.invoice_month
         LEFT JOIN silenced_reminders s
           ON s.reminder_key = 'invoice:' || i.card_id || ':' || i.invoice_month
         WHERE p.id IS NULL AND s.reminder_key IS NULL
         GROUP BY i.card_id, i.invoice_month
         UNION ALL
         SELECT 'debt-installment:' || i.id,
          'Parcela para ' || d.creditor_name, i.amount_cents, i.due_date
         FROM debt_installments i
         JOIN personal_debts d ON d.id = i.debt_id
         LEFT JOIN silenced_reminders s ON s.reminder_key = 'debt-installment:' || i.id
         WHERE i.payment_date IS NULL AND s.reminder_key IS NULL
         UNION ALL
         SELECT 'recurrence-occurrence:' || o.id,
          r.description, o.amount_cents, o.due_date
         FROM recurrence_occurrences o
         JOIN recurrences r ON r.id = o.recurrence_id
         LEFT JOIN silenced_reminders s ON s.reminder_key = 'recurrence-occurrence:' || o.id
         WHERE o.confirmation_date IS NULL AND s.reminder_key IS NULL`,
      );
      return rows.map(([key, title, amountCents, dueDate]) =>
        pendingReminder({
          key: reminderKeySchema.parse(key),
          title: String(title),
          body: `Vence em ${String(dueDate).split("-").reverse().join("/")} · R$ ${(Number(amountCents) / 100).toFixed(2).replace(".", ",")}`,
          dueDate: String(dueDate) as PendingReminder["dueDate"],
        }),
      );
    },
    listSilenced,
    silence: (key) => {
      const validKey = reminderKeySchema.parse(key);
      client.database.run(
        "INSERT OR IGNORE INTO silenced_reminders (reminder_key, silenced_at) VALUES (?, ?)",
        [validKey, now().toISOString()],
      );
      client.persist();
    },
    wasDelivered: (key, notificationDate) =>
      query(
        client,
        "SELECT 1 FROM reminder_deliveries WHERE reminder_key = ? AND notification_date = ?",
        [reminderKeySchema.parse(key), notificationDate],
      ).length > 0,
    markDelivered: (key, notificationDate, notifiedAt) => {
      client.database.run(
        `INSERT OR IGNORE INTO reminder_deliveries
          (reminder_key, notification_date, notified_at) VALUES (?, ?, ?)`,
        [reminderKeySchema.parse(key), notificationDate, notifiedAt],
      );
      client.persist();
    },
  };
}
