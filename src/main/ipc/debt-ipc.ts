import type { IpcMain } from "electron";
import {
  createDebtInputSchema,
  debtIdSchema,
  debtInstallmentSchema,
  debtIpcChannels,
  debtSchema,
  payDebtInstallmentInputSchema,
} from "../../shared/contracts/debt";
import type { DebtRepository } from "../database/debt-repository";

export function createDebtIpcHandlers(repository: DebtRepository) {
  return {
    create: async (input: unknown) =>
      debtSchema.parse(repository.create(createDebtInputSchema.parse(input))),
    list: async () => debtSchema.array().parse(repository.list()),
    listInstallments: async (debtId: unknown) =>
      debtInstallmentSchema.array().parse(repository.listInstallments(debtIdSchema.parse(debtId))),
    payInstallment: async (input: unknown) =>
      repository.payInstallment(payDebtInstallmentInputSchema.parse(input)),
  };
}

export function registerDebtIpc(ipcMain: IpcMain, repository: DebtRepository): void {
  const handlers = createDebtIpcHandlers(repository);
  ipcMain.handle(debtIpcChannels.create, (_event, input) => handlers.create(input));
  ipcMain.handle(debtIpcChannels.list, () => handlers.list());
  ipcMain.handle(debtIpcChannels.listInstallments, (_event, debtId) =>
    handlers.listInstallments(debtId),
  );
  ipcMain.handle(debtIpcChannels.payInstallment, (_event, input) => handlers.payInstallment(input));
}
