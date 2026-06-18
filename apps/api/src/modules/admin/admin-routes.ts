import type { FastifyPluginAsync } from "fastify";

import { requireAuthenticatedUser } from "../../lib/auth.js";
import { getSupabaseAdminClient } from "../../lib/supabase.js";

export const adminRoutes: FastifyPluginAsync = async (app) => {
  app.get("/admin/users", async (request, reply) => {
    const user = await requireAuthenticatedUser(request);

    if (!user.isSuperAdmin) {
      return reply.code(403).send({ message: "Only super admins can access this resource" });
    }

    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return reply.code(500).send({ message: "Supabase admin client is not configured" });
    }

    const usersResult = await (supabase as any)
      .from("users")
      .select("id, email, full_name, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (usersResult.error) {
      return reply.code(500).send({ message: "Failed to load platform users" });
    }

    return reply.code(200).send({ users: usersResult.data ?? [] });
  });

  app.get("/admin/organizations", async (request, reply) => {
    const user = await requireAuthenticatedUser(request);

    if (!user.isSuperAdmin) {
      return reply.code(403).send({ message: "Only super admins can access this resource" });
    }

    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return reply.code(500).send({ message: "Supabase admin client is not configured" });
    }

    const organizationsResult = await (supabase as any)
      .from("organizations")
      .select("id, name, slug, status, owner_user_id, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (organizationsResult.error) {
      return reply.code(500).send({ message: "Failed to load platform organizations" });
    }

    return reply.code(200).send({ organizations: organizationsResult.data ?? [] });
  });
};
