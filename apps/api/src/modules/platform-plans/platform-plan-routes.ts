import type { FastifyPluginAsync } from "fastify";

import { getSupabaseAdminClient } from "../../lib/supabase.js";
import { PlatformPlanRepository } from "./platform-plan-repository.js";

export const platformPlanRoutes: FastifyPluginAsync = async (app) => {
  app.get("/platform-plans", async (_request, reply) => {
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return reply.code(500).send({ message: "Supabase admin client is not configured" });
    }

    const plans = await new PlatformPlanRepository(supabase).listActive();

    return reply.code(200).send({ plans });
  });
};

