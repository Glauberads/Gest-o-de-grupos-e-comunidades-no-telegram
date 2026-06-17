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
      .order("price_cents", { ascending: true });

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
}

