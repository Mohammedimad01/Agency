/** Email types a user can opt out of (transactional/auth emails are always sent). */
export const EMAIL_PREF_TYPES = {
  new_lead: "New leads",
  new_project: "New project started",
  milestone_update: "Milestone updates",
  proposal_sent: "New proposals",
  invoice_generated: "New invoices",
  payment_reminder: "Payment reminders",
  deliverable_ready: "Deliverables ready for review",
  project_completed: "Project completed",
  review_request: "Feedback requests",
} as const;
