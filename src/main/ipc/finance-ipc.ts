import type { IpcMain } from "electron";
import {
  financeIpcChannels,
  financeSummarySchema,
  financialCategorySchema,
  financialInstitutionSchema,
  initialBalanceInputSchema,
  saveCategoryInputSchema,
  saveInstitutionInputSchema,
  saveTransactionInputSchema,
  transactionIdSchema,
  transactionRevisionSchema,
  transactionSchema,
  updateTransactionInputSchema,
} from "../../shared/contracts/finance";
import type { FinanceRepository } from "../database/finance-repository";

export function createFinanceIpcHandlers(repository: FinanceRepository) {
  return {
    getSummary: async () => financeSummarySchema.parse(repository.getSummary()),
    getCategories: async () => financialCategorySchema.array().parse(repository.getCategories()),
    saveCategory: async (input: unknown) =>
      financialCategorySchema.parse(repository.saveCategory(saveCategoryInputSchema.parse(input))),
    getInstitutions: async () =>
      financialInstitutionSchema.array().parse(repository.getInstitutions()),
    saveInstitution: async (input: unknown) =>
      financialInstitutionSchema.parse(
        repository.saveInstitution(saveInstitutionInputSchema.parse(input)),
      ),
    getTransactions: async () => transactionSchema.array().parse(repository.getTransactions()),
    getDeletedTransactions: async () =>
      transactionSchema.array().parse(repository.getDeletedTransactions()),
    saveTransaction: async (input: unknown) =>
      transactionSchema.parse(repository.saveTransaction(saveTransactionInputSchema.parse(input))),
    updateTransaction: async (input: unknown) =>
      transactionSchema.parse(
        repository.updateTransaction(updateTransactionInputSchema.parse(input)),
      ),
    getTransactionRevisions: async (transactionId: unknown) =>
      transactionRevisionSchema
        .array()
        .parse(repository.getTransactionRevisions(transactionIdSchema.parse(transactionId))),
    deleteTransaction: async (transactionId: unknown) =>
      repository.deleteTransaction(transactionIdSchema.parse(transactionId)),
    restoreTransaction: async (transactionId: unknown) =>
      transactionSchema.parse(
        repository.restoreTransaction(transactionIdSchema.parse(transactionId)),
      ),
    setInitialBalance: async (input: unknown) => {
      repository.setInitialBalance(initialBalanceInputSchema.parse(input));
      return financeSummarySchema.parse(repository.getSummary());
    },
  };
}

export function registerFinanceIpc(ipcMain: IpcMain, repository: FinanceRepository): void {
  const handlers = createFinanceIpcHandlers(repository);
  ipcMain.handle(financeIpcChannels.getSummary, () => handlers.getSummary());
  ipcMain.handle(financeIpcChannels.getCategories, () => handlers.getCategories());
  ipcMain.handle(financeIpcChannels.saveCategory, (_event, input) => handlers.saveCategory(input));
  ipcMain.handle(financeIpcChannels.getInstitutions, () => handlers.getInstitutions());
  ipcMain.handle(financeIpcChannels.saveInstitution, (_event, input) =>
    handlers.saveInstitution(input),
  );
  ipcMain.handle(financeIpcChannels.getTransactions, () => handlers.getTransactions());
  ipcMain.handle(financeIpcChannels.getDeletedTransactions, () =>
    handlers.getDeletedTransactions(),
  );
  ipcMain.handle(financeIpcChannels.saveTransaction, (_event, input) =>
    handlers.saveTransaction(input),
  );
  ipcMain.handle(financeIpcChannels.updateTransaction, (_event, input) =>
    handlers.updateTransaction(input),
  );
  ipcMain.handle(financeIpcChannels.getTransactionRevisions, (_event, transactionId) =>
    handlers.getTransactionRevisions(transactionId),
  );
  ipcMain.handle(financeIpcChannels.deleteTransaction, (_event, transactionId) =>
    handlers.deleteTransaction(transactionId),
  );
  ipcMain.handle(financeIpcChannels.restoreTransaction, (_event, transactionId) =>
    handlers.restoreTransaction(transactionId),
  );
  ipcMain.handle(financeIpcChannels.setInitialBalance, (_event, input) =>
    handlers.setInitialBalance(input),
  );
}
