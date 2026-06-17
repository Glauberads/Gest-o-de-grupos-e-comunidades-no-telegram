import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../types/database.js";
import { unwrapSupabase } from "../../lib/supabase-helpers.js";

type DatabaseClient = SupabaseClient<Database>;
type OrganizationRecord = {
  id: string;
  name: string;
  slug: string;
  status: string;
  owner_user_id: string;
};

export class OrganizationRepository {
  constructor(private readonly supabase: DatabaseClient) {}

  async findByOwnerUserId(userId: string) {
    const result = await (this.supabase as any)
      .from("organizations")
      .select("id, name, slug, status, owner_user_id")
      .eq("owner_user_id", userId)
      .order("created_at", { ascending: true });

    return unwrapSupabase<OrganizationRecord[]>(
      result,
      "Failed to load organizations"
    );
  }

  async create(input: {
    ownerUserId: string;
    name: string;
    slug: string;
  }) {
    const organization = unwrapSupabase<OrganizationRecord>(
      await (this.supabase as any)
        .from("organizations")
        .insert({
          owner_user_id: input.ownerUserId,
          name: input.name,
          slug: input.slug
        })
        .select("id, name, slug, status, owner_user_id")
        .single(),
      "Failed to create organization"
    );

    await unwrapSupabase(
      await (this.supabase as any)
        .from("organization_users")
        .insert({
          organization_id: organization.id,
          user_id: input.ownerUserId,
          role: "owner"
        })
        .select("id")
        .single(),
      "Failed to link organization owner"
    );

    return organization;
  }

  async ensureMembership(organizationId: string, userId: string) {
    const result = await (this.supabase as any)
      .from("organization_users")
      .select("id, role")
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .single();

    return unwrapSupabase(result, "User is not allowed to access this organization");
  }
}
