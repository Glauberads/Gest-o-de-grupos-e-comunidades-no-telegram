import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";

import { requireAuthenticatedUser } from "../../lib/auth.js";
import { getSupabaseAdminClient } from "../../lib/supabase.js";
import { OrganizationRepository } from "../organizations/organization-repository.js";
import { PlatformPlanRepository } from "../platform-plans/platform-plan-repository.js";
import { BillingRepository } from "./billing-repository.js";
import { BillingService } from "./billing-service.js";
import { AuditLogService } from "../../services/audit/audit-log-service.js";

const billingCheckoutSchema = z.object({
  organizationId: z.uuid(),
  platformPlanId: z.uuid(),
  customerDocument: z
    .string()
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => value.length === 11 || value.length === 14, {
      message: "CPF/CNPJ invalido"
    })
});

const billingQuerySchema = z.object({
  organizationId: z.uuid()
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

    const checkout = (await billingService.createPixCheckout({
      organizationId: payload.organizationId,
      platformPlanId: payload.platformPlanId,
      customerEmail: user.email,
      customerDocument: payload.customerDocument
    })) as any;

    await new AuditLogService(supabase).recordFromRequest(request, {
      organizationId: payload.organizationId,
      userId: user.id,
      actorType: user.isSuperAdmin ? "super_admin" : "user",
      actorId: user.id,
      actorEmail: user.email,
      category: "billing",
      action: "pix_checkout_created",
      entityType: "organization_payment",
      entityId: checkout.payment?.id ?? null,
      status: "pending",
      severity: "info",
      message: "Cobrança Pix criada para assinatura SaaS.",
      metadata: {
        platformPlanId: payload.platformPlanId,
        paymentId: checkout.payment?.id ?? null
      }
    });

    return reply.code(201).send(checkout);
  });

  app.get("/billing/subscription", async (request, reply) => {
    const query = billingQuerySchema.parse(request.query);
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

    const billing = await billingService.getSubscription(query.organizationId);
    return reply.code(200).send(billing);
  });

  app.get("/billing/history", async (request, reply) => {
    const query = billingQuerySchema.parse(request.query);
    const user = await requireAuthenticatedUser(request);
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return reply.code(500).send({ message: "Supabase admin client is not configured" });
    }

    const organizationRepository = new OrganizationRepository(supabase);
    await organizationRepository.ensureMembership(query.organizationId, user.id);

    const payments = await new BillingRepository(supabase).listOrganizationPayments(query.organizationId);

    return reply.code(200).send({ payments });
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

    const checkout = (await billingService.createPixCheckout({
      organizationId: payload.organizationId,
      platformPlanId: payload.platformPlanId,
      customerEmail: user.email,
      customerDocument: payload.customerDocument
    })) as any;

    await new AuditLogService(supabase).recordFromRequest(request, {
      organizationId: payload.organizationId,
      userId: user.id,
      actorType: user.isSuperAdmin ? "super_admin" : "user",
      actorId: user.id,
      actorEmail: user.email,
      category: "billing",
      action: "subscription_reactivation_requested",
      entityType: "organization_payment",
      entityId: checkout.payment?.id ?? null,
      status: "pending",
      severity: "warning",
      message: "Nova cobrança criada para regularização da assinatura.",
      metadata: {
        platformPlanId: payload.platformPlanId,
        paymentId: checkout.payment?.id ?? null
      }
    });

    return reply.code(201).send(checkout);
  });
};
