import { useState } from "react";
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

export function SubscriptionPage() {
  const { organizations, loading: organizationsLoading } = useOrganizations();
  const organization = organizations[0];
  const { plans, loading: plansLoading } = usePlatformPlans();
  const { subscription } = useBillingSubscription(organization?.id);
  const [checkout, setCheckout] = useState<any>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submittingPlanId, setSubmittingPlanId] = useState<string | null>(null);
  const [customerDocument, setCustomerDocument] = useState("");
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

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
                <Card key={plan.id} className="bg-white">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">{plan.name}</h2>
                      <p className="text-sm text-slate-500">{plan.description ?? "Plano SaaS para operacao da comunidade."}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-semibold text-slate-900">
                        {formatCurrency(plan.price_cents)}
                      </div>
                      <Button
                        className="mt-3"
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
                  onChange={(event) => setCustomerDocument(event.target.value)}
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

            {checkout ? (
              <div className="mt-6 space-y-4 text-sm">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-slate-400">Situacao do pagamento</div>
                      <div className="mt-1 text-base font-medium text-slate-100">
                        {paymentStatusLabel[checkout.checkout.status] ?? checkout.checkout.status}
                      </div>
                    </div>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${paymentStatusTone[checkout.checkout.status] ?? "border-slate-700 bg-slate-800 text-slate-200"}`}
                    >
                      {checkout.checkout.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-400">
                    Assim que o Asaas confirmar o Pix, sua organizacao sera liberada automaticamente.
                  </p>
                </div>
                <div>
                  <div className="text-slate-400">Pix copia e cola</div>
                  <textarea
                    readOnly
                    className="mt-2 min-h-32 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-200"
                    value={checkout.checkout.pixPayload ?? "Pix indisponivel no momento"}
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  {checkout.checkout.invoiceUrl ? (
                    <>
                      <Button
                        className="bg-sky-400 text-slate-950 hover:bg-sky-300"
                        onClick={() => setIsInvoiceModalOpen(true)}
                      >
                        Abrir cobranca aqui
                      </Button>
                      <a
                        className="inline-flex items-center rounded-xl border border-slate-700 px-4 py-3 font-medium text-slate-100"
                        href={checkout.checkout.invoiceUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Abrir em nova aba
                      </a>
                    </>
                  ) : (
                    <div className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-300">
                      O Asaas ainda nao retornou uma pagina de cobranca para abrir.
                    </div>
                  )}
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

      {isInvoiceModalOpen && checkout?.checkout?.invoiceUrl ? (
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
                  href={checkout.checkout.invoiceUrl}
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
              src={checkout.checkout.invoiceUrl}
              className="h-full w-full bg-white"
            />
          </div>
        </div>
      ) : null}
    </main>
  );
}
