import type { Database } from "@/types/database";

type Enums = Database["public"]["Enums"];
export type Variant = "default" | "neutral" | "success" | "warning" | "danger" | "info" | "outline";
type StatusDef = { label: string; variant: Variant };

export const LEAD_STATUSES: Record<Enums["lead_status"], StatusDef> = {
  new: { label: "New", variant: "info" },
  contacted: { label: "Contacted", variant: "neutral" },
  discovery: { label: "Discovery", variant: "neutral" },
  qualified: { label: "Qualified", variant: "default" },
  proposal_sent: { label: "Proposal Sent", variant: "warning" },
  negotiation: { label: "Negotiation", variant: "warning" },
  won: { label: "Won", variant: "success" },
  lost: { label: "Lost", variant: "danger" },
  not_qualified: { label: "Not Qualified", variant: "neutral" },
};
export const LEAD_PIPELINE: Enums["lead_status"][] = ["new", "contacted", "discovery", "qualified", "proposal_sent", "negotiation", "won", "lost", "not_qualified"];

export const PROJECT_STATUSES: Record<Enums["project_status"], StatusDef> = {
  draft: { label: "Draft", variant: "neutral" },
  planning: { label: "Planning", variant: "info" },
  in_progress: { label: "In Progress", variant: "default" },
  on_hold: { label: "On Hold", variant: "warning" },
  awaiting_client: { label: "Awaiting Client", variant: "warning" },
  in_review: { label: "In Review", variant: "info" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "danger" },
};
export const PROJECT_PIPELINE = Object.keys(PROJECT_STATUSES) as Enums["project_status"][];

export const TASK_STATUSES: Record<Enums["task_status"], StatusDef> = {
  todo: { label: "To Do", variant: "neutral" },
  in_progress: { label: "In Progress", variant: "default" },
  in_review: { label: "In Review", variant: "info" },
  blocked: { label: "Blocked", variant: "danger" },
  done: { label: "Done", variant: "success" },
};
export const TASK_PIPELINE = Object.keys(TASK_STATUSES) as Enums["task_status"][];

export const MILESTONE_STATUSES: Record<Enums["milestone_status"], StatusDef> = {
  pending: { label: "Pending", variant: "neutral" },
  in_progress: { label: "In Progress", variant: "default" },
  completed: { label: "Completed", variant: "success" },
};

export const PROPOSAL_STATUSES: Record<Enums["proposal_status"], StatusDef> = {
  draft: { label: "Draft", variant: "neutral" },
  sent: { label: "Sent", variant: "info" },
  viewed: { label: "Viewed", variant: "default" },
  accepted: { label: "Accepted", variant: "success" },
  rejected: { label: "Rejected", variant: "danger" },
  expired: { label: "Expired", variant: "warning" },
};

export const CONTRACT_STATUSES: Record<Enums["contract_status"], StatusDef> = {
  draft: { label: "Draft", variant: "neutral" },
  sent: { label: "Sent", variant: "info" },
  signed: { label: "Signed", variant: "success" },
  active: { label: "Active", variant: "default" },
  expired: { label: "Expired", variant: "warning" },
  terminated: { label: "Terminated", variant: "danger" },
};

export const INVOICE_STATUSES: Record<Enums["invoice_status"], StatusDef> = {
  draft: { label: "Draft", variant: "neutral" },
  sent: { label: "Sent", variant: "info" },
  partially_paid: { label: "Partially Paid", variant: "warning" },
  paid: { label: "Paid", variant: "success" },
  overdue: { label: "Overdue", variant: "danger" },
  cancelled: { label: "Cancelled", variant: "neutral" },
};

export const PAYMENT_STATUSES: Record<Enums["payment_status"], StatusDef> = {
  pending: { label: "Pending", variant: "warning" },
  completed: { label: "Completed", variant: "success" },
  failed: { label: "Failed", variant: "danger" },
  refunded: { label: "Refunded", variant: "neutral" },
};

export const DELIVERABLE_STATUSES: Record<Enums["deliverable_status"], StatusDef> = {
  draft: { label: "Draft", variant: "neutral" },
  submitted: { label: "Awaiting Approval", variant: "warning" },
  approved: { label: "Approved", variant: "success" },
  changes_requested: { label: "Changes Requested", variant: "danger" },
};

export const REVISION_STATUSES: Record<Enums["revision_status"], StatusDef> = {
  open: { label: "Open", variant: "warning" },
  in_progress: { label: "In Progress", variant: "default" },
  resolved: { label: "Resolved", variant: "success" },
};

export const PRIORITIES: Record<Enums["priority_level"], StatusDef> = {
  low: { label: "Low", variant: "neutral" },
  medium: { label: "Medium", variant: "info" },
  high: { label: "High", variant: "warning" },
  urgent: { label: "Urgent", variant: "danger" },
};

export const MEMBER_STATUSES: Record<Enums["member_status"], StatusDef> = {
  invited: { label: "Invited", variant: "info" },
  active: { label: "Active", variant: "success" },
  deactivated: { label: "Deactivated", variant: "neutral" },
};

export const CLIENT_STATUSES: Record<Enums["client_status"], StatusDef> = {
  active: { label: "Active", variant: "success" },
  inactive: { label: "Inactive", variant: "neutral" },
  archived: { label: "Archived", variant: "neutral" },
};

export const MEETING_STATUSES: Record<Enums["meeting_status"], StatusDef> = {
  requested: { label: "Requested", variant: "warning" },
  scheduled: { label: "Scheduled", variant: "info" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "neutral" },
};

export const PAYMENT_METHODS: Record<Enums["payment_method"], string> = {
  bank_transfer: "Bank transfer",
  card: "Card",
  cash: "Cash",
  cheque: "Cheque",
  upi: "UPI",
  paypal: "PayPal",
  stripe: "Stripe",
  other: "Other",
};

export const EXPENSE_CATEGORIES = {
  software: "Software",
  hardware: "Hardware",
  contractor: "Contractors",
  marketing: "Marketing",
  office: "Office",
  travel: "Travel",
  hosting: "Hosting",
  fees: "Fees",
  taxes: "Taxes",
  other: "Other",
} as const;
export type ExpenseCategory = keyof typeof EXPENSE_CATEGORIES;

export const LEAD_SOURCES = ["website", "referral", "linkedin", "instagram", "x", "google", "event", "cold_outreach", "partner", "other"] as const;
