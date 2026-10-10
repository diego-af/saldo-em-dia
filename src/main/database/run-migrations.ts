import { copyFileSync, existsSync } from "node:fs";
import type { Database } from "sql.js";
import { createPreferencesMigration } from "./migrations/0001-create-preferences";
import { createFinancialCoreMigration } from "./migrations/0002-create-financial-core";
import { addInitialBalanceMigration } from "./migrations/0003-add-initial-balance";
import { optionalTransactionInstitutionMigration } from "./migrations/0004-optional-transaction-institution";
import { addTransactionHistoryMigration } from "./migrations/0005-add-transaction-history";

const migrations = [
  createPreferencesMigration,
  createFinancialCoreMigration,
  addInitialBalanceMigration,
  optionalTransactionInstitutionMigration,
  addTransactionHistoryMigration,
];

export function runMigrations(database: Database, databasePath: string): void {
  database.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY NOT NULL,
    applied_at TEXT NOT NULL
  )`);

  const migrationRows = database.exec("SELECT version FROM schema_migrations ORDER BY version");
  const applied = new Set((migrationRows[0]?.values ?? []).map(([version]) => Number(version)));
  const pending = migrations.filter((migration) => !applied.has(migration.version));

  if (pending.length > 0 && existsSync(databasePath)) {
    copyFileSync(databasePath, `${databasePath}.before-migration`);
  }

  database.exec("BEGIN IMMEDIATE");
  try {
    for (const migration of pending) {
      for (const statement of migration.statements) database.exec(statement);
      database.run("INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)", [
        migration.version,
        new Date().toISOString(),
      ]);
    }
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}
