import type { FastifyPluginAsync } from "fastify";

import { webhookService } from "../../services/webhooks/webhook-service.js";
import { getSupabaseAdminClient } from "../../lib/supabase.js";
import { AuditLogService } from "../../services/audit/audit-log-service.js";

export const webhookRoutes: FastifyPluginAsync = async (app) => {
  app.post("/webhooks/asaas", async (request, reply) => {
    const token = request.headers["asaas-access-token"];

    const validToken = webhookService.validateAsaasToken(
      Array.isArray(token) ? token[0] : token
    );

    if (!validToken) {
      const supabase = getSupabaseAdminClient();

      if (supabase) {
        await new AuditLogService(supabase).recordFromRequest(request, {
          actorType: "webhook",
          category: "security",
          action: "webhook_token_invalid",
          status: "failed",
          severity: "warning",
          message: "Tentativa de webhook com token inválido.",
          metadata: {
            provider: "asaas"
          }
        }).catch(() => undefined);
      }

      return reply.code(401).send({
        message: "Invalid webhook token"
      });
    }

    const result = await webhookService.handleAsaasEvent(request.body as never);

    return reply.code(202).send(result);
  });
};
