export const BILLING_BLOCKING_STATUSES = [
  "pending_payment",
  "overdue",
  "suspended",
  "cancelled"
] as const;

export type BillingBlockingStatus = (typeof BILLING_BLOCKING_STATUSES)[number];

export function isBillingBlockingStatus(status?: string | null): status is BillingBlockingStatus {
  return BILLING_BLOCKING_STATUSES.includes((status ?? "") as BillingBlockingStatus);
}

export function isOrganizationActive(status?: string | null) {
  return status === "active";
}

export function getSubscriptionStatusLabel(status?: string | null) {
  switch (status) {
    case "active":
      return "Ativo";
    case "pending_payment":
      return "Pagamento pendente";
    case "overdue":
      return "Pagamento vencido";
    case "suspended":
      return "Conta suspensa";
    case "cancelled":
      return "Assinatura cancelada";
    default:
      return "Em configuração";
  }
}

export function getSubscriptionStatusDescription(status?: string | null) {
  switch (status) {
    case "active":
      return "Seu painel está liberado para operar normalmente.";
    case "pending_payment":
      return "Conclua o pagamento da assinatura para liberar o painel completo.";
    case "overdue":
      return "Existe uma cobrança vencida. Gere uma nova regularização para retomar o acesso.";
    case "suspended":
      return "A conta foi suspensa até que a assinatura seja regularizada.";
    case "cancelled":
      return "A assinatura foi cancelada. Escolha um plano para reativar o workspace.";
    default:
      return "Finalize a configuração da sua organização para continuar.";
  }
}

export function getSubscriptionCta(status?: string | null) {
  switch (status) {
    case "pending_payment":
      return "Finalizar assinatura";
    case "overdue":
      return "Regularizar pagamento";
    case "suspended":
      return "Reativar conta";
    case "cancelled":
      return "Escolher novo plano";
    default:
      return "Ver assinatura";
  }
}
