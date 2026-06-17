import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: "apps/api/.env" });

const userId = process.argv[2];

if (!userId) {
  console.error("Usage: node scripts/set-super-admin.mjs <user-id>");
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in apps/api/.env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

if (userError || !userData.user) {
  console.error("Failed to load user:", userError?.message ?? "User not found");
  process.exit(1);
}

const nextAppMetadata = {
  ...(userData.user.app_metadata ?? {}),
  role: "super_admin",
  is_super_admin: true
};

const { data, error } = await supabase.auth.admin.updateUserById(userId, {
  app_metadata: nextAppMetadata
});

if (error) {
  console.error("Failed to update user:", error.message);
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      id: data.user.id,
      email: data.user.email,
      app_metadata: data.user.app_metadata
    },
    null,
    2
  )
);

