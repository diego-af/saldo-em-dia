import { randomUUID } from "node:crypto";
import type { SqlValue } from "sql.js";
import { calculateBalances } from "../../core/features/transactions/calculate-balances";
import {
  type FinanceSummary,
  type FinancialCategory,
  type FinancialInstitution,
  financialCategorySchema,
  financialInstitutionSchema,
  type InitialBalanceInput,
  initialBalanceInputSchema,
  type SaveCategoryInput,
  type SaveInstitutionInput,
  type SaveTransactionInput,
  saveCategoryInputSchema,
  saveInstitutionInputSchema,
  saveTransactionInputSchema,
  type Transaction,
  type TransactionRevision,
  transactionIdSchema,
  transactionRevisionSchema,
  transactionSchema,
  type UpdateTransactionInput,
  updateTransactionInputSchema,
} from "../../shared/contracts/finance";
import type { DatabaseClient } from "./database-client";

export interface FinanceRepository {
  getSummary(): FinanceSummary;
  getCategories(): FinancialCategory[];
  saveCategory(input: SaveCategoryInput): FinancialCategory;
  getInstitutions(): FinancialInstitution[];
  saveInstitution(input: SaveInstitutionInput): FinancialInstitution;
  getTransactions(): Transaction[];
  getDeletedTransactions(): Transaction[];
  saveTransaction(input: SaveTransactionInput): Transaction;
  updateTransaction(input: UpdateTransactionInput): Transaction;
  getTransactionRevisions(transactionId: string): TransactionRevision[];
  deleteTransaction(transactionId: string): void;
  restoreTransaction(transactionId: string): Transaction;
  setInitialBalance(input: InitialBalanceInput): void;
}

function rows(client: DatabaseClient, sql: string): unknown[][] {
  return client.database.exec(sql)[0]?.values ?? [];
}

function parameterizedRows(
  client: DatabaseClient,
  sql: string,
  parameters: SqlValue[],
): unknown[][] {
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

export function createFinanceRepository(
  client: DatabaseClient,
  now: () => Date = () => new Date(),
): FinanceRepository {
  const getCategories = () =>
    rows(
      client,
      "SELECT id, name, type, active, created_at FROM financial_categories ORDER BY name",
    ).map(([id, name, type, active, createdAt]) =>
      financialCategorySchema.parse({ id, name, type, active: Boolean(active), createdAt }),
    );

  const getInstitutions = () =>
    rows(
      client,
      "SELECT id, name, active, created_at FROM financial_institutions ORDER BY name",
    ).map(([id, name, active, createdAt]) =>
      financialInstitutionSchema.parse({ id, name, active: Boolean(active), createdAt }),
    );

  const mapTransactions = (transactionRows: unknown[][]) =>
    transactionRows.map(
      ([
        id,
        description,
        amountCents,
        categoryId,
        institutionId,
        date,
        confirmed,
        notes,
        createdAt,
        updatedAt,
        deletedAt,
      ]) =>
        transactionSchema.parse({
          id,
          description: description || undefined,
          amountCents,
          categoryId,
          institutionId: institutionId || undefined,
          date,
          isConfirmed: Boolean(confirmed),
          notes: notes || undefined,
          createdAt,
          updatedAt,
          deletedAt: deletedAt || undefined,
        }),
    );

  const getTransactions = () =>
    mapTransactions(
      rows(
        client,
        `SELECT id, description, amount_cents, category_id, institution_id, date,
          is_confirmed, notes, created_at, updated_at, deleted_at FROM transactions
         WHERE deleted_at IS NULL ORDER BY date DESC, created_at DESC`,
      ),
    );

  const purgeExpiredTransactions = () => {
    const expiresBefore = new Date(now().getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();
    client.database.exec("BEGIN IMMEDIATE");
    try {
      client.database.run(
        `DELETE FROM transaction_revisions WHERE transaction_id IN
          (SELECT id FROM transactions WHERE deleted_at < ?)`,
        [expiresBefore],
      );
      client.database.run("DELETE FROM transactions WHERE deleted_at < ?", [expiresBefore]);
      client.database.exec("COMMIT");
      client.persist();
    } catch (error) {
      client.database.exec("ROLLBACK");
      throw error;
    }
  };

  const getDeletedTransactions = () => {
    purgeExpiredTransactions();
    return mapTransactions(
      rows(
        client,
        `SELECT id, description, amount_cents, category_id, institution_id, date,
          is_confirmed, notes, created_at, updated_at, deleted_at FROM transactions
         WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC`,
      ),
    );
  };

  const transactionValues = (transaction: Transaction): SaveTransactionInput => ({
    description: transaction.description,
    amountCents: transaction.amountCents,
    categoryId: transaction.categoryId,
    institutionId: transaction.institutionId,
    date: transaction.date,
    isConfirmed: transaction.isConfirmed,
    notes: transaction.notes,
  });

  const validateTransactionReferences = (
    input: SaveTransactionInput,
    existing?: Transaction,
  ): void => {
    const category = getCategories().find(({ id }) => id === input.categoryId);
    if (!category || (!category.active && category.id !== existing?.categoryId)) {
      throw new Error("Categoria inválida ou desativada");
    }
    if (input.institutionId) {
      const institution = getInstitutions().find(({ id }) => id === input.institutionId);
      if (!institution || (!institution.active && institution.id !== existing?.institutionId)) {
        throw new Error("Instituição inválida ou desativada");
      }
    }
  };

  return {
    getCategories,
    saveCategory: (input) => {
      const valid = saveCategoryInputSchema.parse(input);
      const existing = valid.id ? getCategories().find(({ id }) => id === valid.id) : undefined;
      const category = financialCategorySchema.parse({
        id: valid.id ?? randomUUID(),
        name: valid.name,
        type: existing?.type ?? valid.type,
        active: valid.active ?? true,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
      });
      client.database.run(
        `INSERT INTO financial_categories (id, name, type, active, created_at) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET name = excluded.name, type = excluded.type, active = excluded.active`,
        [category.id, category.name, category.type, Number(category.active), category.createdAt],
      );
      client.persist();
      return category;
    },
    getInstitutions,
    saveInstitution: (input) => {
      const valid = saveInstitutionInputSchema.parse(input);
      const existing = valid.id ? getInstitutions().find(({ id }) => id === valid.id) : undefined;
      const institution = financialInstitutionSchema.parse({
        id: valid.id ?? randomUUID(),
        name: valid.name,
        active: valid.active ?? true,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
      });
      client.database.run(
        `INSERT INTO financial_institutions (id, name, active, created_at) VALUES (?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET name = excluded.name, active = excluded.active`,
        [institution.id, institution.name, Number(institution.active), institution.createdAt],
      );
      client.persist();
      return institution;
    },
    getTransactions,
    getDeletedTransactions,
    saveTransaction: (input) => {
      const valid = saveTransactionInputSchema.parse(input);
      validateTransactionReferences(valid);
      const timestamp = now().toISOString();
      const transaction = transactionSchema.parse({
        ...valid,
        id: randomUUID(),
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      client.database.run(
        `INSERT INTO transactions
          (id, description, amount_cents, category_id, institution_id, date, is_confirmed, notes,
           created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transaction.id,
          transaction.description ?? "",
          transaction.amountCents,
          transaction.categoryId,
          transaction.institutionId ?? null,
          transaction.date,
          Number(transaction.isConfirmed),
          transaction.notes ?? null,
          transaction.createdAt,
          transaction.updatedAt,
        ],
      );
      client.persist();
      return transaction;
    },
    updateTransaction: (input) => {
      const valid = updateTransactionInputSchema.parse(input);
      const existing = getTransactions().find(({ id }) => id === valid.id);
      if (!existing) throw new Error("Lançamento não encontrado");
      validateTransactionReferences(valid, existing);
      const changedAt = now().toISOString();
      const updated = transactionSchema.parse({ ...existing, ...valid, updatedAt: changedAt });
      const revision = transactionRevisionSchema.parse({
        id: randomUUID(),
        transactionId: existing.id,
        before: transactionValues(existing),
        after: transactionValues(updated),
        changedAt,
      });
      client.database.exec("BEGIN IMMEDIATE");
      try {
        client.database.run(
          `INSERT INTO transaction_revisions
            (id, transaction_id, before_json, after_json, changed_at) VALUES (?, ?, ?, ?, ?)`,
          [
            revision.id,
            revision.transactionId,
            JSON.stringify(revision.before),
            JSON.stringify(revision.after),
            revision.changedAt,
          ],
        );
        client.database.run(
          `UPDATE transactions SET description = ?, amount_cents = ?, category_id = ?,
            institution_id = ?, date = ?, is_confirmed = ?, notes = ?, updated_at = ? WHERE id = ?`,
          [
            updated.description ?? "",
            updated.amountCents,
            updated.categoryId,
            updated.institutionId ?? null,
            updated.date,
            Number(updated.isConfirmed),
            updated.notes ?? null,
            updated.updatedAt,
            updated.id,
          ],
        );
        client.database.exec("COMMIT");
        client.persist();
        return updated;
      } catch (error) {
        client.database.exec("ROLLBACK");
        throw error;
      }
    },
    getTransactionRevisions: (transactionId) => {
      const validId = transactionIdSchema.parse(transactionId);
      return parameterizedRows(
        client,
        `SELECT id, transaction_id, before_json, after_json, changed_at
         FROM transaction_revisions WHERE transaction_id = ? ORDER BY changed_at DESC`,
        [validId],
      ).map(([id, storedTransactionId, before, after, changedAt]) =>
        transactionRevisionSchema.parse({
          id,
          transactionId: storedTransactionId,
          before: JSON.parse(String(before)),
          after: JSON.parse(String(after)),
          changedAt,
        }),
      );
    },
    deleteTransaction: (transactionId) => {
      const validId = transactionIdSchema.parse(transactionId);
      const deletedAt = now().toISOString();
      client.database.run(
        "UPDATE transactions SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL",
        [deletedAt, deletedAt, validId],
      );
      if (client.database.getRowsModified() === 0) throw new Error("Lançamento não encontrado");
      client.persist();
    },
    restoreTransaction: (transactionId) => {
      const validId = transactionIdSchema.parse(transactionId);
      const deleted = getDeletedTransactions().find(({ id }) => id === validId);
      if (!deleted?.deletedAt) throw new Error("Lançamento não encontrado ou expirado");
      const restoredAt = now().toISOString();
      client.database.run(
        "UPDATE transactions SET deleted_at = NULL, updated_at = ? WHERE id = ?",
        [restoredAt, validId],
      );
      client.persist();
      return transactionSchema.parse({
        ...deleted,
        deletedAt: undefined,
        updatedAt: restoredAt,
      });
    },
    setInitialBalance: (input) => {
      const valid = initialBalanceInputSchema.parse(input);
      client.database.run(
        `INSERT INTO initial_balance (singleton, amount_cents, date, updated_at) VALUES (1, ?, ?, ?)
         ON CONFLICT(singleton) DO UPDATE SET amount_cents = excluded.amount_cents,
           date = excluded.date, updated_at = excluded.updated_at`,
        [valid.amountCents, valid.date, new Date().toISOString()],
      );
      client.persist();
    },
    getSummary: () => {
      const initialRow = rows(
        client,
        "SELECT amount_cents, date FROM initial_balance WHERE singleton = 1",
      )[0];
      const initialBalance = initialRow
        ? initialBalanceInputSchema.parse({ amountCents: initialRow[0], date: initialRow[1] })
        : null;
      const transactions = rows(
        client,
        `SELECT t.amount_cents, c.type, t.is_confirmed, t.date
         FROM transactions t JOIN financial_categories c ON c.id = t.category_id
         WHERE t.deleted_at IS NULL`,
      ).map(([amountCents, type, confirmed, date]) => ({
        amountCents: Number(amountCents),
        type: type === "income" ? ("income" as const) : ("expense" as const),
        isConfirmed: Boolean(confirmed),
        date: String(date),
      }));
      const balances = calculateBalances(initialBalance?.amountCents ?? 0, transactions);
      const month = new Date().toISOString().slice(0, 7);
      const invoicePayments = rows(
        client,
        "SELECT amount_cents, payment_date FROM invoice_payments",
      ).map(([amountCents, paymentDate]) => ({
        amountCents: Number(amountCents),
        paymentDate: String(paymentDate),
      }));
      const paidInvoicesCents = invoicePayments.reduce(
        (total, payment) => total + payment.amountCents,
        0,
      );
      balances.availableCents -= paidInvoicesCents;
      balances.projectedCents -= paidInvoicesCents;
      const confirmedThisMonth = transactions.filter(
        ({ date, isConfirmed }) => isConfirmed && date.startsWith(month),
      );
      return {
        initialBalance,
        ...balances,
        receivedThisMonthCents: confirmedThisMonth
          .filter(({ type }) => type === "income")
          .reduce((sum, { amountCents }) => sum + amountCents, 0),
        paidThisMonthCents:
          confirmedThisMonth
            .filter(({ type }) => type === "expense")
            .reduce((sum, { amountCents }) => sum + amountCents, 0) +
          invoicePayments
            .filter(({ paymentDate }) => paymentDate.startsWith(month))
            .reduce((sum, { amountCents }) => sum + amountCents, 0),
      } as FinanceSummary;
    },
  };
}
