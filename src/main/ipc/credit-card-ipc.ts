import type { IpcMain } from "electron";
import {
  cardInvoiceSchema,
  cardPurchaseSchema,
  cardSummarySchema,
  createCardPurchaseInputSchema,
  creditCardIdSchema,
  creditCardIpcChannels,
  creditCardSchema,
  payInvoiceInputSchema,
  saveCreditCardInputSchema,
} from "../../shared/contracts/credit-card";
import type { CreditCardRepository } from "../database/credit-card-repository";

export function createCreditCardIpcHandlers(repository: CreditCardRepository) {
  return {
    getCards: async () => creditCardSchema.array().parse(repository.getCards()),
    saveCard: async (input: unknown) =>
      creditCardSchema.parse(repository.saveCard(saveCreditCardInputSchema.parse(input))),
    createPurchase: async (input: unknown) =>
      cardPurchaseSchema.parse(
        repository.createPurchase(createCardPurchaseInputSchema.parse(input)),
      ),
    getPurchases: async (cardId: unknown) =>
      cardPurchaseSchema.array().parse(repository.getPurchases(creditCardIdSchema.parse(cardId))),
    getSummary: async (cardId: unknown) =>
      cardSummarySchema.parse(repository.getCardSummary(creditCardIdSchema.parse(cardId))),
    listInvoices: async (cardId: unknown) =>
      cardInvoiceSchema.array().parse(repository.listInvoices(creditCardIdSchema.parse(cardId))),
    payInvoice: async (input: unknown) => repository.payInvoice(payInvoiceInputSchema.parse(input)),
  };
}

export function registerCreditCardIpc(ipcMain: IpcMain, repository: CreditCardRepository): void {
  const handlers = createCreditCardIpcHandlers(repository);
  ipcMain.handle(creditCardIpcChannels.getCards, () => handlers.getCards());
  ipcMain.handle(creditCardIpcChannels.saveCard, (_event, input) => handlers.saveCard(input));
  ipcMain.handle(creditCardIpcChannels.createPurchase, (_event, input) =>
    handlers.createPurchase(input),
  );
  ipcMain.handle(creditCardIpcChannels.getPurchases, (_event, cardId) =>
    handlers.getPurchases(cardId),
  );
  ipcMain.handle(creditCardIpcChannels.getSummary, (_event, cardId) => handlers.getSummary(cardId));
  ipcMain.handle(creditCardIpcChannels.listInvoices, (_event, cardId) =>
    handlers.listInvoices(cardId),
  );
  ipcMain.handle(creditCardIpcChannels.payInvoice, (_event, input) => handlers.payInvoice(input));
}
