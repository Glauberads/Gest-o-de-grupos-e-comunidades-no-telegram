import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../types/database.js";
import { unwrapSupabase } from "../../lib/supabase-helpers.js";

type DatabaseClient = SupabaseClient<Database>;

export class BillingRepository {
  constructor(private readonly supabase: DatabaseClient) {}

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
}
