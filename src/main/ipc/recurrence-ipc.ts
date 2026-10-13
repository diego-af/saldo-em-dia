import type { IpcMain } from "electron";
import {
  confirmRecurrenceOccurrenceInputSchema,
  createRecurrenceInputSchema,
  recurrenceIdSchema,
  recurrenceIpcChannels,
  recurrenceOccurrenceSchema,
  recurrenceSchema,
  updateRecurrenceOccurrenceInputSchema,
} from "../../shared/contracts/recurrence";
import type { RecurrenceRepository } from "../database/recurrence-repository";

export function createRecurrenceIpcHandlers(repository: RecurrenceRepository) {
  return {
    create: async (input: unknown) =>
      recurrenceSchema.parse(repository.create(createRecurrenceInputSchema.parse(input))),
    list: async () => recurrenceSchema.array().parse(repository.list()),
    listOccurrences: async (recurrenceId: unknown) =>
      recurrenceOccurrenceSchema
        .array()
        .parse(repository.listOccurrences(recurrenceIdSchema.parse(recurrenceId))),
    updateOccurrence: async (input: unknown) =>
      repository.updateOccurrence(updateRecurrenceOccurrenceInputSchema.parse(input)),
    confirmOccurrence: async (input: unknown) =>
      repository.confirmOccurrence(confirmRecurrenceOccurrenceInputSchema.parse(input)),
  };
}

export function registerRecurrenceIpc(ipcMain: IpcMain, repository: RecurrenceRepository): void {
  const handlers = createRecurrenceIpcHandlers(repository);
  ipcMain.handle(recurrenceIpcChannels.create, (_event, input) => handlers.create(input));
  ipcMain.handle(recurrenceIpcChannels.list, () => handlers.list());
  ipcMain.handle(recurrenceIpcChannels.listOccurrences, (_event, id) =>
    handlers.listOccurrences(id),
  );
  ipcMain.handle(recurrenceIpcChannels.updateOccurrence, (_event, input) =>
    handlers.updateOccurrence(input),
  );
  ipcMain.handle(recurrenceIpcChannels.confirmOccurrence, (_event, input) =>
    handlers.confirmOccurrence(input),
  );
}
