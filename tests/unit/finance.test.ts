import { describe, expect, it } from "vitest";
import { bpsToPercent, calcDiscount, calcLineAmount, calcTax, calcTotals, percentToBps, quantityToHundredths } from "@/lib/finance/calculations";
import { minorDigits, minorToInput, parseToMinor } from "@/lib/finance/money";

describe("money parsing (no floating point)", () => {
  it("parses decimal strings exactly", () => {
    expect(parseToMinor("1234.56")).toBe(123456n);
    expect(parseToMinor("1,234.5")).toBe(123450n);
    expect(parseToMinor("0.1")).toBe(10n);
    expect(parseToMinor("0.29")).toBe(29n); // 0.29 * 100 = 28.999999999999996 in floats
    expect(parseToMinor("19.995")).toBe(2000n); // rounds half up at currency precision
    expect(parseToMinor("-5.5")).toBe(-550n);
  });
  it("respects currency precision", () => {
    expect(minorDigits("JPY")).toBe(0);
    expect(parseToMinor("1500", "JPY")).toBe(1500n);
    expect(minorDigits("KWD")).toBe(3);
    expect(parseToMinor("1.2345", "KWD")).toBe(1235n);
  });
  it("rejects invalid input", () => {
    expect(() => parseToMinor("abc")).toThrow();
    expect(() => parseToMinor("1.2.3")).toThrow();
    expect(() => parseToMinor("")).toThrow();
  });
  it("round-trips minor units to input strings", () => {
    expect(minorToInput(123456)).toBe("1234.56");
    expect(minorToInput(5)).toBe("0.05");
    expect(minorToInput(1500, "JPY")).toBe("1500");
    expect(minorToInput(null)).toBe("");
  });
});

describe("document calculations (mirror of PostgreSQL functions)", () => {
  it("computes line amounts with half-up rounding", () => {
    expect(calcLineAmount("1", 750000)).toBe(750000);
    expect(calcLineAmount("12", 5000)).toBe(60000);
    expect(calcLineAmount("1.5", 333)).toBe(500); // 499.5 -> 500
    expect(calcLineAmount("0.33", 101)).toBe(33); // 33.33 -> 33
    expect(quantityToHundredths("2.005")).toBe(201n);
  });
  it("caps discounts and handles types", () => {
    expect(calcDiscount(990000, "percent", 500)).toBe(49500);
    expect(calcDiscount(1000, "fixed", 5000)).toBe(1000);
    expect(calcDiscount(1000, "percent", 20000)).toBe(1000);
    expect(calcDiscount(1000, "none", 999)).toBe(0);
  });
  it("applies tax on the discounted amount", () => {
    expect(calcTax(940500, 500)).toBe(47025);
    expect(calcTax(-10, 500)).toBe(0);
  });
  it("matches the seeded proposal computed by the database", () => {
    const t = calcTotals(
      [
        { quantity: "1", unitPriceCents: 750000 },
        { quantity: "1", unitPriceCents: 180000 },
        { quantity: "12", unitPriceCents: 5000 },
      ],
      "percent",
      500,
      500,
    );
    expect(t).toEqual({ subtotalCents: 990000, discountCents: 49500, taxCents: 47025, totalCents: 987525 });
  });
  it("handles very large amounts safely", () => {
    const t = calcTotals([{ quantity: "9999.99", unitPriceCents: 999_999_999 }], "percent", 1234, 1750);
    expect(Number.isSafeInteger(t.totalCents)).toBe(true);
    expect(t.subtotalCents).toBe(9_999_989_990_000);
  });
  it("converts percentages to basis points without floats", () => {
    expect(percentToBps("7.5")).toBe(750);
    expect(percentToBps("0.01")).toBe(1);
    expect(percentToBps("")).toBe(0);
    expect(bpsToPercent(750)).toBe("7.5");
    expect(bpsToPercent(500)).toBe("5");
    expect(() => percentToBps("1.234")).toThrow();
  });
});
