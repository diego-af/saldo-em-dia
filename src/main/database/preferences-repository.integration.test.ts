import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createDatabaseClient, type DatabaseClient } from "./database-client";
import { createPreferencesRepository, type PreferencesRepository } from "./preferences-repository";

const openClients: DatabaseClient[] = [];

afterEach(() => {
  for (const client of openClients.splice(0)) client.close();
});

describe("preferences SQLite repository", () => {
  it("persists the chosen theme after the database is closed and reopened", async () => {
    const directory = mkdtempSync(join(tmpdir(), "saldo-em-dia-db-"));
    const databasePath = join(directory, "app.sqlite");
    const firstClient = await createDatabaseClient(databasePath);
    openClients.push(firstClient);
    const firstSession: PreferencesRepository = createPreferencesRepository(firstClient);

    firstSession.setTheme("dark");
    firstClient.close();
    openClients.pop();

    const secondClient = await createDatabaseClient(databasePath);
    openClients.push(secondClient);
    const secondSession = createPreferencesRepository(secondClient);

    expect(secondSession.getTheme()).toBe("dark");
  });
});
