import { describe, expect, it } from "vitest";
import { formatBrl, parseBrl } from "./brl-money";

describe("Brazilian money input", () => {
  it("converts Brazilian text to integer cents", () => {
    expect(parseBrl("1.234,56")).toBe(123_456);
    expect(parseBrl("0,05")).toBe(5);
  });

  it("formats cents in Brazilian reais", () => {
    expect(formatBrl(123_456)).toBe("R$ 1.234,56");
  });

  it("rejects malformed and negative values", () => {
    expect(parseBrl("12,345")).toBeNull();
    expect(parseBrl("-1,00")).toBeNull();
  });
});
