import type { IpcMain } from "electron";
import { reminderIpcChannels, reminderKeySchema } from "../../shared/contracts/reminder";
import type { ReminderRepository } from "../database/reminder-repository";

export function createReminderIpcHandlers(repository: ReminderRepository) {
  return {
    listSilenced: async () => reminderKeySchema.array().parse(repository.listSilenced()),
    silence: async (key: unknown) => repository.silence(reminderKeySchema.parse(key)),
  };
}

export function registerReminderIpc(ipcMain: IpcMain, repository: ReminderRepository): void {
  const handlers = createReminderIpcHandlers(repository);
  ipcMain.handle(reminderIpcChannels.listSilenced, () => handlers.listSilenced());
  ipcMain.handle(reminderIpcChannels.silence, (_event, key) => handlers.silence(key));
}
