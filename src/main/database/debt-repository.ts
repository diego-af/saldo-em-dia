import { randomUUID } from "node:crypto";
import type { SqlValue } from "sql.js";
import {
  type CreateDebtInput,
  createDebtInputSchema,
  type Debt,
  type DebtInstallment,
  debtIdSchema,
  debtInstallmentSchema,
  debtSchema,
  type PayDebtInstallmentInput,
  payDebtInstallmentInputSchema,
} from "../../shared/contracts/debt";
import type { DatabaseClient } from "./database-client";

export interface DebtRepository {
  create(input: CreateDebtInput): Debt;
  list(): Debt[];
  listInstallments(debtId: string): DebtInstallment[];
  payInstallment(input: PayDebtInstallmentInput): void;
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

export function createDebtRepository(
  client: DatabaseClient,
  now: () => Date = () => new Date(),
): DebtRepository {
  const listInstallments = (debtId: string) => {
    const validId = debtIdSchema.parse(debtId);
    const today = now().toISOString().slice(0, 10);
    return query(
      client,
      `SELECT id, debt_id, installment_number, amount_cents, due_date, payment_date
       FROM debt_installments WHERE debt_id = ? ORDER BY installment_number`,
      [validId],
    ).map(([id, storedDebtId, number, amountCents, dueDate, paidAt]) =>
      debtInstallmentSchema.parse({
        id,
        debtId: storedDebtId,
        number,
        amountCents,
        dueDate,
        paidAt: paidAt ?? null,
        status: paidAt ? "paid" : String(dueDate) < today ? "overdue" : "pending",
      }),
    );
  };

  const list = () =>
    query(
      client,
      `SELECT d.id, d.creditor_name, d.total_cents, d.created_at,
        COALESCE(SUM(CASE WHEN i.payment_date IS NULL THEN i.amount_cents ELSE 0 END), 0)
       FROM personal_debts d LEFT JOIN debt_installments i ON i.debt_id = d.id
       GROUP BY d.id ORDER BY d.created_at DESC`,
    ).map(([id, creditorName, totalCents, createdAt, remainingCents]) =>
      debtSchema.parse({ id, creditorName, totalCents, createdAt, remainingCents }),
    );

  return {
    create: (input) => {
      const valid = createDebtInputSchema.parse(input);
      if (
        valid.installments.reduce((sum, item) => sum + item.amountCents, 0) !== valid.totalCents
      ) {
        throw new Error("A soma das parcelas deve ser igual ao valor total");
      }
      const numbers = new Set(valid.installments.map(({ number }) => number));
      if (numbers.size !== valid.installments.length) throw new Error("Parcelas duplicadas");
      const debt = debtSchema.parse({
        id: randomUUID(),
        creditorName: valid.creditorName,
        totalCents: valid.totalCents,
        remainingCents: valid.totalCents,
        createdAt: now().toISOString(),
      });
      client.database.exec("BEGIN IMMEDIATE");
      try {
        client.database.run(
          "INSERT INTO personal_debts (id, creditor_name, total_cents, created_at) VALUES (?, ?, ?, ?)",
          [debt.id, debt.creditorName, debt.totalCents, debt.createdAt],
        );
        for (const installment of valid.installments) {
          client.database.run(
            `INSERT INTO debt_installments
              (id, debt_id, installment_number, amount_cents, due_date)
             VALUES (?, ?, ?, ?, ?)`,
            [
              randomUUID(),
              debt.id,
              installment.number,
              installment.amountCents,
              installment.dueDate,
            ],
          );
        }
        client.database.exec("COMMIT");
        client.persist();
        return debt;
      } catch (error) {
        client.database.exec("ROLLBACK");
        throw error;
      }
    },
    list,
    listInstallments: (debtId) => {
      if (!list().some(({ id }) => id === debtId)) throw new Error("Dívida não encontrada");
      return listInstallments(debtId);
    },
    payInstallment: (input) => {
      const valid = payDebtInstallmentInputSchema.parse(input);
      client.database.run(
        "UPDATE debt_installments SET payment_date = ? WHERE id = ? AND payment_date IS NULL",
        [valid.paymentDate, valid.installmentId],
      );
      if (client.database.getRowsModified() === 0) {
        throw new Error("Parcela não encontrada ou já paga");
      }
      client.persist();
    },
  };
}
