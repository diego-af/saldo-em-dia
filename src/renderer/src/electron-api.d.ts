import type { FinanceApi } from "../../shared/contracts/finance";
import type { PreferencesApi } from "../../shared/contracts/preferences";

declare global {
  interface Window {
    saldoEmDia: {
      preferences: PreferencesApi;
      finance: FinanceApi;
      creditCards: CreditCardApi;
    };
  }
}

import type { CreditCardApi } from "../../shared/contracts/credit-card";
