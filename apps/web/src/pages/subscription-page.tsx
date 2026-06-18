import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Copy,
  CreditCard,
  ExternalLink,
  QrCode,
  RefreshCcw,
  ShieldAlert,
  Wallet
} from "lucide-react";

import { EmptyStateCard } from "@/components/app/empty-state-card";
import { PageLayout } from "@/components/app/page-layout";
import { StatCard } from "@/components/app/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useBillingSubscription } from "@/features/billing/use-billing-subscription";
import { usePlatformPlans } from "@/features/billing/use-platform-plans";
import {
  getSubscriptionCta,
  getSubscriptionStatusDescription,
  getSubscriptionStatusLabel
} from "@/features/organizations/access-control";
import { useOrganizations } from "@/features/organizations/use-organizations";
import { apiRequest } from "@/lib/api";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value / 100);
}

function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}

function formatDocument(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length <= 11) {
    return digits
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1-$2")
      .slice(0, 14);
  }

  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
    .slice(0, 18);
}

function paymentBadge(status?: string | null) {
  switch (String(status ?? "").toUpperCase()) {
    case "CONFIRMED":
    case "RECEIVED":
      return <Badge variant="success">Confirmado</Badge>;
    case "OVERDUE":
      return <Badge variant="danger">Vencido</Badge>;
    case "PENDING":
      return <Badge variant="warning">Pendente</Badge>;
    default:
      return <Badge variant="info">{status ?? "Sem status"}</Badge>;
  }
}

const planHighlights: Record<string, string[]> = {
  starter: ["Operação inicial", "Checkout Pix", "1 comunidade"],
  pro: ["Mais automações", "Moderação reforçada", "Mais controle"],
  scale: ["Múltiplas comunidades", "Estrutura de escala", "Time preparado"]
};

export function SubscriptionPage() {
  const { organizations, loading: organizationsLoading } = useOrganizations();
  const organization = organizations[0];
  const { plans, loading: plansLoading, error: plansError } = usePlatformPlans();
  const {
    subscription,
    latestPayment,
    loading: billingLoading,
    error: billingError,
    setLatestPayment
  } = useBillingSubscription(organization?.id);

  const [checkout, setCheckout] = useState<any>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [customerDocument, setCustomerDocument] = useState("");
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [submittingPlanId, setSubmittingPlanId] = useState<string | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const currentStatus = organization?.status ?? "pending_payment";
  const currentPlanId = subscription?.platform_plans?.id ?? latestPayment?.platform_plan_id ?? null;
  const activeCheckout = useMemo(() => checkout?.checkout ?? null, [checkout]);
  const canGenerateCharge = currentStatus !== "active";

  useEffect(() => {
    if (!latestPayment) {
      return;
    }

    setCheckout({
      payment: latestPayment,
      checkout: {
        id: latestPayment.asaas_payment_id,
        status: String(latestPayment.status ?? "").toUpperCase(),
        invoiceUrl: latestPayment.invoice_url ?? null,
        pixPayload: latestPayment.pix_payload ?? null,
        pixQrCodeImage: latestPayment.pix_qr_code_image ?? null
      }
    });
  }, [latestPayment]);

  useEffect(() => {
    if (!copyFeedback) {
      return;
    }

    const timeoutId = window.setTimeout(() => setCopyFeedback(null), 2500);
    return () => window.clearTimeout(timeoutId);
  }, [copyFeedback]);

  async function handleCheckout(platformPlanId: string) {
    if (!organization?.id) {
      setMessage("Nenhuma organização disponível para esta conta.");
      return;
    }

    const sanitizedDocument = customerDocument.replace(/\D/g, "");

    if (sanitizedDocument.length !== 11 && sanitizedDocument.length !== 14) {
      setMessage("Informe um CPF ou CNPJ válido para gerar a cobrança Pix.");
      return;
    }

    setSubmittingPlanId(platformPlanId);
    setMessage(null);

    try {
      const endpoint =
        currentStatus === "overdue" || currentStatus === "suspended" || currentStatus === "cancelled"
          ? "/api/billing/reactivate"
          : "/api/billing/checkout/pix";

      const payload = await apiRequest<any>(endpoint, {
        method: "POST",
        body: {
          organizationId: organization.id,
          platformPlanId,
          customerDocument: sanitizedDocument
        }
      });

      setCheckout(payload);
      setLatestPayment(payload.payment);
      setMessage("Cobrança Pix gerada com sucesso. A liberação acontece automaticamente após a confirmação.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao gerar a cobrança Pix.");
    } finally {
      setSubmittingPlanId(null);
    }
  }

  async function handleCopyPix() {
    if (!activeCheckout?.pixPayload) {
      setCopyFeedback("O código Pix ainda não está disponível nesta cobrança.");
      return;
    }

    try {
      await navigator.clipboard.writeText(activeCheckout.pixPayload);
      setCopyFeedback("Código Pix copiado com sucesso.");
    } catch {
      setCopyFeedback("Não foi possível copiar automaticamente o código Pix.");
    }
  }

  const heroDescription = organization
    ? getSubscriptionStatusDescription(currentStatus)
    : "Carregando status da organização...";

  return (
    <>
      <PageLayout
        title="Plano e pagamentos"
        description={heroDescription}
        badge="Billing"
        actions={
          organization ? (
            <>
              <Card className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-slate-50 shadow-none">
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Status</div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{getSubscriptionStatusLabel(currentStatus)}</span>
                  {paymentBadge(String(latestPayment?.status ?? currentStatus))}
                </div>
              </Card>
              <Card className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-slate-50 shadow-none">
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Plano atual</div>
                <div className="mt-1 text-sm font-medium text-white">
                  {subscription?.platform_plans?.name ?? "Ainda sem plano confirmado"}
                </div>
              </Card>
            </>
          ) : null
        }
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Wallet}
            label="Plano atual"
            value={subscription?.platform_plans?.name ?? "Sem plano ativo"}
            description="Plano registrado para este workspace"
          />
          <StatCard
            icon={CreditCard}
            label="Próximo vencimento"
            value={formatDate(latestPayment?.due_date ?? subscription?.current_period_end)}
            description="Próxima data crítica da assinatura"
          />
          <StatCard
            icon={CheckCircle2}
            label="Status da assinatura"
            value={getSubscriptionStatusLabel(currentStatus)}
            description={getSubscriptionCta(currentStatus)}
          />
          <StatCard
            icon={RefreshCcw}
            label="Última atualização"
            value={latestPayment?.status ? String(latestPayment.status).toUpperCase() : "Sem cobrança"}
            description="Webhook do Asaas atualiza a liberação"
          />
        </div>

        {billingError ? (
          <EmptyStateCard
            icon={ShieldAlert}
            title="Não foi possível carregar o status financeiro"
            description={billingError}
          />
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-4">
            {plansLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                  <Skeleton className="h-36 w-full rounded-2xl" />
                </Card>
              ))
            ) : plansError ? (
              <EmptyStateCard
                icon={CreditCard}
                title="Não foi possível carregar os planos"
                description={plansError}
              />
            ) : (
              plans.map((plan) => {
                const isCurrentPlan = currentPlanId === plan.id;

                return (
                  <Card
                    key={plan.id}
                    className={`rounded-[28px] border p-6 shadow-sm transition-all ${
                      isCurrentPlan
                        ? "border-sky-200 bg-[linear-gradient(180deg,_#ffffff_0%,_#f0f9ff_100%)] shadow-[0_18px_50px_rgba(14,165,233,0.12)]"
                        : "border-slate-200 bg-white hover:border-sky-200"
                    }`}
                  >
                    <div className="flex flex-col gap-6">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-2xl font-semibold text-slate-900">{plan.name}</h2>
                            {isCurrentPlan ? <Badge variant="success">Plano atual</Badge> : null}
                          </div>
                          <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
                            {plan.description ?? "Plano da plataforma GestorGram."}
                          </p>
                        </div>

                        <div className="rounded-3xl bg-slate-950 px-5 py-4 text-white">
                          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Assinatura</div>
                          <div className="mt-2 text-3xl font-semibold">{formatCurrency(plan.price_cents)}</div>
                          <div className="mt-1 text-xs text-slate-400">por mês</div>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        {(planHighlights[plan.code] ?? ["Gestão premium", "Checkout integrado", "Painel liberado"]).map((item) => (
                          <div
                            key={item}
                            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
                          >
                            {item}
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-col gap-4 border-t border-slate-200 pt-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="text-sm text-slate-500">
                          {canGenerateCharge
                            ? "Pagamento via Pix com regularização automática do painel."
                            : "Seu workspace já está ativo. Você pode trocar de plano quando precisar."}
                        </div>
                        <Button
                          className="min-w-44"
                          disabled={submittingPlanId === plan.id || organizationsLoading || billingLoading}
                          onClick={() => void handleCheckout(plan.id)}
                        >
                          {submittingPlanId === plan.id
                            ? "Gerando cobrança..."
                            : currentStatus === "active"
                              ? "Alterar plano"
                              : getSubscriptionCta(currentStatus)}
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>

          <Card className="rounded-[28px] border border-slate-800 bg-[linear-gradient(180deg,_rgba(11,20,37,0.96)_0%,_rgba(15,23,42,0.98)_100%)] p-6 text-slate-50 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Checkout</div>
                <h2 className="mt-2 text-xl font-semibold">Pagamento atual</h2>
              </div>
              {activeCheckout?.status ? paymentBadge(activeCheckout.status) : <Badge variant="dark">Sem cobrança</Badge>}
            </div>

            <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="text-sm font-medium text-white">
                {currentStatus === "active"
                  ? "Sua assinatura está ativa"
                  : "A liberação do painel acontece após a confirmação do Pix"}
              </div>
              <p className="mt-2 text-sm text-slate-400">{heroDescription}</p>
            </div>

            <div className="mt-5">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-300">CPF ou CNPJ do responsável</span>
                <input
                  value={customerDocument}
                  onChange={(event) => setCustomerDocument(formatDocument(event.target.value))}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-sky-400"
                  placeholder="Digite o documento para emissão"
                />
              </label>
            </div>

            {message ? (
              <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-300">
                {message}
              </div>
            ) : null}

            {activeCheckout ? (
              <div className="mt-6 space-y-4">
                <div className="grid gap-4 xl:grid-cols-[220px_1fr]">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                      <QrCode className="h-4 w-4" />
                      QR Code Pix
                    </div>
                    <div className="mt-4 flex min-h-[188px] items-center justify-center rounded-2xl bg-white p-3">
                      {activeCheckout.pixQrCodeImage ? (
                        <img
                          src={`data:image/png;base64,${activeCheckout.pixQrCodeImage}`}
                          alt="QR Code Pix"
                          className="h-44 w-44 rounded-xl object-contain"
                        />
                      ) : (
                        <div className="px-4 text-center text-sm text-slate-500">
                          QR Code ainda não retornado pelo provedor. Use o link da cobrança enquanto sincronizamos.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Pix copia e cola</div>
                      <textarea
                        readOnly
                        className="mt-3 min-h-32 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-200"
                        value={
                          activeCheckout.pixPayload ??
                          "O payload Pix ainda não foi retornado pelo Asaas para esta cobrança."
                        }
                      />
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button onClick={() => void handleCopyPix()}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copiar Pix
                      </Button>

                      {activeCheckout.invoiceUrl ? (
                        <>
                          <Button
                            variant="outline"
                            className="border-slate-700 text-slate-100 hover:bg-slate-800"
                            onClick={() => setIsInvoiceModalOpen(true)}
                          >
                            Abrir cobrança aqui
                          </Button>
                          <a
                            className="inline-flex items-center rounded-2xl border border-slate-700 px-4 py-3 text-sm font-medium text-slate-100"
                            href={activeCheckout.invoiceUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Abrir em nova aba
                          </a>
                        </>
                      ) : null}
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3">
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Plano</div>
                        <div className="mt-2 text-sm font-medium text-slate-100">
                          {subscription?.platform_plans?.name ?? "Plano selecionado"}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3">
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Documento</div>
                        <div className="mt-2 text-sm font-medium text-slate-100">
                          {customerDocument || "Não informado"}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3">
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Vencimento</div>
                        <div className="mt-2 text-sm font-medium text-slate-100">
                          {formatDate(latestPayment?.due_date)}
                        </div>
                      </div>
                    </div>

                    {copyFeedback ? (
                      <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-200">
                        {copyFeedback}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6">
                <EmptyStateCard
                  icon={CreditCard}
                  title="Nenhuma cobrança aberta neste momento"
                  description="Escolha um plano à esquerda para gerar uma cobrança Pix real. Quando o Asaas responder, o código e o QR aparecerão aqui."
                />
              </div>
            )}
          </Card>
        </div>
      </PageLayout>

      {isInvoiceModalOpen && activeCheckout?.invoiceUrl ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-sm">
          <div className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-800 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <div className="text-sm font-medium text-slate-500">Checkout Asaas</div>
                <div className="text-lg font-semibold text-slate-900">
                  Finalize o pagamento sem sair da página
                </div>
              </div>
              <div className="flex items-center gap-3">
                <a
                  className="inline-flex items-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                  href={activeCheckout.invoiceUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir em nova aba
                </a>
                <Button variant="outline" onClick={() => setIsInvoiceModalOpen(false)}>
                  Fechar
                </Button>
              </div>
            </div>
            <iframe
              src={activeCheckout.invoiceUrl}
              title="Checkout Asaas"
              className="h-full w-full bg-white"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
