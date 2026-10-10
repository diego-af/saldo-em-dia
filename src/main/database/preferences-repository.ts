import { type ThemePreference, themePreferenceSchema } from "../../shared/contracts/preferences";
import type { DatabaseClient } from "./database-client";

export interface PreferencesRepository {
  getTheme(): ThemePreference;
  setTheme(theme: ThemePreference): void;
}

export function createPreferencesRepository(client: DatabaseClient): PreferencesRepository {
  return {
    getTheme: () => {
      const rows = client.database.exec("SELECT value FROM app_preferences WHERE key = 'theme'");
      return rows[0]?.values[0]?.[0] ? themePreferenceSchema.parse(rows[0].values[0][0]) : "system";
    },
    setTheme: (theme) => {
      const validTheme = themePreferenceSchema.parse(theme);
      client.database.run(
        `INSERT INTO app_preferences (key, value, updated_at)
           VALUES ('theme', ?, ?)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
        [validTheme, new Date().toISOString()],
      );
      client.persist();
    },
  };
}
