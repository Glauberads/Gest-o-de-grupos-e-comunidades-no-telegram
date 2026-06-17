import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../types/database.js";
import { unwrapSupabase } from "../../lib/supabase-helpers.js";

type DatabaseClient = SupabaseClient<Database>;

export class PlanRepository {
  constructor(private readonly supabase: DatabaseClient) {}

  async create(input: Database["public"]["Tables"]["plans"]["Insert"]) {
    const result = await (this.supabase as any)
      .from("plans")
      .insert(input)
      .select("*")
      .single();

    return unwrapSupabase(result, "Failed to create plan");
  }

  async listByCommunity(organizationId: string, communityId: string) {
    const result = await (this.supabase as any)
      .from("plans")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("community_id", communityId)
      .order("price_cents", { ascending: true });

    return unwrapSupabase(result, "Failed to list plans");
  }
}
