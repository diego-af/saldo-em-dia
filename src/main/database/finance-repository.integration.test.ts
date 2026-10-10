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
});
