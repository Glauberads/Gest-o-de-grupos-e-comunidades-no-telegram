export type MemberStatus =
  | "pending"
  | "active"
  | "overdue"
  | "removed"
  | "cancelled";

export type PlanInterval = "monthly" | "quarterly" | "yearly" | "lifetime";

export type PaymentStatus =
  | "created"
  | "confirmed"
  | "received"
  | "overdue"
  | "deleted"
  | "refunded"
  | "restored";

