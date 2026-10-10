import { join } from "node:path";
import { app, BrowserWindow, ipcMain } from "electron";
import { createCreditCardRepository } from "./database/credit-card-repository";
import { createDatabaseClient } from "./database/database-client";
import { createFinanceRepository } from "./database/finance-repository";
import { createPreferencesRepository } from "./database/preferences-repository";
import { registerCreditCardIpc } from "./ipc/credit-card-ipc";
import { registerFinanceIpc } from "./ipc/finance-ipc";
import { registerPreferencesIpc } from "./ipc/preferences-ipc";
import { createLocalLogger } from "./observability/local-logger";

let mainWindow: BrowserWindow | undefined;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 820,
    minWidth: 780,
    minHeight: 600,
    backgroundColor: "#f6f2e9",
    show: false,
    title: "Saldo em Dia",
    webPreferences: {
      preload: join(__dirname, "../preload/index.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.once("ready-to-show", () => mainWindow?.show());
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));

  if (process.env.ELECTRON_RENDERER_URL) {
    void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

void app.whenReady().then(async () => {
  const logger = createLocalLogger({
    directory: join(app.getPath("userData"), "logs"),
    appVersion: app.getVersion(),
  });
  const dbClient = await createDatabaseClient(join(app.getPath("userData"), "saldo-em-dia.sqlite"));
  const preferences = createPreferencesRepository(dbClient);
  const finance = createFinanceRepository(dbClient);
  const creditCards = createCreditCardRepository(dbClient);
  registerPreferencesIpc(ipcMain, preferences);
  registerFinanceIpc(ipcMain, finance);
  registerCreditCardIpc(ipcMain, creditCards);

  process.on("uncaughtException", () => {
    logger.unexpected({
      module: "main",
      action: "uncaught-exception",
      code: "UNEXPECTED_ERROR",
      error: null,
    });
  });
  process.on("unhandledRejection", () => {
    logger.unexpected({
      module: "main",
      action: "unhandled-rejection",
      code: "UNHANDLED_REJECTION",
      error: null,
    });
  });

  app.on("before-quit", () => dbClient.close());
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
