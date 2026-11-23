import { describe, expect, it } from "vitest";
import { qualifyLead, scoreLabel } from "@/features/leads/qualification";

const base = { budgetCents: 1_000_000, serviceStartingPriceCents: 450_000, serviceMatched: true, requestedService: "Website", timeline: "1–3 months", activeProjects: 1, capacityProjects: 6 };

describe("lead qualification", () => {
  it("scores an ideal lead at 100", () => {
    expect(qualifyLead(base).score).toBe(100);
  });
  it("penalises low budgets, rush timelines and full capacity", () => {
    const r = qualifyLead({ ...base, budgetCents: 100_000, timeline: "ASAP", activeProjects: 8 });
    expect(r.score).toBeLessThan(50);
    expect(r.breakdown.find((b) => b.key === "budget")!.points).toBeLessThan(10);
    expect(r.breakdown.find((b) => b.key === "capacity")!.reason).toMatch(/capacity/i);
  });
  it("produces an explainable breakdown summing to the score", () => {
    const r = qualifyLead({ ...base, serviceMatched: false, requestedService: null, budgetCents: null, timeline: null });
    const total = r.breakdown.reduce((s, b) => s + b.points, 0);
    const max = r.breakdown.reduce((s, b) => s + b.max, 0);
    expect(r.score).toBe(Math.round((total / max) * 100));
    expect(r.breakdown).toHaveLength(4);
  });
  it("labels scores", () => {
    expect(scoreLabel(80).label).toBe("Hot");
    expect(scoreLabel(60).label).toBe("Warm");
    expect(scoreLabel(10).label).toBe("Cold");
    expect(scoreLabel(null).label).toBe("Unscored");
  });
});
