import { useEffect, useState } from "react";
import type { ThemePreference } from "../../../shared/contracts/preferences";
import { AppShell } from "./app-shell";

export function App() {
  const [theme, setTheme] = useState<ThemePreference>("system");

  useEffect(() => {
    void window.saldoEmDia.preferences.getTheme().then(({ theme: persistedTheme }) => {
      setTheme(persistedTheme);
    });
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return <AppShell />;
}
