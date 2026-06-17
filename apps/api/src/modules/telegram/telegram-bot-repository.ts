import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../types/database.js";
import { unwrapSupabase } from "../../lib/supabase-helpers.js";

type DatabaseClient = SupabaseClient<Database>;

export class TelegramBotRepository {
  constructor(private readonly supabase: DatabaseClient) {}

  async upsert(input: Database["public"]["Tables"]["telegram_bots"]["Insert"]) {
    const result = await (this.supabase as any)
      .from("telegram_bots")
      .upsert(input, { onConflict: "organization_id" })
      .select("*")
      .single();

    return unwrapSupabase(result, "Failed to save Telegram bot");
  }

  async findByOrganization(organizationId: string) {
    const result = await (this.supabase as any)
      .from("telegram_bots")
      .select("*")
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data;
  }
}

