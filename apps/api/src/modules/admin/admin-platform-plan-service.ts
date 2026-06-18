import { IntegrationError } from "../../lib/errors.js";
import type { Database } from "../../types/database.js";
import { PlatformPlanRepository } from "../platform-plans/platform-plan-repository.js";

type PlatformPlanInsert = Database["public"]["Tables"]["platform_plans"]["Insert"];
type PlatformPlanUpdate = Database["public"]["Tables"]["platform_plans"]["Update"];

function buildFeatures(input: {
  maxCommunities: number;
  maxTelegramGroups: number;
  maxAutomations: number;
  hasPrioritySupport: boolean;
  hasAdvancedReports: boolean;
  hasAiModeration: boolean;
}) {
  const features = [
    `${input.maxCommunities} comunidade${input.maxCommunities === 1 ? "" : "s"}`,
    `${input.maxTelegramGroups} grupo${input.maxTelegramGroups === 1 ? "" : "s"} Telegram`,
    `${input.maxAutomations} automação${input.maxAutomations === 1 ? "" : "ões"}`
  ];

  if (input.hasPrioritySupport) {
    features.push("Suporte prioritário");
  }

  if (input.hasAdvancedReports) {
    features.push("Relatórios avançados");
  }

  if (input.hasAiModeration) {
    features.push("Moderação IA");
  }

  return features;
}

export class AdminPlatformPlanService {
  constructor(private readonly repository: PlatformPlanRepository) {}

  private async writeAdminAuditLog(input: Database["public"]["Tables"]["admin_audit_logs"]["Insert"]) {
    try {
      await this.repository.createAdminAuditLog(input);
    } catch {
      return;
    }
  }

  async listPlans() {
    return this.repository.listAll();
  }

  async getPlan(planId: string) {
    return this.repository.findById(planId);
  }

  async createPlan(
    adminUserId: string,
    input: {
      name: string;
      slug: string;
      description?: string | null;
      priceCents: number;
      billingCycle: string;
      maxCommunities: number;
      maxTelegramGroups: number;
      maxAutomations: number;
      hasPrioritySupport: boolean;
      hasAdvancedReports: boolean;
      hasAiModeration: boolean;
      isFeatured: boolean;
      status: string;
      sortOrder: number;
    }
  ) {
    if (await this.repository.slugExists(input.slug)) {
      throw new IntegrationError("Já existe um plano com este slug.");
    }

    if (await this.repository.codeExists(input.slug)) {
      throw new IntegrationError("Já existe um plano com este código.");
    }

    const payload: PlatformPlanInsert = {
      name: input.name,
      slug: input.slug,
      code: input.slug,
      description: input.description ?? null,
      price_cents: input.priceCents,
      billing_interval: input.billingCycle,
      max_communities: input.maxCommunities,
      max_telegram_groups: input.maxTelegramGroups,
      max_automations: input.maxAutomations,
      has_priority_support: input.hasPrioritySupport,
      has_advanced_reports: input.hasAdvancedReports,
      has_ai_moderation: input.hasAiModeration,
      is_featured: input.isFeatured,
      status: input.status,
      sort_order: input.sortOrder,
      archived_at: input.status === "archived" ? new Date().toISOString() : null,
      features: buildFeatures(input),
      trial_days: 0
    };

    const plan = await this.repository.create(payload);
    await this.writeAdminAuditLog({
      admin_user_id: adminUserId,
      action: "create_platform_plan",
      entity_type: "platform_plan",
      entity_id: (plan as any).id,
      old_value: null,
      new_value: plan as any
    });

    return plan;
  }

  async updatePlan(
    adminUserId: string,
    planId: string,
    input: {
      name: string;
      slug: string;
      description?: string | null;
      priceCents: number;
      billingCycle: string;
      maxCommunities: number;
      maxTelegramGroups: number;
      maxAutomations: number;
      hasPrioritySupport: boolean;
      hasAdvancedReports: boolean;
      hasAiModeration: boolean;
      isFeatured: boolean;
      status: string;
      sortOrder: number;
    }
  ) {
    const currentPlan = await this.repository.findById(planId);

    if (await this.repository.slugExists(input.slug, planId)) {
      throw new IntegrationError("Já existe um plano com este slug.");
    }

    if (await this.repository.codeExists(input.slug, planId)) {
      throw new IntegrationError("Já existe um plano com este código.");
    }

    const payload: PlatformPlanUpdate = {
      name: input.name,
      slug: input.slug,
      code: input.slug,
      description: input.description ?? null,
      price_cents: input.priceCents,
      billing_interval: input.billingCycle,
      max_communities: input.maxCommunities,
      max_telegram_groups: input.maxTelegramGroups,
      max_automations: input.maxAutomations,
      has_priority_support: input.hasPrioritySupport,
      has_advanced_reports: input.hasAdvancedReports,
      has_ai_moderation: input.hasAiModeration,
      is_featured: input.isFeatured,
      status: input.status,
      sort_order: input.sortOrder,
      archived_at: input.status === "archived" ? new Date().toISOString() : null,
      features: buildFeatures(input)
    };

    const plan = await this.repository.update(planId, payload);
    await this.writeAdminAuditLog({
      admin_user_id: adminUserId,
      action: "update_platform_plan",
      entity_type: "platform_plan",
      entity_id: planId,
      old_value: currentPlan as any,
      new_value: plan as any
    });

    return plan;
  }

  async archivePlan(adminUserId: string, planId: string) {
    const currentPlan = await this.repository.findById(planId);
    const plan = await this.repository.archive(planId);

    await this.writeAdminAuditLog({
      admin_user_id: adminUserId,
      action: "archive_platform_plan",
      entity_type: "platform_plan",
      entity_id: planId,
      old_value: currentPlan as any,
      new_value: plan as any
    });

    return plan;
  }

  async restorePlan(adminUserId: string, planId: string) {
    const currentPlan = await this.repository.findById(planId);
    const plan = await this.repository.restore(planId);

    await this.writeAdminAuditLog({
      admin_user_id: adminUserId,
      action: "restore_platform_plan",
      entity_type: "platform_plan",
      entity_id: planId,
      old_value: currentPlan as any,
      new_value: plan as any
    });

    return plan;
  }

  async deletePlan(adminUserId: string, planId: string) {
    const currentPlan = await this.repository.findById(planId);
    const linkedSubscriptions = await this.repository.countLinkedSubscriptions(planId);
    const linkedPayments = await this.repository.countLinkedPayments(planId);

    if (linkedSubscriptions > 0 || linkedPayments > 0) {
      const archivedPlan = await this.archivePlan(adminUserId, planId);

      return {
        deleted: false,
        archived: true,
        message:
          "Este plano possui histórico vinculado de assinaturas ou pagamentos. Para preservar a rastreabilidade, ele foi arquivado em vez de removido.",
        plan: archivedPlan
      };
    }

    await this.repository.delete(planId);
    await this.writeAdminAuditLog({
      admin_user_id: adminUserId,
      action: "delete_platform_plan",
      entity_type: "platform_plan",
      entity_id: planId,
      old_value: currentPlan as any,
      new_value: null
    });

    return {
      deleted: true,
      archived: false,
      message: "Plano removido com sucesso."
    };
  }
}
