import type { FastifyRequest } from "fastify";

import { IntegrationError } from "./errors.js";
import { getSupabaseAdminClient } from "./supabase.js";

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

  if (!authorization?.startsWith("Bearer ")) {
    throw new IntegrationError("Missing bearer token");
  }

  const token = authorization.replace("Bearer ", "").trim();
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    throw new IntegrationError("Supabase admin client is not configured");
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user?.email) {
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
