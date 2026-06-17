import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";

import { requireAuthenticatedUser } from "../../lib/auth.js";
import { getSupabaseAdminClient } from "../../lib/supabase.js";
import { OrganizationRepository } from "../organizations/organization-repository.js";
import { PlanRepository } from "./plan-repository.js";

const createPlanSchema = z.object({
  organizationId: z.uuid(),
  communityId: z.uuid(),
  name: z.string().min(2),
  description: z.string().optional(),
  billingInterval: z.enum(["monthly", "quarterly", "yearly", "lifetime"]),
  priceCents: z.number().int().positive(),
  durationDays: z.number().int().positive().nullable().optional(),
  isRecurring: z.boolean().default(false)
});

export const planRoutes: FastifyPluginAsync = async (app) => {
  app.post("/plans", async (request, reply) => {
    const payload = createPlanSchema.parse(request.body);
    const user = await requireAuthenticatedUser(request);
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return reply.code(500).send({ message: "Supabase admin client is not configured" });
    }

    await new OrganizationRepository(supabase).ensureMembership(
      payload.organizationId,
      user.id
    );

    const plan = await new PlanRepository(supabase).create({
      organization_id: payload.organizationId,
      community_id: payload.communityId,
      name: payload.name,
      description: payload.description,
      billing_interval: payload.billingInterval,
      price_cents: payload.priceCents,
      duration_days: payload.durationDays ?? null,
      is_recurring: payload.isRecurring
    });

    return reply.code(201).send({ plan });
  });

  app.get("/plans", async (request, reply) => {
    const querySchema = z.object({
      organizationId: z.uuid(),
      communityId: z.uuid()
    });

    const query = querySchema.parse(request.query);
    const user = await requireAuthenticatedUser(request);
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return reply.code(500).send({ message: "Supabase admin client is not configured" });
    }

    await new OrganizationRepository(supabase).ensureMembership(
      query.organizationId,
      user.id
    );

    const plans = await new PlanRepository(supabase).listByCommunity(
      query.organizationId,
      query.communityId
    );

    return reply.code(200).send({ plans });
  });
};
