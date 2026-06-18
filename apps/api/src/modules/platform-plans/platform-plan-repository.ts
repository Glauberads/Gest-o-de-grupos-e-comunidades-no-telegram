import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../types/database.js";
import { unwrapSupabase } from "../../lib/supabase-helpers.js";

type DatabaseClient = SupabaseClient<Database>;

export class PlatformPlanRepository {
  constructor(private readonly supabase: DatabaseClient) {}

  async listActive() {
    const result = await (this.supabase as any)
      .from("platform_plans")
      .select("*")
      .eq("status", "active")
      .is("archived_at", null)
      .order("sort_order", { ascending: true })
      .order("price_cents", { ascending: true });

    return unwrapSupabase(result, "Failed to list platform plans");
  }

  async listAll() {
    const result = await (this.supabase as any)
      .from("platform_plans")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    return unwrapSupabase(result, "Failed to list platform plans");
  }

  async findById(id: string) {
    const result = await (this.supabase as any)
      .from("platform_plans")
      .select("*")
      .eq("id", id)
      .single();

    return unwrapSupabase(result, "Failed to load platform plan");
  }

  async findBySlug(slug: string) {
    const result = await (this.supabase as any)
      .from("platform_plans")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    return unwrapSupabase(result, "Failed to load platform plan by slug");
  }

  async create(input: Database["public"]["Tables"]["platform_plans"]["Insert"]) {
    const result = await (this.supabase as any)
      .from("platform_plans")
      .insert(input)
      .select("*")
      .single();

    return unwrapSupabase(result, "Failed to create platform plan");
  }

  async update(id: string, input: Database["public"]["Tables"]["platform_plans"]["Update"]) {
    const result = await (this.supabase as any)
      .from("platform_plans")
      .update(input)
      .eq("id", id)
      .select("*")
      .single();

    return unwrapSupabase(result, "Failed to update platform plan");
  }

  async delete(id: string) {
    const result = await (this.supabase as any)
      .from("platform_plans")
      .delete()
      .eq("id", id)
      .select("id")
      .single();

    return unwrapSupabase(result, "Failed to delete platform plan");
  }

  async archive(id: string) {
    const result = await (this.supabase as any)
      .from("platform_plans")
      .update({
        status: "archived",
        archived_at: new Date().toISOString()
      })
      .eq("id", id)
      .select("*")
      .single();

    return unwrapSupabase(result, "Failed to archive platform plan");
  }

  async restore(id: string) {
    const result = await (this.supabase as any)
      .from("platform_plans")
      .update({
        status: "inactive",
        archived_at: null
      })
      .eq("id", id)
      .select("*")
      .single();

    return unwrapSupabase(result, "Failed to restore platform plan");
  }

  async countLinkedSubscriptions(planId: string) {
    const result = await (this.supabase as any)
      .from("organization_subscriptions")
      .select("id", { head: true, count: "exact" })
      .eq("platform_plan_id", planId);

    return ((unwrapSupabase(result, "Failed to count linked subscriptions") as any)?.count ?? 0) as number;
  }

  async createAdminAuditLog(input: Database["public"]["Tables"]["admin_audit_logs"]["Insert"]) {
    const result = await (this.supabase as any)
      .from("admin_audit_logs")
      .insert(input)
      .select("id")
      .single();

    return unwrapSupabase(result, "Failed to create admin audit log");
  }

  async slugExists(slug: string, excludingPlanId?: string) {
    let query = (this.supabase as any).from("platform_plans").select("id").eq("slug", slug);

    if (excludingPlanId) {
      query = query.neq("id", excludingPlanId);
    }

    const result = await query.maybeSingle();
    return Boolean(unwrapSupabase(result, "Failed to validate platform plan slug"));
  }

  async codeExists(code: string, excludingPlanId?: string) {
    let query = (this.supabase as any).from("platform_plans").select("id").eq("code", code);

    if (excludingPlanId) {
      query = query.neq("id", excludingPlanId);
    }

    const result = await query.maybeSingle();
    return Boolean(unwrapSupabase(result, "Failed to validate platform plan code"));
  }
}
