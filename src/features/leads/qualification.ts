/**
 * Lead qualification engine.
 * Each criterion contributes up to `weight` points; the final score is 0–100.
 * Add, remove or re-weight criteria here — the breakdown is stored on the lead
 * (`leads.qualification`) so scoring decisions stay explainable.
 */
export interface QualificationInput {
  budgetCents: number | null;
  serviceStartingPriceCents: number | null;
  serviceMatched: boolean;
  requestedService: string | null;
  timeline: string | null;
  activeProjects: number;
  capacityProjects: number;
}

export interface CriterionResult {
  key: string;
  label: string;
  points: number;
  max: number;
  reason: string;
}

interface Criterion {
  key: string;
  label: string;
  weight: number;
  evaluate: (input: QualificationInput) => { ratio: number; reason: string };
}

export const TIMELINE_OPTIONS = ["ASAP", "Within a month", "1–3 months", "3–6 months", "Flexible"] as const;

const CRITERIA: Criterion[] = [
  {
    key: "budget",
    label: "Budget",
    weight: 35,
    evaluate: ({ budgetCents, serviceStartingPriceCents }) => {
      if (budgetCents === null) return { ratio: 0.3, reason: "Budget not specified" };
      if (!serviceStartingPriceCents) {
        return budgetCents >= 500000
          ? { ratio: 1, reason: "Healthy budget" }
          : { ratio: 0.55, reason: "Modest budget; service price unknown" };
      }
      const r = budgetCents / serviceStartingPriceCents;
      if (r >= 1) return { ratio: 1, reason: "Budget meets the service starting price" };
      if (r >= 0.6) return { ratio: 0.6, reason: "Budget slightly below the starting price" };
      return { ratio: 0.15, reason: "Budget well below the starting price" };
    },
  },
  {
    key: "service_fit",
    label: "Service fit",
    weight: 25,
    evaluate: ({ serviceMatched, requestedService }) =>
      serviceMatched
        ? { ratio: 1, reason: "Matches an active service" }
        : requestedService
          ? { ratio: 0.5, reason: "Described need, no direct service match" }
          : { ratio: 0.2, reason: "Unclear need" },
  },
  {
    key: "timeline",
    label: "Deadline",
    weight: 20,
    evaluate: ({ timeline }) => {
      switch (timeline) {
        case "1–3 months":
        case "3–6 months":
          return { ratio: 1, reason: "Realistic timeline" };
        case "Within a month":
          return { ratio: 0.75, reason: "Tight but workable timeline" };
        case "Flexible":
          return { ratio: 0.7, reason: "Flexible timeline (lower urgency)" };
        case "ASAP":
          return { ratio: 0.45, reason: "Rush timeline — delivery risk" };
        default:
          return { ratio: 0.5, reason: "Timeline not specified" };
      }
    },
  },
  {
    key: "capacity",
    label: "Team capacity",
    weight: 20,
    evaluate: ({ activeProjects, capacityProjects }) => {
      const load = capacityProjects > 0 ? activeProjects / capacityProjects : 1;
      if (load < 0.7) return { ratio: 1, reason: `Capacity available (${activeProjects}/${capacityProjects} active projects)` };
      if (load < 1) return { ratio: 0.6, reason: `Nearing capacity (${activeProjects}/${capacityProjects})` };
      return { ratio: 0.2, reason: `At or over capacity (${activeProjects}/${capacityProjects})` };
    },
  },
];

export function qualifyLead(input: QualificationInput): { score: number; breakdown: CriterionResult[] } {
  const breakdown = CRITERIA.map((c) => {
    const { ratio, reason } = c.evaluate(input);
    const clamped = Math.min(1, Math.max(0, ratio));
    return { key: c.key, label: c.label, max: c.weight, points: Math.round(c.weight * clamped), reason };
  });
  const max = CRITERIA.reduce((s, c) => s + c.weight, 0);
  const total = breakdown.reduce((s, b) => s + b.points, 0);
  return { score: Math.round((total / max) * 100), breakdown };
}

export function scoreLabel(score: number | null | undefined): { label: string; variant: "success" | "warning" | "neutral" | "danger" } {
  if (score === null || score === undefined) return { label: "Unscored", variant: "neutral" };
  if (score >= 75) return { label: "Hot", variant: "success" };
  if (score >= 55) return { label: "Warm", variant: "warning" };
  return { label: "Cold", variant: "neutral" };
}
