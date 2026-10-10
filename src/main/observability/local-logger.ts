import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
} from "node:fs";
import { join } from "node:path";

const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;
const RETENTION_MILLISECONDS = 3 * 24 * 60 * 60 * 1000;

interface LoggerOptions {
  directory: string;
  appVersion: string;
  maxBytes?: number;
  now?: () => Date;
}

interface TechnicalEvent {
  module: string;
  action: string;
  code: string;
}

interface UnexpectedEvent extends TechnicalEvent {
  error: unknown;
}

export interface LocalLogger {
  info(event: TechnicalEvent): void;
  unexpected(event: UnexpectedEvent): void;
}

export function createLocalLogger(options: LoggerOptions): LocalLogger {
  const now = options.now ?? (() => new Date());
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  mkdirSync(options.directory, { recursive: true });

  const cleanExpiredFiles = () => {
    const cutoff = now().getTime() - RETENTION_MILLISECONDS;
    for (const file of readdirSync(options.directory)) {
      if (!file.startsWith("saldo-em-dia-") || !file.includes(".log")) continue;
      const path = join(options.directory, file);
      if (statSync(path).mtimeMs < cutoff) rmSync(path);
    }
  };

  const write = (level: "info" | "error", event: TechnicalEvent) => {
    cleanExpiredFiles();
    const timestamp = now().toISOString();
    const date = timestamp.slice(0, 10);
    const path = join(options.directory, `saldo-em-dia-${date}.log`);
    const line = `${JSON.stringify({
      timestamp,
      level,
      module: event.module,
      action: event.action,
      code: event.code,
      appVersion: options.appVersion,
    })}\n`;

    if (existsSync(path) && statSync(path).size + Buffer.byteLength(line) > maxBytes) {
      const rotatedPath = `${path}.1`;
      if (existsSync(rotatedPath)) rmSync(rotatedPath);
      renameSync(path, rotatedPath);
    }
    appendFileSync(path, line, { encoding: "utf8", mode: 0o600 });
  };

  return {
    info: (event) => write("info", event),
    unexpected: ({ error: _error, ...event }) => write("error", event),
  };
}
