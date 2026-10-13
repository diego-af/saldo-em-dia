import { randomUUID } from "node:crypto";
import type { SqlValue } from "sql.js";
import { generateMonthlyOccurrences } from "../../core/features/recurrences/generate-monthly-occurrences";
import {
  type ConfirmRecurrenceOccurrenceInput,
  type CreateRecurrenceInput,
  confirmRecurrenceOccurrenceInputSchema,
  createRecurrenceInputSchema,
  type Recurrence,
  type RecurrenceOccurrence,
  recurrenceIdSchema,
  recurrenceOccurrenceSchema,
  recurrenceSchema,
  type UpdateRecurrenceOccurrenceInput,
  updateRecurrenceOccurrenceInputSchema,
} from "../../shared/contracts/recurrence";
import type { DatabaseClient } from "./database-client";

export interface RecurrenceRepository {
  create(input: CreateRecurrenceInput): Recurrence;
  list(): Recurrence[];
  listOccurrences(recurrenceId: string): RecurrenceOccurrence[];
  updateOccurrence(input: UpdateRecurrenceOccurrenceInput): void;
  confirmOccurrence(input: ConfirmRecurrenceOccurrenceInput): void;
}

function query(client: DatabaseClient, sql: string, parameters: SqlValue[] = []): unknown[][] {
  const statement = client.database.prepare(sql);
  try {
    statement.bind(parameters);
    const result: unknown[][] = [];
    while (statement.step()) result.push(statement.get());
    return result;
  } finally {
    statement.free();
  }
}

export function createRecurrenceRepository(
  client: DatabaseClient,
  now: () => Date = () => new Date(),
): RecurrenceRepository {
  const list = () =>
    query(
      client,
      `SELECT id, description, category_id, amount_cents, start_date, is_salary, created_at
       FROM recurrences ORDER BY created_at DESC`,
    ).map(([id, description, categoryId, amountCents, startDate, isSalary, createdAt]) =>
      recurrenceSchema.parse({
        id,
        description,
        categoryId,
        amountCents,
        startDate,
        isSalary: Boolean(isSalary),
        createdAt,
      }),
    );

  const findOccurrence = (occurrenceId: string) => {
    const row = query(
      client,
      "SELECT recurrence_id, due_date FROM recurrence_occurrences WHERE id = ?",
      [occurrenceId],
    )[0];
    if (!row) throw new Error("Ocorrência não encontrada");
    return { recurrenceId: String(row[0]), dueDate: String(row[1]) };
  };

  return {
    create: (input) => {
      const valid = createRecurrenceInputSchema.parse(input);
      const category = query(client, "SELECT active FROM financial_categories WHERE id = ?", [
        valid.categoryId,
      ])[0];
      if (!category?.[0]) throw new Error("Categoria inválida");
      const recurrence = recurrenceSchema.parse({
        ...valid,
        id: randomUUID(),
        createdAt: now().toISOString(),
      });
      // shortcut: materializa 12 meses, ampliar para janela móvel quando o horizonte passar de um ano.
      const dueDates = generateMonthlyOccurrences(recurrence.startDate, 12);
      client.database.exec("BEGIN IMMEDIATE");
      try {
        client.database.run(
          `INSERT INTO recurrences
            (id, description, category_id, amount_cents, start_date, due_day, is_salary, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            recurrence.id,
            recurrence.description,
            recurrence.categoryId,
            recurrence.amountCents,
            recurrence.startDate,
            Number(recurrence.startDate.slice(-2)),
            Number(recurrence.isSalary),
            recurrence.createdAt,
          ],
        );
        for (const dueDate of dueDates) {
          client.database.run(
            `INSERT INTO recurrence_occurrences
              (id, recurrence_id, amount_cents, due_date) VALUES (?, ?, ?, ?)`,
            [randomUUID(), recurrence.id, recurrence.amountCents, dueDate],
          );
        }
        client.database.exec("COMMIT");
        client.persist();
        return recurrence;
      } catch (error) {
        client.database.exec("ROLLBACK");
        throw error;
      }
    },
    list,
    listOccurrences: (recurrenceId) => {
      const validId = recurrenceIdSchema.parse(recurrenceId);
      if (!list().some(({ id }) => id === validId)) throw new Error("Recorrência não encontrada");
      const today = now().toISOString().slice(0, 10);
      return query(
        client,
        `SELECT id, recurrence_id, amount_cents, actual_amount_cents, due_date, confirmation_date
         FROM recurrence_occurrences WHERE recurrence_id = ? ORDER BY due_date`,
        [validId],
      ).map(([id, storedId, amountCents, actualAmountCents, dueDate, confirmationDate]) =>
        recurrenceOccurrenceSchema.parse({
          id,
          recurrenceId: storedId,
          amountCents,
          actualAmountCents: actualAmountCents ?? null,
          dueDate,
          confirmationDate: confirmationDate ?? null,
          status: confirmationDate ? "confirmed" : String(dueDate) < today ? "overdue" : "pending",
        }),
      );
    },
    updateOccurrence: (input) => {
      const valid = updateRecurrenceOccurrenceInputSchema.parse(input);
      const occurrence = findOccurrence(valid.occurrenceId);
      client.database.exec("BEGIN IMMEDIATE");
      try {
        if (valid.scope === "single") {
          client.database.run(
            `UPDATE recurrence_occurrences SET amount_cents = ?, due_date = ?
             WHERE id = ? AND confirmation_date IS NULL`,
            [valid.amountCents, valid.dueDate, valid.occurrenceId],
          );
        } else {
          const dates = query(
            client,
            `SELECT id FROM recurrence_occurrences
             WHERE recurrence_id = ? AND due_date >= ? AND confirmation_date IS NULL ORDER BY due_date`,
            [occurrence.recurrenceId, occurrence.dueDate],
          );
          const futureDates = generateMonthlyOccurrences(valid.dueDate, dates.length);
          dates.forEach(([id], index) => {
            client.database.run(
              "UPDATE recurrence_occurrences SET amount_cents = ?, due_date = ? WHERE id = ?",
              [valid.amountCents, futureDates[index], String(id)],
            );
          });
          client.database.run("UPDATE recurrences SET amount_cents = ?, due_day = ? WHERE id = ?", [
            valid.amountCents,
            Number(valid.dueDate.slice(-2)),
            occurrence.recurrenceId,
          ]);
        }
        if (client.database.getRowsModified() === 0) throw new Error("Ocorrência já confirmada");
        client.database.exec("COMMIT");
        client.persist();
      } catch (error) {
        client.database.exec("ROLLBACK");
        throw error;
      }
    },
    confirmOccurrence: (input) => {
      const valid = confirmRecurrenceOccurrenceInputSchema.parse(input);
      client.database.run(
        `UPDATE recurrence_occurrences SET actual_amount_cents = ?, confirmation_date = ?
         WHERE id = ? AND confirmation_date IS NULL`,
        [valid.amountCents, valid.confirmationDate, valid.occurrenceId],
      );
      if (client.database.getRowsModified() === 0) {
        throw new Error("Ocorrência não encontrada ou já confirmada");
      }
      client.persist();
    },
  };
}
