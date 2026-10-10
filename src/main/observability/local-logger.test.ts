import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createLocalLogger } from "./local-logger";

describe("local diagnostic logger", () => {
  it("writes only approved technical fields and rotates at the configured limit", () => {
    const directory = mkdtempSync(join(tmpdir(), "saldo-em-dia-logs-"));
    const logger = createLocalLogger({
      directory,
      appVersion: "0.1.0",
      maxBytes: 220,
      now: () => new Date("2026-10-05T12:00:00.000Z"),
    });

    for (let index = 0; index < 5; index += 1) {
      logger.unexpected({
        module: "database",
        action: "open",
        code: "DB_OPEN_FAILED",
        error: new Error("Saldo secreto: R$ 9.999,00"),
      });
    }

    const files = readdirSync(directory);
    expect(files.some((file) => file.endsWith(".1"))).toBe(true);
    const contents = files.map((file) => readFileSync(join(directory, file), "utf8")).join("\n");
    expect(contents).toContain('"code":"DB_OPEN_FAILED"');
    expect(contents).not.toContain("9.999");
    expect(contents).not.toContain("Saldo secreto");
  });

  it("removes diagnostic files older than three days", () => {
    const directory = mkdtempSync(join(tmpdir(), "saldo-em-dia-retention-"));
    mkdirSync(directory, { recursive: true });
    const oldFile = join(directory, "saldo-em-dia-2026-10-01.log");
    writeFileSync(oldFile, "old");
    const oldDate = new Date("2026-10-01T09:00:00.000Z");
    utimesSync(oldFile, oldDate, oldDate);

    const logger = createLocalLogger({
      directory,
      appVersion: "0.1.0",
      now: () => new Date("2026-10-05T12:00:00.000Z"),
    });
    logger.info({ module: "app", action: "start", code: "APP_STARTED" });

    expect(readdirSync(directory)).not.toContain("saldo-em-dia-2026-10-01.log");
  });
});
