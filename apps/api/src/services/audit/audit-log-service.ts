import type { FastifyRequest } from "fastify";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "../../types/database.js";
import { unwrapSupabase } from "../../lib/supabase-helpers.js";

type DatabaseClient = SupabaseClient<Database>;

type AuditActorType = "user" | "super_admin" | "system" | "webhook" | "bot";
type AuditStatus = "success" | "failed" | "pending" | "ignored";
type AuditSeverity = "info" | "warning" | "error" | "critical";
type AuditCategory =
  | "auth"
  | "billing"
  | "asaas"
  | "telegram"
  | "organization"
  | "community"
  | "admin"
  | "security"
  | "system"
  | "webhook";

type AuditLogInput = {
  organizationId?: string | null;
  userId?: string | null;
  actorType: AuditActorType;
  actorId?: string | null;
  actorEmail?: string | null;
  category: AuditCategory;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  status?: AuditStatus;
  severity?: AuditSeverity;
  message: string;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
};

const SENSITIVE_KEY_PATTERNS = [
  "password",
  "authorization",
  "api_key",
  "service_role",
  "token",
  "jwt_secret",
  "secret",
  "encrypted_token"
];

function maskValue(value: string) {
  if (value.length <= 8) {
    return "********";
  }

  return `${value.slice(0, 4)}********${value.slice(-4)}`;
}

function sanitizeValue(key: string, value: unknown): Json {
  const normalizedKey = key.toLowerCase();
  const shouldMask = SENSITIVE_KEY_PATTERNS.some((pattern) => normalizedKey.includes(pattern));

  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    return shouldMask ? maskValue(value) : value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeValue(key, entry));
  }

  if (typeof value === "object") {
    const nextObject: Record<string, Json> = {};

    for (const [entryKey, entryValue] of Object.entries(value)) {
      nextObject[entryKey] = sanitizeValue(entryKey, entryValue);
    }

    return nextObject;
  }

  return String(value);
}

function sanitizeMetadata(value?: Record<string, unknown> | null): Json {
  if (!value) {
    return {};
  }

  const nextObject: Record<string, Json> = {};

  for (const [key, entryValue] of Object.entries(value)) {
    nextObject[key] = sanitizeValue(key, entryValue);
  }

  return nextObject;
}

function getIpAddress(request?: FastifyRequest) {
  if (!request) {
    return null;
  }

  const forwardedFor = request.headers["x-forwarded-for"];
  const directIp = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;

  return directIp?.split(",")[0]?.trim() ?? request.ip ?? null;
}

function getUserAgent(request?: FastifyRequest) {
  if (!request) {
    return null;
  }

  const value = request.headers["user-agent"];
  return Array.isArray(value) ? value[0] : value ?? null;
}

export class AuditLogService {
  constructor(private readonly supabase: DatabaseClient) {}

  async record(input: AuditLogInput) {
    const result = await (this.supabase as any)
      .from("audit_logs")
      .insert({
        organization_id: input.organizationId ?? null,
        user_id: input.userId ?? null,
        actor_type: input.actorType,
        actor_id: input.actorId ?? null,
        actor_email: input.actorEmail ?? null,
        category: input.category,
        action: input.action,
        entity_type: input.entityType ?? null,
        entity_id: input.entityId ?? null,
        status: input.status ?? "success",
        severity: input.severity ?? "info",
        message: input.message,
        metadata: sanitizeMetadata(input.metadata),
        ip_address: input.ipAddress ?? null,
        user_agent: input.userAgent ?? null,
        request_id: input.requestId ?? null
      })
      .select("id")
      .single();

    return unwrapSupabase(result, "Failed to create audit log");
  }

  async recordFromRequest(
    request: FastifyRequest | undefined,
    input: Omit<AuditLogInput, "ipAddress" | "userAgent" | "requestId">
  ) {
    return this.record({
      ...input,
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
      requestId: request?.id ?? null
    });
  }

  async listForAdmin(filters: {
    category?: string;
    severity?: string;
    status?: string;
    organizationId?: string;
    userId?: string;
    action?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  }) {
    let query = (this.supabase as any)
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (filters.category) query = query.eq("category", filters.category);
    if (filters.severity) query = query.eq("severity", filters.severity);
    if (filters.status) query = query.eq("status", filters.status);
    if (filters.organizationId) query = query.eq("organization_id", filters.organizationId);
    if (filters.userId) query = query.eq("user_id", filters.userId);
    if (filters.action) query = query.eq("action", filters.action);
    if (filters.dateFrom) query = query.gte("created_at", filters.dateFrom);
    if (filters.dateTo) query = query.lte("created_at", filters.dateTo);
    if (filters.search) {
      query = query.or(
        `message.ilike.%${filters.search}%,action.ilike.%${filters.search}%,actor_email.ilike.%${filters.search}%`
      );
    }

    return unwrapSupabase(await query, "Failed to load audit logs");
  }

  async listForOrganization(
    organizationId: string,
    filters: {
      category?: string;
      severity?: string;
      status?: string;
      action?: string;
      dateFrom?: string;
      dateTo?: string;
      search?: string;
    }
  ) {
    let query = (this.supabase as any)
      .from("audit_logs")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (filters.category) query = query.eq("category", filters.category);
    if (filters.severity) query = query.eq("severity", filters.severity);
    if (filters.status) query = query.eq("status", filters.status);
    if (filters.action) query = query.eq("action", filters.action);
    if (filters.dateFrom) query = query.gte("created_at", filters.dateFrom);
    if (filters.dateTo) query = query.lte("created_at", filters.dateTo);
    if (filters.search) {
      query = query.or(
        `message.ilike.%${filters.search}%,action.ilike.%${filters.search}%,actor_email.ilike.%${filters.search}%`
      );
    }

    return unwrapSupabase(await query, "Failed to load organization audit logs");
  }

  async getById(id: string) {
    const result = await (this.supabase as any)
      .from("audit_logs")
      .select("*")
      .eq("id", id)
      .single();

    return unwrapSupabase(result, "Failed to load audit log");
  }
}
