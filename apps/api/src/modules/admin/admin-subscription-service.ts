import { IntegrationError } from "../../lib/errors.js";
import { BillingRepository } from "../billing/billing-repository.js";
import { OrganizationRepository } from "../organizations/organization-repository.js";
import { PlatformPlanRepository } from "../platform-plans/platform-plan-repository.js";

const MANUAL_ACTIVATION_SOURCES = ["asaas", "manual", "migration", "bonus", "partner"] as const;

export type ManualActivationSource = (typeof MANUAL_ACTIVATION_SOURCES)[number];

function addDaysToIso(baseDate: Date, days: number) {
  const nextDate = new Date(baseDate);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate.toISOString();
}

function resolveFutureDate(value?: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export class AdminSubscriptionService {
  constructor(
    private readonly billingRepository: BillingRepository,
    private readonly organizationRepository: OrganizationRepository,
    private readonly platformPlanRepository: PlatformPlanRepository
  ) {}

  async listSubscriptions() {
    return this.billingRepository.listOrganizationSubscriptions();
  }

  async getSubscriptionDetails(organizationId: string) {
    const organization = await this.organizationRepository.findById(organizationId);
    const details = await this.billingRepository.getOrganizationSubscriptionDetails(organizationId);

    return {
      organization,
      ...details
    };
  }

  async activateManually(input: {
    organizationId: string;
    planId: string;
    adminUserId: string;
    days?: number;
    lifetime?: boolean;
    notes?: string | null;
    activationSource?: ManualActivationSource;
  }) {
    const organization = await this.organizationRepository.findById(input.organizationId);
    const plan = (await this.platformPlanRepository.findById(input.planId)) as any;
    const previousSubscription = await this.billingRepository.getOrganizationSubscription(input.organizationId);
    const now = new Date();
    const lifetime = input.lifetime === true;
    const activeUntil =
      lifetime || !input.days ? null : addDaysToIso(now, input.days);

    const subscription = (await this.billingRepository.upsertOrganizationSubscription({
      organization_id: organization.id,
      platform_plan_id: plan.id,
      status: "active",
      started_at: previousSubscription?.started_at ?? now.toISOString(),
      current_period_start: now.toISOString(),
      current_period_end: activeUntil,
      active_until: activeUntil,
      grace_period_ends_at: null,
      cancelled_at: null,
      lifetime,
      activation_source: input.activationSource ?? "manual",
      notes: input.notes ?? null,
      metadata:
        typeof previousSubscription?.metadata === "object" &&
        previousSubscription.metadata !== null &&
        !Array.isArray(previousSubscription.metadata)
          ? previousSubscription.metadata
          : {}
    })) as any;

    await this.organizationRepository.updateStatus(organization.id, "active");
    await this.billingRepository.createSubscriptionAuditLog({
      organization_id: organization.id,
      admin_user_id: input.adminUserId,
      action: lifetime ? "activate_lifetime" : "activate_manual",
      old_status: previousSubscription?.status ?? organization.status,
      new_status: "active",
      notes: input.notes ?? null
    });

    return subscription;
  }

  async suspend(input: {
    organizationId: string;
    adminUserId: string;
    notes?: string | null;
  }) {
    const organization = await this.organizationRepository.findById(input.organizationId);
    const previousSubscription = await this.billingRepository.getOrganizationSubscription(input.organizationId);

    if (!previousSubscription) {
      throw new IntegrationError("Nenhuma assinatura encontrada para esta organização.");
    }

    const subscription = await this.billingRepository.updateOrganizationSubscription(input.organizationId, {
      status: "suspended",
      notes: input.notes ?? previousSubscription.notes ?? null,
      grace_period_ends_at: null
    });

    await this.organizationRepository.updateStatus(organization.id, "suspended");
    await this.billingRepository.createSubscriptionAuditLog({
      organization_id: organization.id,
      admin_user_id: input.adminUserId,
      action: "suspend",
      old_status: previousSubscription.status,
      new_status: "suspended",
      notes: input.notes ?? null
    });

    return subscription;
  }

  async cancel(input: {
    organizationId: string;
    adminUserId: string;
    notes?: string | null;
  }) {
    const organization = await this.organizationRepository.findById(input.organizationId);
    const previousSubscription = await this.billingRepository.getOrganizationSubscription(input.organizationId);

    if (!previousSubscription) {
      throw new IntegrationError("Nenhuma assinatura encontrada para esta organização.");
    }

    const subscription = await this.billingRepository.updateOrganizationSubscription(input.organizationId, {
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      notes: input.notes ?? previousSubscription.notes ?? null
    });

    await this.organizationRepository.updateStatus(organization.id, "cancelled");
    await this.billingRepository.createSubscriptionAuditLog({
      organization_id: organization.id,
      admin_user_id: input.adminUserId,
      action: "cancel",
      old_status: previousSubscription.status,
      new_status: "cancelled",
      notes: input.notes ?? null
    });

    return subscription;
  }

  async extend(input: {
    organizationId: string;
    adminUserId: string;
    days: number;
    notes?: string | null;
    activationSource?: ManualActivationSource;
  }) {
    const organization = await this.organizationRepository.findById(input.organizationId);
    const previousSubscription = await this.billingRepository.getOrganizationSubscription(input.organizationId);

    if (!previousSubscription) {
      throw new IntegrationError("Nenhuma assinatura encontrada para esta organização.");
    }

    if (previousSubscription.lifetime) {
      throw new IntegrationError("Assinaturas vitalícias não precisam de extensão.");
    }

    const now = new Date();
    const baseDate =
      resolveFutureDate(previousSubscription.active_until) ??
      resolveFutureDate(previousSubscription.current_period_end) ??
      now;
    const comparisonBase = baseDate.getTime() > now.getTime() ? baseDate : now;
    const nextActiveUntil = addDaysToIso(comparisonBase, input.days);

    const subscription = await this.billingRepository.updateOrganizationSubscription(input.organizationId, {
      status: "active",
      active_until: nextActiveUntil,
      current_period_end: nextActiveUntil,
      grace_period_ends_at: null,
      cancelled_at: null,
      activation_source: input.activationSource ?? previousSubscription.activation_source ?? "manual",
      notes: input.notes ?? previousSubscription.notes ?? null
    });

    await this.organizationRepository.updateStatus(organization.id, "active");
    await this.billingRepository.createSubscriptionAuditLog({
      organization_id: organization.id,
      admin_user_id: input.adminUserId,
      action: "extend",
      old_status: previousSubscription.status,
      new_status: "active",
      notes: input.notes ?? null
    });

    return subscription;
  }

  async changePlan(input: {
    organizationId: string;
    planId: string;
    adminUserId: string;
    notes?: string | null;
  }) {
    const organization = await this.organizationRepository.findById(input.organizationId);
    const previousSubscription = await this.billingRepository.getOrganizationSubscription(input.organizationId);

    if (!previousSubscription) {
      throw new IntegrationError("Nenhuma assinatura encontrada para esta organização.");
    }

    const plan = (await this.platformPlanRepository.findById(input.planId)) as any;
    const subscription = (await this.billingRepository.updateOrganizationSubscription(input.organizationId, {
      platform_plan_id: plan.id,
      notes: input.notes ?? previousSubscription.notes ?? null
    })) as any;

    await this.billingRepository.createSubscriptionAuditLog({
      organization_id: organization.id,
      admin_user_id: input.adminUserId,
      action: "change_plan",
      old_status: previousSubscription.status,
      new_status: subscription.status,
      notes: input.notes ?? `Plano alterado para ${plan.name}`
    });

    return subscription;
  }
}

export function isManualActivationSource(value: string): value is ManualActivationSource {
  return MANUAL_ACTIVATION_SOURCES.includes(value as ManualActivationSource);
}
