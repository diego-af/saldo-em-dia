import { z } from "zod";

export const themePreferenceSchema = z.enum(["system", "light", "dark"]);
export type ThemePreference = z.infer<typeof themePreferenceSchema>;

export const setThemeInputSchema = z.object({ theme: themePreferenceSchema }).strict();
export const themePreferenceOutputSchema = z.object({ theme: themePreferenceSchema }).strict();

export const preferencesIpcChannels = {
  getTheme: "preferences:get-theme",
  setTheme: "preferences:set-theme",
} as const;

export interface PreferencesApi {
  getTheme(): Promise<{ theme: ThemePreference }>;
  setTheme(input: unknown): Promise<{ theme: ThemePreference }>;
}
