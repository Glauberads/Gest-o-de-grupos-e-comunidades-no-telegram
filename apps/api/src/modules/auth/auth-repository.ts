import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../types/database.js";
import { unwrapSupabase } from "../../lib/supabase-helpers.js";

type DatabaseClient = SupabaseClient<Database>;

export class AuthRepository {
  constructor(private readonly supabase: DatabaseClient) {}

  async upsertUser(input: {
    id: string;
    email: string;
    fullName: string;
  }) {
    const result = await (this.supabase as any)
      .from("users")
      .upsert(
        {
          id: input.id,
          email: input.email,
          full_name: input.fullName,
          password_hash: "supabase-managed"
        },
        {
          onConflict: "id"
        }
      )
      .select("id, email, full_name")
      .single();

    return unwrapSupabase(result, "Failed to upsert user");
  }
}
