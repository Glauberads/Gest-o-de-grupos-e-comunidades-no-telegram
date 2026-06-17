import { asaasClient } from "../../services/asaas/asaas-client.js";
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
      status: "pending_payment"
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

    const organizationPayment = await this.billingRepository.createOrganizationPayment({
      organization_id: organization.id,
      organization_subscription_id: subscription.id,
      platform_plan_id: plan.id,
      asaas_payment_id: payment.id,
      asaas_customer_id: customer.id,
      status: "pending",
      amount_cents: plan.price_cents,
      due_date: dueDate,
      pix_payload: payment.pixQrCode?.payload ?? null,
      pix_qr_code_image: payment.pixQrCode?.encodedImage ?? null,
      invoice_url: payment.invoiceUrl ?? null,
      external_reference: organization.id,
      raw_payload: payment
    });

    await this.organizationRepository.updateStatus(organization.id, "pending_payment");

    return {
      subscription,
      payment: organizationPayment,
      checkout: {
        id: payment.id,
        status: payment.status,
        invoiceUrl: payment.invoiceUrl ?? null,
        pixPayload: payment.pixQrCode?.payload ?? null,
        pixQrCodeImage: payment.pixQrCode?.encodedImage ?? null
      }
    };
  }

  async getSubscription(organizationId: string) {
    return this.billingRepository.getOrganizationSubscription(organizationId);
  }
}
