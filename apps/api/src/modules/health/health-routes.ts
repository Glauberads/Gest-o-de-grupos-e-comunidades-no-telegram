import type { FastifyPluginAsync } from "fastify";

import { env, envFlags } from "../../config/env.js";
import { getSupabaseAdminClient } from "../../lib/supabase.js";

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get("/health", async () => {
    const now = new Date().toISOString();
    const supabase = getSupabaseAdminClient();

    let supabaseStatus: "ok" | "degraded" | "missing" = "missing";

    if (supabase) {
      try {
        const response = await (supabase as any)
          .from("platform_plans")
          .select("id", { head: true, count: "exact" })
          .limit(1);

        supabaseStatus = response.error ? "degraded" : "ok";
      } catch {
        supabaseStatus = "degraded";
      }
    }

    const integrations = {
      supabaseAdmin: envFlags.hasSupabaseUrl && envFlags.hasSupabaseServiceRoleKey,
      asaas: envFlags.hasAsaasApiKey,
      telegram: envFlags.hasTelegramBotToken
    };

    const overallStatus =
      supabaseStatus === "ok" && integrations.supabaseAdmin ? "ok" : "degraded";

    return {
      status: overallStatus,
      service: "gestor-api",
      env: env.NODE_ENV,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: now,
      app: {
        allowedOrigins: env.APP_URLS ? env.APP_URLS.split(",").length : 1
      },
      integrations: {
        supabase: supabaseStatus,
        asaas: integrations.asaas ? "configured" : "missing",
        telegram: integrations.telegram ? "configured" : "missing"
      }
    };
  });
};
