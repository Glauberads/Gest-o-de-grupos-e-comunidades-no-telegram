import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";

import { requireAuthenticatedUser } from "../../lib/auth.js";
import { getSupabaseAdminClient } from "../../lib/supabase.js";
import { OrganizationRepository } from "../organizations/organization-repository.js";
import { PlatformPlanRepository } from "../platform-plans/platform-plan-repository.js";
import { BillingRepository } from "./billing-repository.js";
import { BillingService } from "./billing-service.js";

const billingCheckoutSchema = z.object({
  organizationId: z.uuid(),
  platformPlanId: z.uuid()
});

export const billingRoutes: FastifyPluginAsync = async (app) => {
  app.post("/billing/checkout/pix", async (request, reply) => {
    const payload = billingCheckoutSchema.parse(request.body);
    const user = await requireAuthenticatedUser(request);
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return reply.code(500).send({ message: "Supabase admin client is not configured" });
    }

    const organizationRepository = new OrganizationRepository(supabase);
    await organizationRepository.ensureMembership(payload.organizationId, user.id);

    const billingService = new BillingService(
      new BillingRepository(supabase),
      organizationRepository,
      new PlatformPlanRepository(supabase)
    );

    const checkout = await billingService.createPixCheckout({
      organizationId: payload.organizationId,
      platformPlanId: payload.platformPlanId,
      customerEmail: user.email
    });

    return reply.code(201).send(checkout);
  });

  app.get("/billing/subscription", async (request, reply) => {
    const querySchema = z.object({
      organizationId: z.uuid()
    });

    const query = querySchema.parse(request.query);
    const user = await requireAuthenticatedUser(request);
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return reply.code(500).send({ message: "Supabase admin client is not configured" });
    }

    const organizationRepository = new OrganizationRepository(supabase);
    await organizationRepository.ensureMembership(query.organizationId, user.id);

    const billingService = new BillingService(
      new BillingRepository(supabase),
      organizationRepository,
      new PlatformPlanRepository(supabase)
    );

    const subscription = await billingService.getSubscription(query.organizationId);
    return reply.code(200).send({ subscription });
  });

  app.post("/billing/reactivate", async (request, reply) => {
    const payload = billingCheckoutSchema.parse(request.body);
    const user = await requireAuthenticatedUser(request);
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return reply.code(500).send({ message: "Supabase admin client is not configured" });
    }

    const organizationRepository = new OrganizationRepository(supabase);
    await organizationRepository.ensureMembership(payload.organizationId, user.id);

    const billingService = new BillingService(
      new BillingRepository(supabase),
      organizationRepository,
      new PlatformPlanRepository(supabase)
    );

    const checkout = await billingService.createPixCheckout({
      organizationId: payload.organizationId,
      platformPlanId: payload.platformPlanId,
      customerEmail: user.email
    });

    return reply.code(201).send(checkout);
  });
};
