import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../types/database.js";
import { unwrapSupabase } from "../../lib/supabase-helpers.js";

type DatabaseClient = SupabaseClient<Database>;

export class BillingRepository {
  constructor(private readonly supabase: DatabaseClient) {}

  async listOrganizationSubscriptions() {
    const result = await (this.supabase as any)
      .from("organization_subscriptions")
      .select("*, platform_plans(*), organizations(id, name, slug, status, owner_user_id)")
      .order("created_at", { ascending: false });

    return unwrapSupabase(result, "Failed to load organization subscriptions");
  }

  async getOrganizationSubscription(organizationId: string) {
    const result = await (this.supabase as any)
      .from("organization_subscriptions")
      .select("*, platform_plans(*)")
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data;
  }

  async getOrganizationSubscriptionDetails(organizationId: string) {
    const subscriptionResult = await (this.supabase as any)
      .from("organization_subscriptions")
      .select("*, platform_plans(*), organizations(id, name, slug, status, owner_user_id)")
      .eq("organization_id", organizationId)
      .maybeSingle();

    const auditResult = await (this.supabase as any)
      .from("subscription_audit_logs")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(30);

    const latestPaymentResult = await (this.supabase as any)
      .from("organization_payments")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      subscription: unwrapSupabase(subscriptionResult, "Failed to load organization subscription"),
      auditLogs: unwrapSupabase(auditResult, "Failed to load subscription audit logs"),
      latestPayment: unwrapSupabase(latestPaymentResult, "Failed to load latest organization payment")
    };
  }

  async getLatestOrganizationPayment(organizationId: string) {
    const result = await (this.supabase as any)
      .from("organization_payments")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data;
  }

  async listOrganizationPayments(organizationId: string) {
    const result = await (this.supabase as any)
      .from("organization_payments")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(50);

    return unwrapSupabase(result, "Failed to load organization payment history");
  }

  async upsertOrganizationSubscription(
    input: Database["public"]["Tables"]["organization_subscriptions"]["Insert"]
  ) {
    const result = await (this.supabase as any)
      .from("organization_subscriptions")
      .upsert(input, { onConflict: "organization_id" })
      .select("*")
      .single();

    return unwrapSupabase(result, "Failed to save organization subscription");
  }

  async updateOrganizationSubscription(
    organizationId: string,
    input: Database["public"]["Tables"]["organization_subscriptions"]["Update"]
  ) {
    const result = await (this.supabase as any)
      .from("organization_subscriptions")
      .update(input)
      .eq("organization_id", organizationId)
      .select("*")
      .single();

    return unwrapSupabase(result, "Failed to update organization subscription");
  }

  async createOrganizationPayment(
    input: Database["public"]["Tables"]["organization_payments"]["Insert"]
  ) {
    const result = await (this.supabase as any)
      .from("organization_payments")
      .insert(input)
      .select("*")
      .single();

    return unwrapSupabase(result, "Failed to create organization payment");
  }

  async findOrganizationPaymentByAsaasPaymentId(asaasPaymentId: string) {
    const result = await (this.supabase as any)
      .from("organization_payments")
      .select("*")
      .eq("asaas_payment_id", asaasPaymentId)
      .maybeSingle();

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data;
  }

  async updateOrganizationPayment(
    id: string,
    input: Database["public"]["Tables"]["organization_payments"]["Update"]
  ) {
    const result = await (this.supabase as any)
      .from("organization_payments")
      .update(input)
      .eq("id", id)
      .select("*")
      .single();

    return unwrapSupabase(result, "Failed to update organization payment");
  }

  async createSubscriptionAuditLog(
    input: Database["public"]["Tables"]["subscription_audit_logs"]["Insert"]
  ) {
    const result = await (this.supabase as any)
      .from("subscription_audit_logs")
      .insert(input)
      .select("*")
      .single();

    return unwrapSupabase(result, "Failed to create subscription audit log");
  }
}
