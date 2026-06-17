import { createHash, timingSafeEqual } from "node:crypto";

import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import { memberService } from "../members/member-service.js";

type AsaasEventPayload = {
  event: string;
  payment?: {
    id: string;
    status: string;
    externalReference?: string;
  };
};

export class WebhookService {
  validateAsaasToken(receivedToken?: string) {
    if (!env.ASAAS_WEBHOOK_TOKEN) {
      return true;
    }

    if (!receivedToken) {
      return false;
    }

    const expected = createHash("sha256").update(env.ASAAS_WEBHOOK_TOKEN).digest();
    const received = createHash("sha256").update(receivedToken).digest();

    return timingSafeEqual(expected, received);
  }

  async handleAsaasEvent(payload: AsaasEventPayload) {
    logger.info({ event: payload.event, paymentId: payload.payment?.id }, "Asaas webhook received");

    if (payload.event === "PAYMENT_CONFIRMED" || payload.event === "PAYMENT_RECEIVED") {
      await memberService.activateMember({
        chatId: "-1000000000000",
        memberName: payload.payment?.externalReference ?? "assinante"
      });
    }

    return {
      processed: true
    };
  }
}

export const webhookService = new WebhookService();

