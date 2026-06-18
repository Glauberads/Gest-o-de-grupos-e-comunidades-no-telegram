import { asaasClient } from "../../services/asaas/asaas-client.js";
import { logger } from "../../lib/logger.js";
import { BillingRepository } from "./billing-repository.js";
import { OrganizationRepository } from "../organizations/organization-repository.js";
import { PlatformPlanRepository } from "../platform-plans/platform-plan-repository.js";

function addDaysIso(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export class BillingService {
  constructor(
    private readonly billingRepository: BillingRepository,
    private readonly organizationRepository: OrganizationRepository,
    private readonly platformPlanRepository: PlatformPlanRepository
  ) {}

  async createPixCheckout(input: {
    organizationId: string;
    platformPlanId: string;
    customerEmail?: string;
    customerDocument: string;
  }) {
    const organization = await this.organizationRepository.findById(input.organizationId);
    const plan = (await this.platformPlanRepository.findById(input.platformPlanId)) as any;

    const subscription = (await this.billingRepository.upsertOrganizationSubscription({
      organization_id: organization.id,
      platform_plan_id: plan.id,
      status: "pending_payment",
      activation_source: "asaas",
      lifetime: false,
      active_until: null,
      notes: null
    })) as any;

    const customer = await asaasClient.createCustomer({
      name: organization.name,
      email: input.customerEmail,
      cpfCnpj: input.customerDocument,
      externalReference: organization.id
    });

    const dueDate = addDaysIso(1);
    const payment = await asaasClient.createPixPayment({
      customer: customer.id,
      billingType: "PIX",
      value: plan.price_cents / 100,
      dueDate,
      description: `Assinatura SaaS ${plan.name}`,
      externalReference: organization.id
    });

    let pixQrCode: { payload?: string | null; encodedImage?: string | null } | null =
      payment.pixQrCode ?? null;

    if (!pixQrCode?.payload || !pixQrCode?.encodedImage) {
      try {
        pixQrCode = await asaasClient.getPixQrCode(payment.id);
      } catch (error) {
        logger.warn(
          {
            error,
            paymentId: payment.id
          },
          "Failed to enrich payment with Asaas Pix QR code"
        );
      }
    }

    const organizationPayment = await this.billingRepository.createOrganizationPayment({
      organization_id: organization.id,
      organization_subscription_id: subscription.id,
      platform_plan_id: plan.id,
      asaas_payment_id: payment.id,
      asaas_customer_id: customer.id,
      status: "pending",
      amount_cents: plan.price_cents,
      due_date: dueDate,
      activation_source: "asaas",
      pix_payload: pixQrCode?.payload ?? null,
      pix_qr_code_image: pixQrCode?.encodedImage ?? null,
      invoice_url: payment.invoiceUrl ?? null,
      external_reference: organization.id,
      raw_payload: {
        payment,
        pixQrCode
      }
    });

    await this.organizationRepository.updateStatus(organization.id, "pending_payment");

    return {
      subscription,
      payment: organizationPayment,
      checkout: {
        id: payment.id,
        status: payment.status,
        invoiceUrl: payment.invoiceUrl ?? null,
        pixPayload: pixQrCode?.payload ?? null,
        pixQrCodeImage: pixQrCode?.encodedImage ?? null
      }
    };
  }

  async getSubscription(organizationId: string) {
    const subscription = await this.billingRepository.getOrganizationSubscription(organizationId);
    let latestPayment = await this.billingRepository.getLatestOrganizationPayment(organizationId);

    if (
      latestPayment?.asaas_payment_id &&
      (!latestPayment.pix_payload || !latestPayment.pix_qr_code_image) &&
      latestPayment.status === "pending"
    ) {
      try {
        const pixQrCode = await asaasClient.getPixQrCode(latestPayment.asaas_payment_id);

        latestPayment = await this.billingRepository.updateOrganizationPayment(latestPayment.id, {
          pix_payload: pixQrCode.payload,
          pix_qr_code_image: pixQrCode.encodedImage,
          raw_payload: {
            ...(typeof latestPayment.raw_payload === "object" &&
            latestPayment.raw_payload !== null &&
            !Array.isArray(latestPayment.raw_payload)
              ? latestPayment.raw_payload
              : {}),
            pixQrCode
          }
        });
      } catch (error) {
        logger.warn(
          {
            error,
            paymentId: latestPayment.asaas_payment_id
          },
          "Failed to backfill Pix QR code for latest payment"
        );
      }
    }

    return {
      subscription,
      latestPayment
    };
  }
}
