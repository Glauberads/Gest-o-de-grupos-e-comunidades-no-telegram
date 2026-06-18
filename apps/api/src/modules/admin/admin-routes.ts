import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";

import { requireAuthenticatedUser } from "../../lib/auth.js";
import { getSupabaseAdminClient } from "../../lib/supabase.js";
import { AuditLogService } from "../../services/audit/audit-log-service.js";
import { BillingRepository } from "../billing/billing-repository.js";
import { OrganizationRepository } from "../organizations/organization-repository.js";
import { PlatformPlanRepository } from "../platform-plans/platform-plan-repository.js";
import { AdminPlatformPlanService } from "./admin-platform-plan-service.js";
import {
  AdminSubscriptionService,
  isManualActivationSource
} from "./admin-subscription-service.js";

const platformPlanIdParamsSchema = z.object({
  planId: z.uuid()
});

const billingCycleSchema = z.enum(["monthly", "quarterly", "semiannual", "annual", "lifetime"]);
const platformPlanStatusSchema = z.enum(["active", "inactive", "archived"]);

const platformPlanPayloadSchema = z.object({
  name: z.string().min(2, "Nome obrigatório."),
  slug: z
    .string()
    .min(2, "Slug obrigatório.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use apenas letras minúsculas, números e hífens."),
  description: z.string().max(1000).optional().nullable(),
  priceCents: z.coerce.number().int().min(0, "O preço deve ser maior ou igual a zero."),
  billingCycle: billingCycleSchema,
  maxCommunities: z.coerce.number().int().min(0),
  maxTelegramGroups: z.coerce.number().int().min(0),
  maxAutomations: z.coerce.number().int().min(0),
  hasPrioritySupport: z.boolean().default(false),
  hasAdvancedReports: z.boolean().default(false),
  hasAiModeration: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  status: platformPlanStatusSchema.default("inactive"),
  sortOrder: z.coerce.number().int().min(0).default(0)
});

const organizationIdParamsSchema = z.object({
  organizationId: z.uuid()
});

const activateSubscriptionSchema = z.object({
  organizationId: z.uuid(),
  planId: z.uuid(),
  days: z.coerce.number().int().min(1).optional(),
  lifetime: z.boolean().optional(),
  notes: z.string().max(500).optional(),
  activationSource: z
    .string()
    .optional()
    .refine((value) => !value || isManualActivationSource(value), {
      message: "Origem de ativação inválida."
    })
}).refine((value) => value.lifetime === true || Boolean(value.days), {
  message: "Informe a quantidade de dias ou marque o acesso vitalício.",
  path: ["days"]
});

const suspendSubscriptionSchema = z.object({
  organizationId: z.uuid(),
  notes: z.string().max(500).optional()
});

const cancelSubscriptionSchema = z.object({
  organizationId: z.uuid(),
  notes: z.string().max(500).optional()
});

const extendSubscriptionSchema = z.object({
  organizationId: z.uuid(),
  days: z.coerce.number().int().min(1),
  notes: z.string().max(500).optional(),
  activationSource: z
    .string()
    .optional()
    .refine((value) => !value || isManualActivationSource(value), {
      message: "Origem de ativação inválida."
    })
});

const changePlanSchema = z.object({
  organizationId: z.uuid(),
  planId: z.uuid(),
  notes: z.string().max(500).optional()
});

async function requireSuperAdminAccess(request: Parameters<typeof requireAuthenticatedUser>[0]) {
  const user = await requireAuthenticatedUser(request);

  if (!user.isSuperAdmin) {
    const supabase = getSupabaseAdminClient();

    if (supabase) {
      await new AuditLogService(supabase).recordFromRequest(request as any, {
        userId: user.id,
        actorType: "user",
        actorId: user.id,
        actorEmail: user.email,
        category: "security",
        action: "access_blocked",
        status: "failed",
        severity: "warning",
        message: "Tentativa de acesso a recurso exclusivo de super admin.",
        metadata: {
          path: (request as any).url,
          method: (request as any).method
        }
      }).catch(() => undefined);
    }

    throw new Error("Only super admins can access this resource");
  }

  return user;
}

export const adminRoutes: FastifyPluginAsync = async (app) => {
  app.get("/admin/platform-plans", async (request, reply) => {
    try {
      await requireSuperAdminAccess(request);
    } catch {
      return reply.code(403).send({ message: "Only super admins can access this resource" });
    }

    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return reply.code(500).send({ message: "Supabase admin client is not configured" });
    }

    const plans = await new AdminPlatformPlanService(new PlatformPlanRepository(supabase)).listPlans();
    return reply.code(200).send({ plans });
  });

  app.post("/admin/platform-plans", async (request, reply) => {
    let user;
    try {
      user = await requireSuperAdminAccess(request);
    } catch {
      return reply.code(403).send({ message: "Only super admins can access this resource" });
    }

    const payload = platformPlanPayloadSchema.parse(request.body);
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return reply.code(500).send({ message: "Supabase admin client is not configured" });
    }

    const plan = await new AdminPlatformPlanService(
      new PlatformPlanRepository(supabase)
    ).createPlan(user.id, payload);

    await new AuditLogService(supabase).recordFromRequest(request, {
      userId: user.id,
      actorType: "super_admin",
      actorId: user.id,
      actorEmail: user.email,
      category: "admin",
      action: "platform_plan_created",
      entityType: "platform_plan",
      entityId: (plan as any).id,
      status: "success",
      severity: "info",
      message: "Plano SaaS criado pelo super admin.",
      metadata: {
        planName: (plan as any).name,
        slug: (plan as any).slug
      }
    });

    return reply.code(201).send({ plan });
  });

  app.get("/admin/platform-plans/:planId", async (request, reply) => {
    try {
      await requireSuperAdminAccess(request);
    } catch {
      return reply.code(403).send({ message: "Only super admins can access this resource" });
    }

    const params = platformPlanIdParamsSchema.parse(request.params);
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return reply.code(500).send({ message: "Supabase admin client is not configured" });
    }

    const plan = await new AdminPlatformPlanService(
      new PlatformPlanRepository(supabase)
    ).getPlan(params.planId);

    return reply.code(200).send({ plan });
  });

  app.patch("/admin/platform-plans/:planId", async (request, reply) => {
    let user;
    try {
      user = await requireSuperAdminAccess(request);
    } catch {
      return reply.code(403).send({ message: "Only super admins can access this resource" });
    }

    const params = platformPlanIdParamsSchema.parse(request.params);
    const payload = platformPlanPayloadSchema.parse(request.body);
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return reply.code(500).send({ message: "Supabase admin client is not configured" });
    }

    const plan = await new AdminPlatformPlanService(
      new PlatformPlanRepository(supabase)
    ).updatePlan(user.id, params.planId, payload);

    await new AuditLogService(supabase).recordFromRequest(request, {
      userId: user.id,
      actorType: "super_admin",
      actorId: user.id,
      actorEmail: user.email,
      category: "admin",
      action: "platform_plan_updated",
      entityType: "platform_plan",
      entityId: params.planId,
      status: "success",
      severity: "info",
      message: "Plano SaaS atualizado pelo super admin.",
      metadata: {
        planName: (plan as any).name,
        slug: (plan as any).slug
      }
    });

    return reply.code(200).send({ plan });
  });

  app.delete("/admin/platform-plans/:planId", async (request, reply) => {
    let user;
    try {
      user = await requireSuperAdminAccess(request);
    } catch {
      return reply.code(403).send({ message: "Only super admins can access this resource" });
    }

    const params = platformPlanIdParamsSchema.parse(request.params);
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return reply.code(500).send({ message: "Supabase admin client is not configured" });
    }

    const result = await new AdminPlatformPlanService(
      new PlatformPlanRepository(supabase)
    ).deletePlan(user.id, params.planId);

    await new AuditLogService(supabase).recordFromRequest(request, {
      userId: user.id,
      actorType: "super_admin",
      actorId: user.id,
      actorEmail: user.email,
      category: "admin",
      action: result.archived ? "platform_plan_archived" : "platform_plan_deleted",
      entityType: "platform_plan",
      entityId: params.planId,
      status: "success",
      severity: result.archived ? "warning" : "info",
      message: result.message,
      metadata: {
        archived: result.archived,
        deleted: result.deleted
      }
    });

    return reply.code(200).send(result);
  });

  app.post("/admin/platform-plans/:planId/archive", async (request, reply) => {
    let user;
    try {
      user = await requireSuperAdminAccess(request);
    } catch {
      return reply.code(403).send({ message: "Only super admins can access this resource" });
    }

    const params = platformPlanIdParamsSchema.parse(request.params);
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return reply.code(500).send({ message: "Supabase admin client is not configured" });
    }

    const plan = await new AdminPlatformPlanService(
      new PlatformPlanRepository(supabase)
    ).archivePlan(user.id, params.planId);

    await new AuditLogService(supabase).recordFromRequest(request, {
      userId: user.id,
      actorType: "super_admin",
      actorId: user.id,
      actorEmail: user.email,
      category: "admin",
      action: "platform_plan_archived",
      entityType: "platform_plan",
      entityId: params.planId,
      status: "success",
      severity: "warning",
      message: "Plano arquivado pelo super admin.",
      metadata: {
        planName: (plan as any).name
      }
    });

    return reply.code(200).send({ plan });
  });

  app.post("/admin/platform-plans/:planId/restore", async (request, reply) => {
    let user;
    try {
      user = await requireSuperAdminAccess(request);
    } catch {
      return reply.code(403).send({ message: "Only super admins can access this resource" });
    }

    const params = platformPlanIdParamsSchema.parse(request.params);
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return reply.code(500).send({ message: "Supabase admin client is not configured" });
    }

    const plan = await new AdminPlatformPlanService(
      new PlatformPlanRepository(supabase)
    ).restorePlan(user.id, params.planId);

    await new AuditLogService(supabase).recordFromRequest(request, {
      userId: user.id,
      actorType: "super_admin",
      actorId: user.id,
      actorEmail: user.email,
      category: "admin",
      action: "platform_plan_restored",
      entityType: "platform_plan",
      entityId: params.planId,
      status: "success",
      severity: "info",
      message: "Plano restaurado pelo super admin.",
      metadata: {
        planName: (plan as any).name
      }
    });

    return reply.code(200).send({ plan });
  });

  app.get("/admin/users", async (request, reply) => {
    try {
      await requireSuperAdminAccess(request);
    } catch {
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
    try {
      await requireSuperAdminAccess(request);
    } catch {
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

  app.get("/admin/subscriptions", async (request, reply) => {
    try {
      await requireSuperAdminAccess(request);
    } catch {
      return reply.code(403).send({ message: "Only super admins can access this resource" });
    }

    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return reply.code(500).send({ message: "Supabase admin client is not configured" });
    }

    const service = new AdminSubscriptionService(
      new BillingRepository(supabase),
      new OrganizationRepository(supabase),
      new PlatformPlanRepository(supabase)
    );

    const subscriptions = await service.listSubscriptions();
    return reply.code(200).send({ subscriptions });
  });

  app.get("/admin/subscriptions/:organizationId", async (request, reply) => {
    try {
      await requireSuperAdminAccess(request);
    } catch {
      return reply.code(403).send({ message: "Only super admins can access this resource" });
    }

    const params = organizationIdParamsSchema.parse(request.params);
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return reply.code(500).send({ message: "Supabase admin client is not configured" });
    }

    const service = new AdminSubscriptionService(
      new BillingRepository(supabase),
      new OrganizationRepository(supabase),
      new PlatformPlanRepository(supabase)
    );

    const details = await service.getSubscriptionDetails(params.organizationId);
    return reply.code(200).send(details);
  });

  app.post("/admin/subscriptions/activate", async (request, reply) => {
    let user;
    try {
      user = await requireSuperAdminAccess(request);
    } catch {
      return reply.code(403).send({ message: "Only super admins can access this resource" });
    }

    const payload = activateSubscriptionSchema.parse(request.body);
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return reply.code(500).send({ message: "Supabase admin client is not configured" });
    }

    const service = new AdminSubscriptionService(
      new BillingRepository(supabase),
      new OrganizationRepository(supabase),
      new PlatformPlanRepository(supabase)
    );

    const subscription = await service.activateManually({
      organizationId: payload.organizationId,
      planId: payload.planId,
      days: payload.days,
      lifetime: payload.lifetime,
      notes: payload.notes,
      activationSource: payload.activationSource as any,
      adminUserId: user.id
    });

    await new AuditLogService(supabase).recordFromRequest(request, {
      organizationId: payload.organizationId,
      userId: user.id,
      actorType: "super_admin",
      actorId: user.id,
      actorEmail: user.email,
      category: "admin",
      action: payload.lifetime ? "manual_subscription_lifetime_granted" : "manual_subscription_activated",
      entityType: "organization_subscription",
      entityId: (subscription as any).id,
      status: "success",
      severity: "info",
      message: "Assinatura alterada manualmente pelo super admin.",
      metadata: {
        planId: payload.planId,
        days: payload.days ?? null,
        lifetime: payload.lifetime ?? false
      }
    });

    return reply.code(200).send({ subscription });
  });

  app.post("/admin/subscriptions/suspend", async (request, reply) => {
    let user;
    try {
      user = await requireSuperAdminAccess(request);
    } catch {
      return reply.code(403).send({ message: "Only super admins can access this resource" });
    }

    const payload = suspendSubscriptionSchema.parse(request.body);
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return reply.code(500).send({ message: "Supabase admin client is not configured" });
    }

    const service = new AdminSubscriptionService(
      new BillingRepository(supabase),
      new OrganizationRepository(supabase),
      new PlatformPlanRepository(supabase)
    );

    const subscription = await service.suspend({
      organizationId: payload.organizationId,
      notes: payload.notes,
      adminUserId: user.id
    });

    await new AuditLogService(supabase).recordFromRequest(request, {
      organizationId: payload.organizationId,
      userId: user.id,
      actorType: "super_admin",
      actorId: user.id,
      actorEmail: user.email,
      category: "admin",
      action: "subscription_suspended",
      entityType: "organization_subscription",
      entityId: (subscription as any).id,
      status: "success",
      severity: "warning",
      message: "Assinatura suspensa manualmente pelo super admin.",
      metadata: {
        notes: payload.notes ?? null
      }
    });

    return reply.code(200).send({ subscription });
  });

  app.post("/admin/subscriptions/cancel", async (request, reply) => {
    let user;
    try {
      user = await requireSuperAdminAccess(request);
    } catch {
      return reply.code(403).send({ message: "Only super admins can access this resource" });
    }

    const payload = cancelSubscriptionSchema.parse(request.body);
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return reply.code(500).send({ message: "Supabase admin client is not configured" });
    }

    const service = new AdminSubscriptionService(
      new BillingRepository(supabase),
      new OrganizationRepository(supabase),
      new PlatformPlanRepository(supabase)
    );

    const subscription = await service.cancel({
      organizationId: payload.organizationId,
      notes: payload.notes,
      adminUserId: user.id
    });

    await new AuditLogService(supabase).recordFromRequest(request, {
      organizationId: payload.organizationId,
      userId: user.id,
      actorType: "super_admin",
      actorId: user.id,
      actorEmail: user.email,
      category: "admin",
      action: "subscription_cancelled",
      entityType: "organization_subscription",
      entityId: (subscription as any).id,
      status: "success",
      severity: "warning",
      message: "Assinatura cancelada manualmente pelo super admin.",
      metadata: {
        notes: payload.notes ?? null
      }
    });

    return reply.code(200).send({ subscription });
  });

  app.post("/admin/subscriptions/extend", async (request, reply) => {
    let user;
    try {
      user = await requireSuperAdminAccess(request);
    } catch {
      return reply.code(403).send({ message: "Only super admins can access this resource" });
    }

    const payload = extendSubscriptionSchema.parse(request.body);
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return reply.code(500).send({ message: "Supabase admin client is not configured" });
    }

    const service = new AdminSubscriptionService(
      new BillingRepository(supabase),
      new OrganizationRepository(supabase),
      new PlatformPlanRepository(supabase)
    );

    const subscription = await service.extend({
      organizationId: payload.organizationId,
      days: payload.days,
      notes: payload.notes,
      activationSource: payload.activationSource as any,
      adminUserId: user.id
    });

    await new AuditLogService(supabase).recordFromRequest(request, {
      organizationId: payload.organizationId,
      userId: user.id,
      actorType: "super_admin",
      actorId: user.id,
      actorEmail: user.email,
      category: "admin",
      action: "subscription_extended",
      entityType: "organization_subscription",
      entityId: (subscription as any).id,
      status: "success",
      severity: "info",
      message: "Assinatura estendida manualmente pelo super admin.",
      metadata: {
        days: payload.days,
        activationSource: payload.activationSource ?? null
      }
    });

    return reply.code(200).send({ subscription });
  });

  app.post("/admin/subscriptions/change-plan", async (request, reply) => {
    let user;
    try {
      user = await requireSuperAdminAccess(request);
    } catch {
      return reply.code(403).send({ message: "Only super admins can access this resource" });
    }

    const payload = changePlanSchema.parse(request.body);
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return reply.code(500).send({ message: "Supabase admin client is not configured" });
    }

    const service = new AdminSubscriptionService(
      new BillingRepository(supabase),
      new OrganizationRepository(supabase),
      new PlatformPlanRepository(supabase)
    );

    const subscription = await service.changePlan({
      organizationId: payload.organizationId,
      planId: payload.planId,
      notes: payload.notes,
      adminUserId: user.id
    });

    await new AuditLogService(supabase).recordFromRequest(request, {
      organizationId: payload.organizationId,
      userId: user.id,
      actorType: "super_admin",
      actorId: user.id,
      actorEmail: user.email,
      category: "admin",
      action: "subscription_plan_changed",
      entityType: "organization_subscription",
      entityId: (subscription as any).id,
      status: "success",
      severity: "info",
      message: "Plano da assinatura alterado pelo super admin.",
      metadata: {
        planId: payload.planId
      }
    });

    return reply.code(200).send({ subscription });
  });
};
