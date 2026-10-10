import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname } from "node:path";
import initSqlJs, { type Database } from "sql.js";
import { runMigrations } from "./run-migrations";

export interface DatabaseClient {
  database: Database;
  persist(): void;
  close(): void;
}

export async function createDatabaseClient(databasePath: string): Promise<DatabaseClient> {
  mkdirSync(dirname(databasePath), { recursive: true });
  const require = createRequire(import.meta.url);
  const sql = await initSqlJs({
    locateFile: () => require.resolve("sql.js/dist/sql-wasm.wasm"),
  });
  const database = new sql.Database(
    existsSync(databasePath) ? readFileSync(databasePath) : undefined,
  );
  runMigrations(database, databasePath);

  const persist = () => {
    writeFileSync(databasePath, database.export(), { mode: 0o600 });
  };
  persist();

  return {
    database,
    persist,
    close: () => {
      persist();
      database.close();
    },
  };
}
