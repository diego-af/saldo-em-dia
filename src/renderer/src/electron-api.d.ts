import type { DebtApi } from "../../shared/contracts/debt";
import type { FinanceApi } from "../../shared/contracts/finance";
import type { PreferencesApi } from "../../shared/contracts/preferences";
import type { RecurrenceApi } from "../../shared/contracts/recurrence";
import type { ReminderApi } from "../../shared/contracts/reminder";

declare global {
  interface Window {
    saldoEmDia: {
      preferences: PreferencesApi;
      finance: FinanceApi;
      creditCards: CreditCardApi;
      debts: DebtApi;
      recurrences: RecurrenceApi;
      reminders: ReminderApi;
    };
  }
}

import type { CreditCardApi } from "../../shared/contracts/credit-card";
