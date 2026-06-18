import { createHash, timingSafeEqual } from "node:crypto";

import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import { getSupabaseAdminClient } from "../../lib/supabase.js";

function addDaysIso(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

type AsaasEventPayload = {
  event: string;
  payment?: {
    customer?: string;
    dateCreated?: string;
    dueDate?: string;
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

    const supabase = getSupabaseAdminClient();

    if (!supabase || !payload.payment?.id) {
      return {
        processed: false
      };
    }

    const providerEventId = `${payload.event}:${payload.payment.id}`;
    const existingEvent = await (supabase as any)
      .from("webhook_events")
      .select("id")
      .eq("provider", "asaas")
      .eq("provider_event_id", providerEventId)
      .maybeSingle();

    if (existingEvent.data?.id) {
      return {
        processed: true,
        duplicate: true
      };
    }

    await (supabase as any).from("webhook_events").insert({
      provider: "asaas",
      provider_event_id: providerEventId,
      event_type: payload.event,
      payload,
      status: "received"
    });

    const payment = await (supabase as any)
      .from("organization_payments")
      .select("*")
      .eq("asaas_payment_id", payload.payment.id)
      .maybeSingle();

    if (!payment.data?.id) {
      return {
        processed: true,
        orphaned: true
      };
    }

    if (payload.event === "PAYMENT_CONFIRMED" || payload.event === "PAYMENT_RECEIVED") {
      await (supabase as any)
        .from("organization_payments")
        .update({
          status: payload.event === "PAYMENT_RECEIVED" ? "received" : "confirmed",
          paid_at: new Date().toISOString(),
          raw_payload: payload
        })
        .eq("id", payment.data.id);

      await (supabase as any)
        .from("organization_subscriptions")
        .update({
          status: "active",
          started_at: new Date().toISOString(),
          current_period_start: new Date().toISOString(),
          current_period_end: addDaysIso(30),
          active_until: addDaysIso(30),
          grace_period_ends_at: null,
          activation_source: "asaas",
          lifetime: false
        })
        .eq("id", payment.data.organization_subscription_id);

      await (supabase as any)
        .from("organizations")
        .update({ status: "active" })
        .eq("id", payment.data.organization_id);
    }

    if (payload.event === "PAYMENT_OVERDUE") {
      await (supabase as any)
        .from("organization_payments")
        .update({
          status: "overdue",
          raw_payload: payload
        })
        .eq("id", payment.data.id);

      await (supabase as any)
        .from("organization_subscriptions")
        .update({
          status: "overdue",
          grace_period_ends_at: addDaysIso(3)
        })
        .eq("id", payment.data.organization_subscription_id);

      await (supabase as any)
        .from("organizations")
        .update({ status: "overdue" })
        .eq("id", payment.data.organization_id);
    }

    if (payload.event === "PAYMENT_REFUNDED" || payload.event === "PAYMENT_DELETED") {
      await (supabase as any)
        .from("organization_payments")
        .update({
          status: payload.event === "PAYMENT_REFUNDED" ? "refunded" : "cancelled",
          raw_payload: payload
        })
        .eq("id", payment.data.id);

      await (supabase as any)
        .from("organization_subscriptions")
        .update({
          status: payload.event === "PAYMENT_REFUNDED" ? "cancelled" : "suspended",
          cancelled_at: new Date().toISOString()
        })
        .eq("id", payment.data.organization_subscription_id);

      await (supabase as any)
        .from("organizations")
        .update({
          status: payload.event === "PAYMENT_REFUNDED" ? "cancelled" : "suspended"
        })
        .eq("id", payment.data.organization_id);
    }

    await (supabase as any)
      .from("webhook_events")
      .update({
        processed_at: new Date().toISOString(),
        status: "processed"
      })
      .eq("provider", "asaas")
      .eq("provider_event_id", providerEventId);

    return {
      processed: true
    };
  }
}

export const webhookService = new WebhookService();
