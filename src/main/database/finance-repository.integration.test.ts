import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createDatabaseClient, type DatabaseClient } from "./database-client";
import { createFinanceRepository } from "./finance-repository";

let client: DatabaseClient | undefined;

afterEach(() => client?.close());

describe("finance SQLite repository", () => {
  it("persists the initial balance, catalogs and transactions", async () => {
    const databasePath = join(mkdtempSync(join(tmpdir(), "saldo-em-dia-finance-")), "app.sqlite");
    client = await createDatabaseClient(databasePath);
    const repository = createFinanceRepository(client);

    repository.setInitialBalance({ amountCents: 100_00, date: "2026-10-01" });
    const category = repository.saveCategory({ name: "Mercado", type: "expense" });
    const institution = repository.saveInstitution({ name: "Banco local" });
    repository.saveTransaction({
      amountCents: 25_50,
      categoryId: category.id,
      institutionId: institution.id,
      date: "2026-10-09",
      isConfirmed: true,
    });
    client.close();

    client = await createDatabaseClient(databasePath);
    const reopened = createFinanceRepository(client);

    expect(reopened.getSummary()).toMatchObject({
      initialBalance: { amountCents: 100_00, date: "2026-10-01" },
      availableCents: 74_50,
      projectedCents: 74_50,
    });
    expect(reopened.getCategories()).toHaveLength(1);
    expect(reopened.getInstitutions()).toHaveLength(1);
    expect(reopened.getTransactions()).toHaveLength(1);
  });

  it("renames and deactivates catalogs without changing transaction history", async () => {
    client = await createDatabaseClient(
      join(mkdtempSync(join(tmpdir(), "saldo-em-dia-history-")), "app.sqlite"),
    );
    const repository = createFinanceRepository(client);
    const category = repository.saveCategory({ name: "Casa", type: "expense" });
    const institution = repository.saveInstitution({ name: "Dinheiro" });
    repository.saveTransaction({
      amountCents: 10_00,
      categoryId: category.id,
      institutionId: institution.id,
      date: "2026-10-09",
      isConfirmed: false,
    });

    repository.saveCategory({
      id: category.id,
      name: "Moradia",
      type: "income",
      active: false,
    });
    repository.saveInstitution({ id: institution.id, name: "Carteira", active: false });

    expect(repository.getTransactions()[0]).toMatchObject({
      categoryId: category.id,
      institutionId: institution.id,
    });
    expect(repository.getCategories()[0]).toMatchObject({
      name: "Moradia",
      type: "expense",
      active: false,
    });
    expect(repository.getInstitutions()[0]).toMatchObject({ name: "Carteira", active: false });
  });

  it("recalculates balances and records before and after a transaction correction", async () => {
    client = await createDatabaseClient(
      join(mkdtempSync(join(tmpdir(), "saldo-em-dia-correction-")), "app.sqlite"),
    );
    const repository = createFinanceRepository(client);
    repository.setInitialBalance({ amountCents: 100_00, date: "2026-10-01" });
    const category = repository.saveCategory({ name: "Mercado", type: "expense" });
    const transaction = repository.saveTransaction({
      description: "Compra",
      amountCents: 20_00,
      categoryId: category.id,
      date: "2026-10-09",
      isConfirmed: true,
    });

    repository.updateTransaction({
      id: transaction.id,
      description: "Compra corrigida",
      amountCents: 35_00,
      categoryId: category.id,
      date: "2026-10-09",
      isConfirmed: true,
    });

    expect(repository.getSummary().availableCents).toBe(65_00);
    expect(repository.getTransactionRevisions(transaction.id)).toMatchObject([
      {
        transactionId: transaction.id,
        before: { description: "Compra", amountCents: 20_00 },
        after: { description: "Compra corrigida", amountCents: 35_00 },
      },
    ]);
  });

  it("moves transactions to trash, restores them for 10 days and purges expired items", async () => {
    let now = new Date("2026-10-10T12:00:00.000Z");
    client = await createDatabaseClient(
      join(mkdtempSync(join(tmpdir(), "saldo-em-dia-trash-")), "app.sqlite"),
    );
    const repository = createFinanceRepository(client, () => now);
    repository.setInitialBalance({ amountCents: 100_00, date: "2026-10-01" });
    const category = repository.saveCategory({ name: "Mercado", type: "expense" });
    const transaction = repository.saveTransaction({
      amountCents: 25_00,
      categoryId: category.id,
      date: "2026-10-09",
      isConfirmed: true,
    });

    repository.deleteTransaction(transaction.id);
    expect(repository.getTransactions()).toHaveLength(0);
    expect(repository.getDeletedTransactions()).toHaveLength(1);
    expect(repository.getSummary().availableCents).toBe(100_00);

    now = new Date("2026-10-20T11:59:59.000Z");
    repository.restoreTransaction(transaction.id);
    expect(repository.getTransactions()).toHaveLength(1);
    expect(repository.getSummary().availableCents).toBe(75_00);

    repository.deleteTransaction(transaction.id);
    now = new Date("2026-10-30T12:00:01.000Z");
    expect(repository.getDeletedTransactions()).toHaveLength(0);
    expect(client.database.exec("SELECT id FROM transactions")[0]?.values ?? []).toHaveLength(0);
  });
});
