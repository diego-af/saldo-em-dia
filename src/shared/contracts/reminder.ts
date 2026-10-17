import { z } from "zod";

export const reminderKeySchema = z
  .string()
  .regex(
    /^(invoice:[0-9a-f-]{36}:\d{4}-\d{2}|debt-installment:[0-9a-f-]{36}|recurrence-occurrence:[0-9a-f-]{36})$/,
  );
export type ReminderKey = z.infer<typeof reminderKeySchema>;

export const reminderIpcChannels = {
  listSilenced: "reminder:list-silenced",
  silence: "reminder:silence",
} as const;

export interface ReminderApi {
  listSilenced(): Promise<ReminderKey[]>;
  silence(key: ReminderKey): Promise<void>;
}
