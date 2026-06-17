import { IntegrationError } from "../../lib/errors.js";
import { logger } from "../../lib/logger.js";
import { env } from "../../config/env.js";

type CreatePixPaymentInput = {
  customer: string;
  billingType: "PIX";
  value: number;
  dueDate: string;
  description: string;
  externalReference: string;
};

type CreateCustomerInput = {
  name: string;
  email?: string;
  cpfCnpj?: string;
  externalReference: string;
};

export class AsaasClient {
  async createCustomer(input: CreateCustomerInput) {
    if (!env.ASAAS_API_KEY) {
      logger.warn("Asaas API key not configured; returning mocked customer payload");

      return {
        id: `cus_${crypto.randomUUID()}`,
        ...input
      };
    }

    const response = await fetch(`${env.ASAAS_BASE_URL}/customers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        access_token: env.ASAAS_API_KEY
      },
      body: JSON.stringify(input)
    });

    if (!response.ok) {
      const body = await response.text();

      throw new IntegrationError("Failed to create Asaas customer", {
        status: response.status,
        body
      });
    }

    return response.json();
  }

  async createPixPayment(input: CreatePixPaymentInput) {
    if (!env.ASAAS_API_KEY) {
      logger.warn("Asaas API key not configured; returning mocked payment payload");

      return {
        id: `mocked_${crypto.randomUUID()}`,
        status: "PENDING",
        invoiceUrl: `${env.APP_URL}/checkout/mock`,
        pixQrCode: {
          encodedImage: "",
          payload: "00020101021226820014br.gov.bcb.pix..."
        },
        ...input
      };
    }

    const response = await fetch(`${env.ASAAS_BASE_URL}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        access_token: env.ASAAS_API_KEY
      },
      body: JSON.stringify(input)
    });

    if (!response.ok) {
      const body = await response.text();

      throw new IntegrationError("Failed to create Asaas Pix payment", {
        status: response.status,
        body
      });
    }

    return response.json();
  }
}

export const asaasClient = new AsaasClient();
