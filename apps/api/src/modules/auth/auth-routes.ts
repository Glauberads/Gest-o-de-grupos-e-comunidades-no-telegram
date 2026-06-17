import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";

import { requireAuthenticatedUser } from "../../lib/auth.js";
import { getSupabaseAdminClient } from "../../lib/supabase.js";
import { AuthRepository } from "./auth-repository.js";
import { OrganizationRepository } from "../organizations/organization-repository.js";
import { OrganizationService } from "../organizations/organization-service.js";

const bootstrapSchema = z.object({
  organizationName: z.string().min(2)
});

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post("/auth/bootstrap", async (request, reply) => {
    const payload = bootstrapSchema.parse(request.body);
    const user = await requireAuthenticatedUser(request);
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return reply.code(500).send({
        message: "Supabase admin client is not configured"
      });
    }

    const organizationService = new OrganizationService(
      new AuthRepository(supabase),
      new OrganizationRepository(supabase)
    );

    const organization = await organizationService.bootstrapOwner({
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      organizationName: payload.organizationName
    });

    return reply.code(200).send({
      user,
      organization
    });
  });

  app.get("/auth/me", async (request, reply) => {
    const user = await requireAuthenticatedUser(request);

    return reply.code(200).send({
      user
    });
  });
};
