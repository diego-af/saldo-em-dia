import { contextBridge, ipcRenderer } from "electron";
import {
  type CreditCardApi,
  cardInvoiceSchema,
  cardPurchaseSchema,
  cardSummarySchema,
  creditCardIpcChannels,
  creditCardSchema,
} from "../shared/contracts/credit-card";
import {
  type DebtApi,
  debtInstallmentSchema,
  debtIpcChannels,
  debtSchema,
} from "../shared/contracts/debt";
import {
  type FinanceApi,
  financeIpcChannels,
  financeSummarySchema,
  financialCategorySchema,
  financialInstitutionSchema,
  transactionRevisionSchema,
  transactionSchema,
} from "../shared/contracts/finance";
import {
  type PreferencesApi,
  preferencesIpcChannels,
  themePreferenceOutputSchema,
} from "../shared/contracts/preferences";
import {
  type RecurrenceApi,
  recurrenceIpcChannels,
  recurrenceOccurrenceSchema,
  recurrenceSchema,
} from "../shared/contracts/recurrence";
import {
  type ReminderApi,
  reminderIpcChannels,
  reminderKeySchema,
} from "../shared/contracts/reminder";

const preferences: PreferencesApi = {
  getTheme: async () =>
    themePreferenceOutputSchema.parse(await ipcRenderer.invoke(preferencesIpcChannels.getTheme)),
  setTheme: async (input) =>
    themePreferenceOutputSchema.parse(
      await ipcRenderer.invoke(preferencesIpcChannels.setTheme, input),
    ),
};

const finance: FinanceApi = {
  getSummary: async () =>
    financeSummarySchema.parse(await ipcRenderer.invoke(financeIpcChannels.getSummary)),
  getCategories: async () =>
    financialCategorySchema
      .array()
      .parse(await ipcRenderer.invoke(financeIpcChannels.getCategories)),
  saveCategory: async (input) =>
    financialCategorySchema.parse(await ipcRenderer.invoke(financeIpcChannels.saveCategory, input)),
  getInstitutions: async () =>
    financialInstitutionSchema
      .array()
      .parse(await ipcRenderer.invoke(financeIpcChannels.getInstitutions)),
  saveInstitution: async (input) =>
    financialInstitutionSchema.parse(
      await ipcRenderer.invoke(financeIpcChannels.saveInstitution, input),
    ),
  getTransactions: async () =>
    transactionSchema.array().parse(await ipcRenderer.invoke(financeIpcChannels.getTransactions)),
  getDeletedTransactions: async () =>
    transactionSchema
      .array()
      .parse(await ipcRenderer.invoke(financeIpcChannels.getDeletedTransactions)),
  saveTransaction: async (input) =>
    transactionSchema.parse(await ipcRenderer.invoke(financeIpcChannels.saveTransaction, input)),
  updateTransaction: async (input) =>
    transactionSchema.parse(await ipcRenderer.invoke(financeIpcChannels.updateTransaction, input)),
  getTransactionRevisions: async (transactionId) =>
    transactionRevisionSchema
      .array()
      .parse(await ipcRenderer.invoke(financeIpcChannels.getTransactionRevisions, transactionId)),
  deleteTransaction: async (transactionId) =>
    ipcRenderer.invoke(financeIpcChannels.deleteTransaction, transactionId),
  restoreTransaction: async (transactionId) =>
    transactionSchema.parse(
      await ipcRenderer.invoke(financeIpcChannels.restoreTransaction, transactionId),
    ),
  setInitialBalance: async (input) =>
    financeSummarySchema.parse(
      await ipcRenderer.invoke(financeIpcChannels.setInitialBalance, input),
    ),
};

const creditCards: CreditCardApi = {
  getCards: async () =>
    creditCardSchema.array().parse(await ipcRenderer.invoke(creditCardIpcChannels.getCards)),
  saveCard: async (input) =>
    creditCardSchema.parse(await ipcRenderer.invoke(creditCardIpcChannels.saveCard, input)),
  createPurchase: async (input) =>
    cardPurchaseSchema.parse(await ipcRenderer.invoke(creditCardIpcChannels.createPurchase, input)),
  getPurchases: async (cardId) =>
    cardPurchaseSchema
      .array()
      .parse(await ipcRenderer.invoke(creditCardIpcChannels.getPurchases, cardId)),
  getSummary: async (cardId) =>
    cardSummarySchema.parse(await ipcRenderer.invoke(creditCardIpcChannels.getSummary, cardId)),
  listInvoices: async (cardId) =>
    cardInvoiceSchema
      .array()
      .parse(await ipcRenderer.invoke(creditCardIpcChannels.listInvoices, cardId)),
  payInvoice: async (input) => ipcRenderer.invoke(creditCardIpcChannels.payInvoice, input),
};

const debts: DebtApi = {
  create: async (input) =>
    debtSchema.parse(await ipcRenderer.invoke(debtIpcChannels.create, input)),
  list: async () => debtSchema.array().parse(await ipcRenderer.invoke(debtIpcChannels.list)),
  listInstallments: async (debtId) =>
    debtInstallmentSchema
      .array()
      .parse(await ipcRenderer.invoke(debtIpcChannels.listInstallments, debtId)),
  payInstallment: async (input) => ipcRenderer.invoke(debtIpcChannels.payInstallment, input),
};

const recurrences: RecurrenceApi = {
  create: async (input) =>
    recurrenceSchema.parse(await ipcRenderer.invoke(recurrenceIpcChannels.create, input)),
  list: async () =>
    recurrenceSchema.array().parse(await ipcRenderer.invoke(recurrenceIpcChannels.list)),
  listOccurrences: async (recurrenceId) =>
    recurrenceOccurrenceSchema
      .array()
      .parse(await ipcRenderer.invoke(recurrenceIpcChannels.listOccurrences, recurrenceId)),
  updateOccurrence: async (input) =>
    ipcRenderer.invoke(recurrenceIpcChannels.updateOccurrence, input),
  confirmOccurrence: async (input) =>
    ipcRenderer.invoke(recurrenceIpcChannels.confirmOccurrence, input),
};

const reminders: ReminderApi = {
  listSilenced: async () =>
    reminderKeySchema.array().parse(await ipcRenderer.invoke(reminderIpcChannels.listSilenced)),
  silence: async (key) => ipcRenderer.invoke(reminderIpcChannels.silence, key),
};

contextBridge.exposeInMainWorld("saldoEmDia", {
  preferences,
  finance,
  creditCards,
  debts,
  recurrences,
  reminders,
});
