import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createDatabaseClient, type DatabaseClient } from "../database/database-client";
import { createFinanceRepository } from "../database/finance-repository";
import { createFinanceIpcHandlers } from "./finance-ipc";

let client: DatabaseClient | undefined;

afterEach(() => client?.close());

describe("finance IPC contract", () => {
  it("rejects invalid money before changing persisted finances", async () => {
    client = await createDatabaseClient(
      join(mkdtempSync(join(tmpdir(), "saldo-em-dia-finance-ipc-")), "app.sqlite"),
    );
    const handlers = createFinanceIpcHandlers(createFinanceRepository(client));

    await expect(
      handlers.setInitialBalance({ amountCents: 10.5, date: "2026-10-09" }),
    ).rejects.toThrow();
    await expect(handlers.getSummary()).resolves.toMatchObject({
      initialBalance: null,
      availableCents: 0,
    });
  });
});
