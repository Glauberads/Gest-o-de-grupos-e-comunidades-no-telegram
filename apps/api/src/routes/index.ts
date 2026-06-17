import type { FastifyPluginAsync } from "fastify";

import { authRoutes } from "../modules/auth/auth-routes.js";
import { checkoutRoutes } from "../modules/checkout/checkout-routes.js";
import { communityRoutes } from "../modules/communities/community-routes.js";
import { healthRoutes } from "../modules/health/health-routes.js";
import { organizationRoutes } from "../modules/organizations/organization-routes.js";
import { planRoutes } from "../modules/plans/plan-routes.js";
import { webhookRoutes } from "../modules/webhooks/webhook-routes.js";

export const appRoutes: FastifyPluginAsync = async (app) => {
  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: "/api" });
  await app.register(organizationRoutes, { prefix: "/api" });
  await app.register(communityRoutes, { prefix: "/api" });
  await app.register(planRoutes, { prefix: "/api" });
  await app.register(checkoutRoutes, { prefix: "/api" });
  await app.register(webhookRoutes, { prefix: "/api" });
};
