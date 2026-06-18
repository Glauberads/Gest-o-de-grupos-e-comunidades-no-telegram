import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../types/database.js";
import { unwrapSupabase } from "../../lib/supabase-helpers.js";

type DatabaseClient = SupabaseClient<Database>;

export class TelegramGroupRepository {
  constructor(private readonly supabase: DatabaseClient) {}

  async upsert(input: Database["public"]["Tables"]["telegram_groups"]["Insert"]) {
    const result = await (this.supabase as any)
      .from("telegram_groups")
      .upsert(input, { onConflict: "organization_id,telegram_chat_id" })
      .select("*")
      .single();

    return unwrapSupabase(result, "Failed to save Telegram group");
  }

  async listByOrganization(organizationId: string) {
    const result = await (this.supabase as any)
      .from("telegram_groups")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    return unwrapSupabase(result, "Failed to list Telegram groups");
  }

  async findById(groupId: string) {
    const result = await (this.supabase as any)
      .from("telegram_groups")
      .select("*")
      .eq("id", groupId)
      .maybeSingle();

    return unwrapSupabase(result, "Failed to load Telegram group");
  }
}
