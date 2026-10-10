import type { FinanceApi } from "../../shared/contracts/finance";
import type { PreferencesApi } from "../../shared/contracts/preferences";

declare global {
  interface Window {
    saldoEmDia: {
      preferences: PreferencesApi;
      finance: FinanceApi;
    };
  }
}
