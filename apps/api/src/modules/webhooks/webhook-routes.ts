import type { FastifyPluginAsync } from "fastify";

import { webhookService } from "../../services/webhooks/webhook-service.js";

export const webhookRoutes: FastifyPluginAsync = async (app) => {
  app.post("/webhooks/asaas", async (request, reply) => {
    const token = request.headers["asaas-access-token"];

    const validToken = webhookService.validateAsaasToken(
      Array.isArray(token) ? token[0] : token
    );

    if (!validToken) {
      return reply.code(401).send({
        message: "Invalid webhook token"
      });
    }

    const result = await webhookService.handleAsaasEvent(request.body as never);

    return reply.code(202).send(result);
  });
};

