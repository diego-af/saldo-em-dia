import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createDatabaseClient, type DatabaseClient } from "../database/database-client";
import { createPreferencesRepository } from "../database/preferences-repository";
import { createPreferencesIpcHandlers } from "./preferences-ipc";

let client: DatabaseClient | undefined;

afterEach(() => client?.close());

describe("preferences IPC contract", () => {
  it("validates input before changing persisted preferences", async () => {
    const directory = mkdtempSync(join(tmpdir(), "saldo-em-dia-ipc-"));
    client = await createDatabaseClient(join(directory, "app.sqlite"));
    const repository = createPreferencesRepository(client);
    const handlers = createPreferencesIpcHandlers(repository);

    await expect(handlers.setTheme({ theme: "neon" })).rejects.toThrow();
    await expect(handlers.setTheme({ theme: "dark" })).resolves.toEqual({ theme: "dark" });
    await expect(handlers.getTheme()).resolves.toEqual({ theme: "dark" });
  });
});
