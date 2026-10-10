import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AppShell } from "./app-shell";

describe("application shell", () => {
  it("keeps primary navigation and the new transaction action visible", () => {
    const html = renderToStaticMarkup(<AppShell />);

    expect(html).toContain("Visão geral");
    expect(html).toContain("Lançamentos");
    expect(html).toContain("Planejamento");
    expect(html).toContain("Novo lançamento");
  });
});
