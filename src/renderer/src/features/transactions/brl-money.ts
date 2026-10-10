const brlFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatBrl(cents: number): string {
  return brlFormatter.format(cents / 100);
}

export function parseBrl(value: string): number | null {
  const normalized = value.trim().replace(/^R\$\s?/, "");
  if (!/^(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{1,2})?$/.test(normalized)) return null;
  const [whole, decimals = ""] = normalized.replaceAll(".", "").split(",");
  const cents = Number(whole) * 100 + Number(decimals.padEnd(2, "0"));
  return Number.isSafeInteger(cents) ? cents : null;
}
