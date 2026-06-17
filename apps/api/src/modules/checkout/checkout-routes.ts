import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";

import { paymentService } from "../../services/payments/payment-service.js";

const checkoutSchema = z.object({
  communityId: z.uuid(),
  planId: z.uuid(),
  customerId: z.string().min(3),
  customerName: z.string().min(3),
  amount: z.number().positive()
});

export const checkoutRoutes: FastifyPluginAsync = async (app) => {
  app.post("/public/checkout/pix", async (request, reply) => {
    const payload = checkoutSchema.parse(request.body);

    const payment = await paymentService.startPixCheckout({
      customerId: payload.customerId,
      amount: payload.amount,
      description: `Plano ${payload.planId} para comunidade ${payload.communityId}`,
      dueDate: new Date(Date.now() + 86_400_000).toISOString().slice(0, 10),
      externalReference: payload.customerName
    });

    return reply.code(201).send(payment);
  });
};

