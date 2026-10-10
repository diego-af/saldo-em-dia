import { contextBridge, ipcRenderer } from "electron";
import {
  type FinanceApi,
  financeIpcChannels,
  financeSummarySchema,
  financialCategorySchema,
  financialInstitutionSchema,
  transactionSchema,
} from "../shared/contracts/finance";
import {
  type PreferencesApi,
  preferencesIpcChannels,
  themePreferenceOutputSchema,
} from "../shared/contracts/preferences";

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
  saveTransaction: async (input) =>
    transactionSchema.parse(await ipcRenderer.invoke(financeIpcChannels.saveTransaction, input)),
  setInitialBalance: async (input) =>
    financeSummarySchema.parse(
      await ipcRenderer.invoke(financeIpcChannels.setInitialBalance, input),
    ),
};

contextBridge.exposeInMainWorld("saldoEmDia", { preferences, finance });
