import { randomUUID } from "node:crypto";
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
  transactionSchema,
} from "../../shared/contracts/finance";
import type { DatabaseClient } from "./database-client";

export interface FinanceRepository {
  getSummary(): FinanceSummary;
  getCategories(): FinancialCategory[];
  saveCategory(input: SaveCategoryInput): FinancialCategory;
  getInstitutions(): FinancialInstitution[];
  saveInstitution(input: SaveInstitutionInput): FinancialInstitution;
  getTransactions(): Transaction[];
  saveTransaction(input: SaveTransactionInput): Transaction;
  setInitialBalance(input: InitialBalanceInput): void;
}

function rows(client: DatabaseClient, sql: string): unknown[][] {
  return client.database.exec(sql)[0]?.values ?? [];
}

export function createFinanceRepository(client: DatabaseClient): FinanceRepository {
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

  const getTransactions = () =>
    rows(
      client,
      `SELECT id, description, amount_cents, category_id, institution_id, date,
        is_confirmed, notes, created_at FROM transactions ORDER BY date DESC, created_at DESC`,
    ).map(
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
        }),
    );

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
    saveTransaction: (input) => {
      const valid = saveTransactionInputSchema.parse(input);
      const category = getCategories().find(({ id }) => id === valid.categoryId);
      if (!category?.active) throw new Error("Categoria inválida ou desativada");
      if (valid.institutionId) {
        const institution = getInstitutions().find(({ id }) => id === valid.institutionId);
        if (!institution?.active) throw new Error("Instituição inválida ou desativada");
      }
      const transaction = transactionSchema.parse({
        ...valid,
        id: randomUUID(),
        createdAt: new Date().toISOString(),
      });
      client.database.run(
        `INSERT INTO transactions
          (id, description, amount_cents, category_id, institution_id, date, is_confirmed, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        ],
      );
      client.persist();
      return transaction;
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
         FROM transactions t JOIN financial_categories c ON c.id = t.category_id`,
      ).map(([amountCents, type, confirmed, date]) => ({
        amountCents: Number(amountCents),
        type: type === "income" ? ("income" as const) : ("expense" as const),
        isConfirmed: Boolean(confirmed),
        date: String(date),
      }));
      const balances = calculateBalances(initialBalance?.amountCents ?? 0, transactions);
      const month = new Date().toISOString().slice(0, 7);
      const confirmedThisMonth = transactions.filter(
        ({ date, isConfirmed }) => isConfirmed && date.startsWith(month),
      );
      return {
        initialBalance,
        ...balances,
        receivedThisMonthCents: confirmedThisMonth
          .filter(({ type }) => type === "income")
          .reduce((sum, { amountCents }) => sum + amountCents, 0),
        paidThisMonthCents: confirmedThisMonth
          .filter(({ type }) => type === "expense")
          .reduce((sum, { amountCents }) => sum + amountCents, 0),
      } as FinanceSummary;
    },
  };
}
