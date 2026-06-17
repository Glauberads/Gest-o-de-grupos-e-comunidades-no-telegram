import type { FastifyPluginAsync } from "fastify";

import { requireAuthenticatedUser } from "../../lib/auth.js";
import { getSupabaseAdminClient } from "../../lib/supabase.js";
import { OrganizationRepository } from "./organization-repository.js";

export const organizationRoutes: FastifyPluginAsync = async (app) => {
  app.get("/organizations", async (request, reply) => {
    const user = await requireAuthenticatedUser(request);
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return reply.code(500).send({ message: "Supabase admin client is not configured" });
    }

    const organizations = await new OrganizationRepository(supabase).findByOwnerUserId(
      user.id
    );

    return reply.code(200).send({ organizations });
  });
};

