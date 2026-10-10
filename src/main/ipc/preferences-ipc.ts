import type { IpcMain } from "electron";
import {
  preferencesIpcChannels,
  setThemeInputSchema,
  themePreferenceOutputSchema,
} from "../../shared/contracts/preferences";
import type { PreferencesRepository } from "../database/preferences-repository";

export function createPreferencesIpcHandlers(repository: PreferencesRepository) {
  return {
    getTheme: async () => themePreferenceOutputSchema.parse({ theme: repository.getTheme() }),
    setTheme: async (input: unknown) => {
      const { theme } = setThemeInputSchema.parse(input);
      repository.setTheme(theme);
      return themePreferenceOutputSchema.parse({ theme });
    },
  };
}

export function registerPreferencesIpc(ipcMain: IpcMain, repository: PreferencesRepository): void {
  const handlers = createPreferencesIpcHandlers(repository);
  ipcMain.handle(preferencesIpcChannels.getTheme, () => handlers.getTheme());
  ipcMain.handle(preferencesIpcChannels.setTheme, (_event, input: unknown) =>
    handlers.setTheme(input),
  );
}
