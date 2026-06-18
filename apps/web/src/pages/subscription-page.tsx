import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useBillingSubscription } from "@/features/billing/use-billing-subscription";
import { usePlatformPlans } from "@/features/billing/use-platform-plans";
import { useOrganizations } from "@/features/organizations/use-organizations";
import { apiRequest } from "@/lib/api";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value / 100);
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

export function SubscriptionPage() {
  const { organizations, loading: organizationsLoading } = useOrganizations();
  const organization = organizations[0];
  const { plans, loading: plansLoading } = usePlatformPlans();
  const { subscription, latestPayment, setLatestPayment } = useBillingSubscription(organization?.id);
  const [checkout, setCheckout] = useState<any>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submittingPlanId, setSubmittingPlanId] = useState<string | null>(null);
  const [customerDocument, setCustomerDocument] = useState("");
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  if (!organizationsLoading && organization?.status === "active") {
    return <Navigate to="/app" replace />;
  }

  async function handleCheckout(platformPlanId: string) {
    if (!organization?.id) {
      setMessage("Nenhuma organizacao encontrada para este usuario.");
      return;
    }

    const sanitizedDocument = customerDocument.replace(/\D/g, "");

    if (sanitizedDocument.length !== 11 && sanitizedDocument.length !== 14) {
      setMessage("Informe um CPF ou CNPJ valido para gerar a cobranca.");
      return;
    }

    setSubmittingPlanId(platformPlanId);
    setMessage(null);

    try {
      const payload = await apiRequest<any>("/api/billing/checkout/pix", {
        method: "POST",
        body: {
          organizationId: organization.id,
          platformPlanId,
          customerDocument: sanitizedDocument
        }
      });

      setCheckout(payload);
      setLatestPayment(payload.payment);
      setMessage("Cobranca Pix gerada com sucesso.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao gerar cobranca.");
    } finally {
      setSubmittingPlanId(null);
    }
  }

  const statusCopy: Record<string, string> = {
    pending_payment: "Aguardando pagamento para liberar o painel.",
    overdue: "Pagamento vencido. Regularize para continuar usando o sistema.",
    suspended: "Assinatura suspensa. Gere uma nova cobranca para reativar o acesso.",
    cancelled: "Assinatura cancelada. Escolha um plano para reativar.",
    trial: "Periodo de teste ativo."
  };

  const paymentStatusLabel: Record<string, string> = {
    PENDING: "Pagamento aguardando confirmacao",
    RECEIVED: "Pagamento recebido",
    CONFIRMED: "Pagamento confirmado",
    OVERDUE: "Pagamento vencido"
  };

  const paymentStatusTone: Record<string, string> = {
    PENDING: "border-amber-400/30 bg-amber-400/10 text-amber-200",
    RECEIVED: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
    CONFIRMED: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
    OVERDUE: "border-rose-400/30 bg-rose-400/10 text-rose-200"
  };

  const planHighlights: Record<string, string[]> = {
    starter: ["1 comunidade", "Checkout Pix", "Base de automacao"],
    pro: ["Mais automacoes", "Moderacao reforcada", "Operacao mais profissional"],
    scale: ["Multiplas comunidades", "Equipe e escala", "Estrutura para crescer"]
  };

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

  const activeCheckout = useMemo(() => checkout?.checkout ?? null, [checkout]);

  async function handleCopyPix() {
    if (!activeCheckout?.pixPayload) {
      setCopyFeedback("Pix ainda indisponivel.");
      return;
    }

    try {
      await navigator.clipboard.writeText(activeCheckout.pixPayload);
      setCopyFeedback("Pix copiado com sucesso.");
    } catch {
      setCopyFeedback("Nao foi possivel copiar automaticamente.");
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_35%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] px-6 py-10 text-slate-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Card className="border-slate-800 bg-slate-900 text-slate-50">
          <p className="text-sm uppercase tracking-[0.2em] text-sky-300">Assinatura SaaS</p>
          <h1 className="mt-4 text-4xl font-semibold">Libere o painel para operar sua comunidade</h1>
          <p className="mt-4 text-sm text-slate-300">
            {organization ? statusCopy[organization.status] ?? "Selecione um plano para continuar." : "Carregando sua organizacao..."}
          </p>
          {subscription?.platform_plans?.name ? (
            <p className="mt-3 text-sm text-slate-400">
              Plano atual da organizacao: {subscription.platform_plans.name}
            </p>
          ) : null}
        </Card>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="grid gap-4">
            {plansLoading ? (
              <Card className="bg-white">Carregando planos...</Card>
            ) : (
              plans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`overflow-hidden border transition-all ${
                    subscription?.platform_plans?.id === plan.id
                      ? "border-sky-300 bg-[linear-gradient(180deg,_#ffffff_0%,_#f0f9ff_100%)] shadow-[0_18px_50px_rgba(14,165,233,0.18)]"
                      : "border-slate-200 bg-white hover:border-sky-200 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
                  }`}
                >
                  <div className="flex h-full flex-col gap-5 p-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-2xl font-semibold text-slate-900">{plan.name}</h2>
                          {subscription?.platform_plans?.id === plan.id ? (
                            <span className="rounded-full border border-sky-300 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700">
                              Plano atual
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
                          {plan.description ?? "Plano SaaS para operacao da comunidade."}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-950 px-4 py-3 text-right text-white shadow-lg">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                          Assinatura
                        </div>
                        <div className="mt-1 text-3xl font-semibold">
                          {formatCurrency(plan.price_cents)}
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                          por mes
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      {(planHighlights[plan.code] ?? ["Setup inicial", "Checkout integrado", "Painel liberado"]).map((item) => (
                        <div
                          key={item}
                          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
                        >
                          {item}
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                      <div className="text-sm text-slate-500">
                        Pagamento via Pix com liberacao automatica do painel.
                      </div>
                      <Button
                        className="min-w-40 bg-sky-500 text-white hover:bg-sky-600"
                        disabled={submittingPlanId === plan.id || organizationsLoading}
                        onClick={() => {
                          void handleCheckout(plan.id);
                        }}
                      >
                        {submittingPlanId === plan.id ? "Gerando Pix..." : "Assinar com Pix"}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          <Card className="border-slate-800 bg-slate-900 text-slate-50">
            <h2 className="text-xl font-semibold">Pagamento atual</h2>
            <p className="mt-2 text-sm text-slate-400">
              Gere o pagamento Pix e aguarde a confirmacao do webhook do Asaas para liberar o painel.
            </p>

            <div className="mt-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-300">CPF ou CNPJ do responsavel</span>
                <input
                  value={customerDocument}
                  onChange={(event) => setCustomerDocument(formatDocument(event.target.value))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400"
                  placeholder="Digite apenas numeros ou com pontuacao"
                />
              </label>
            </div>

            {message ? (
              <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300">
                {message}
              </div>
            ) : null}

            {activeCheckout ? (
              <div className="mt-6 space-y-4 text-sm">
                <div className="rounded-3xl border border-slate-800 bg-[linear-gradient(180deg,_rgba(15,23,42,0.96)_0%,_rgba(2,6,23,0.98)_100%)] p-5 shadow-[0_20px_60px_rgba(2,6,23,0.45)]">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="text-xs uppercase tracking-[0.22em] text-sky-300">
                        Checkout inteligente
                      </div>
                      <div className="mt-2 text-lg font-medium text-slate-100">
                        {paymentStatusLabel[activeCheckout.status] ?? activeCheckout.status}
                      </div>
                      <p className="mt-2 max-w-md text-sm text-slate-400">
                        Pague com Pix e acompanhe a liberacao do painel em tempo real, sem sair desta tela.
                      </p>
                    </div>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${paymentStatusTone[activeCheckout.status] ?? "border-slate-700 bg-slate-800 text-slate-200"}`}
                    >
                      {activeCheckout.status}
                    </span>
                  </div>
                  <div className="mt-5 grid gap-4 xl:grid-cols-[220px_1fr]">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        QR Code Pix
                      </div>
                      <div className="mt-3 flex min-h-[188px] items-center justify-center rounded-2xl bg-white p-3">
                        {activeCheckout.pixQrCodeImage ? (
                          <img
                            src={`data:image/png;base64,${activeCheckout.pixQrCodeImage}`}
                            alt="QR Code Pix"
                            className="h-44 w-44 rounded-xl object-contain"
                          />
                        ) : (
                          <div className="px-4 text-center text-sm text-slate-500">
                            QR Code ainda nao disponivel.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950 p-4">
                      <div>
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                          Pix copia e cola
                        </div>
                        <textarea
                          readOnly
                          className="mt-3 min-h-32 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-200"
                          value={activeCheckout.pixPayload ?? "Pix indisponivel no momento"}
                        />
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Button
                          className="bg-sky-400 text-slate-950 hover:bg-sky-300"
                          onClick={() => {
                            void handleCopyPix();
                          }}
                        >
                          Copiar Pix
                        </Button>

                        {activeCheckout.invoiceUrl ? (
                          <>
                            <Button
                              variant="outline"
                              className="border-slate-700 text-slate-100 hover:bg-slate-800"
                              onClick={() => setIsInvoiceModalOpen(true)}
                            >
                              Abrir cobranca aqui
                            </Button>
                            <a
                              className="inline-flex items-center rounded-xl border border-slate-700 px-4 py-3 font-medium text-slate-100"
                              href={activeCheckout.invoiceUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
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
                            {customerDocument || "Nao informado"}
                          </div>
                        </div>
                        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3">
                          <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Atualizacao</div>
                          <div className="mt-2 text-sm font-medium text-slate-100">
                            Automatica a cada 15s
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
              </div>
            ) : (
              <div className="mt-6 rounded-xl border border-dashed border-slate-700 px-4 py-8 text-sm text-slate-400">
                Nenhuma cobranca gerada ainda.
              </div>
            )}
          </Card>
        </section>
      </div>

      {isInvoiceModalOpen && activeCheckout?.invoiceUrl ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-sm">
          <div className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-800 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <div className="text-sm font-medium text-slate-500">Checkout Asaas</div>
                <div className="text-lg font-semibold text-slate-900">
                  Finalize seu pagamento sem sair da pagina
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
              title="Checkout Asaas"
              src={activeCheckout.invoiceUrl}
              className="h-full w-full bg-white"
            />
          </div>
        </div>
      ) : null}
    </main>
  );
}
