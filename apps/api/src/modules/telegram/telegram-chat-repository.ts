import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../types/database.js";
import { unwrapSupabase } from "../../lib/supabase-helpers.js";

type DatabaseClient = SupabaseClient<Database>;

export class TelegramChatRepository {
  constructor(private readonly supabase: DatabaseClient) {}

  async upsert(input: Database["public"]["Tables"]["telegram_chats"]["Insert"]) {
    const result = await (this.supabase as any)
      .from("telegram_chats")
      .upsert(input, {
        onConflict: "community_id,telegram_chat_id"
      })
      .select("*")
      .single();

    return unwrapSupabase(result, "Failed to save Telegram chat settings");
  }

  async findByCommunity(organizationId: string, communityId: string) {
    const result = await (this.supabase as any)
      .from("telegram_chats")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("community_id", communityId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data;
  }
}

