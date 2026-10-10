import { describe, expect, it } from "vitest";
import { civilDateSchema } from "./civil-date";

describe("CivilDate", () => {
  it("accepts a real calendar date without timezone conversion", () => {
    expect(civilDateSchema.parse("2027-06-30")).toBe("2027-06-30");
  });

  it("rejects impossible dates and timestamps", () => {
    expect(civilDateSchema.safeParse("2027-02-29").success).toBe(false);
    expect(civilDateSchema.safeParse("2027-06-30T00:00:00Z").success).toBe(false);
  });
});
