import { asaasClient } from "../asaas/asaas-client.js";

type StartPixCheckoutInput = {
  customerId: string;
  amount: number;
  description: string;
  dueDate: string;
  externalReference: string;
};

export class PaymentService {
  async startPixCheckout(input: StartPixCheckoutInput) {
    return asaasClient.createPixPayment({
      customer: input.customerId,
      billingType: "PIX",
      value: input.amount,
      description: input.description,
      dueDate: input.dueDate,
      externalReference: input.externalReference
    });
  }
}

export const paymentService = new PaymentService();

