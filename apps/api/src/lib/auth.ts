import type { FastifyRequest } from "fastify";

import { IntegrationError } from "./errors.js";
import { getSupabaseAdminClient } from "./supabase.js";
import { AuditLogService } from "../services/audit/audit-log-service.js";

export type AuthenticatedUser = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isSuperAdmin: boolean;
};

export async function requireAuthenticatedUser(
  request: FastifyRequest
): Promise<AuthenticatedUser> {
  const authorization = request.headers.authorization;
  const supabase = getSupabaseAdminClient();

  if (!authorization?.startsWith("Bearer ")) {
    if (supabase) {
      await new AuditLogService(supabase).recordFromRequest(request, {
        actorType: "system",
        category: "security",
        action: "access_blocked",
        status: "failed",
        severity: "warning",
        message: "Tentativa de acesso sem Bearer token.",
        metadata: {
          path: request.url,
          method: request.method
        }
      }).catch(() => undefined);
    }

    throw new IntegrationError("Missing bearer token");
  }

  const token = authorization.replace("Bearer ", "").trim();

  if (!supabase) {
    throw new IntegrationError("Supabase admin client is not configured");
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user?.email) {
    await new AuditLogService(supabase).recordFromRequest(request, {
      actorType: "system",
      category: "security",
      action: "access_blocked",
      status: "failed",
      severity: "warning",
      message: "Tentativa de acesso com token inválido.",
      metadata: {
        path: request.url,
        method: request.method
      }
    }).catch(() => undefined);

    throw new IntegrationError("Invalid Supabase access token", {
      error: error?.message
    });
  }

  return {
    id: data.user.id,
    email: data.user.email,
    fullName:
      typeof data.user.user_metadata.full_name === "string"
        ? data.user.user_metadata.full_name
        : data.user.email,
    role:
      typeof data.user.app_metadata.role === "string"
        ? data.user.app_metadata.role
        : "admin",
    isSuperAdmin: data.user.app_metadata.is_super_admin === true
  };
}
