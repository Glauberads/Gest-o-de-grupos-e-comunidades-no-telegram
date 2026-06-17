import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../types/database.js";
import { unwrapSupabase } from "../../lib/supabase-helpers.js";

type DatabaseClient = SupabaseClient<Database>;

export class CommunityRepository {
  constructor(private readonly supabase: DatabaseClient) {}

  async create(input: Database["public"]["Tables"]["communities"]["Insert"]) {
    const result = await (this.supabase as any)
      .from("communities")
      .insert(input)
      .select("*")
      .single();

    return unwrapSupabase(result, "Failed to create community");
  }

  async listByOrganization(organizationId: string) {
    const result = await (this.supabase as any)
      .from("communities")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    return unwrapSupabase(result, "Failed to list communities");
  }
}
