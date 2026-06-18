import { CreditCard, ExternalLink, Receipt } from "lucide-react";

import { EmptyStateCard } from "@/components/app/empty-state-card";
import { PageLayout } from "@/components/app/page-layout";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useBillingHistory } from "@/features/billing/use-billing-history";
import { useOrganizations } from "@/features/organizations/use-organizations";

function formatCurrency(value?: number | null) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format((value ?? 0) / 100);
}

function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function paymentBadge(status?: string | null) {
  switch (String(status ?? "").toLowerCase()) {
    case "received":
    case "confirmed":
      return <Badge variant="success">Confirmado</Badge>;
    case "overdue":
      return <Badge variant="danger">Vencido</Badge>;
    case "pending":
      return <Badge variant="warning">Pendente</Badge>;
    default:
      return <Badge variant="info">{status ?? "Sem status"}</Badge>;
  }
}

export function SubscriptionHistoryPage() {
  const { organizations } = useOrganizations();
  const organization = organizations[0];
  const { payments, loading, error } = useBillingHistory(organization?.id);

  return (
    <PageLayout
      title="Histórico de pagamentos"
      description="Acompanhe as cobranças já emitidas para o uso do GestorGram, com status real, vencimento e acesso ao checkout quando disponível."
      badge="Assinatura"
    >
      <Card className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Cobranças da plataforma</h2>
            <p className="mt-1 text-sm text-slate-500">
              Estado financeiro real do seu workspace, sem dados simulados.
            </p>
          </div>
          <Badge variant="dark">{payments.length} registro(s)</Badge>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-3 font-medium">Plano</th>
                <th className="pb-3 font-medium">Valor</th>
                <th className="pb-3 font-medium">Vencimento</th>
                <th className="pb-3 font-medium">Pagamento</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={index} className="border-b border-slate-100">
                    <td colSpan={6} className="py-4">
                      <Skeleton className="h-14 w-full rounded-2xl" />
                    </td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={6} className="py-6">
                    <EmptyStateCard
                      icon={Receipt}
                      title="Não foi possível carregar o histórico"
                      description={error}
                    />
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6">
                    <EmptyStateCard
                      icon={CreditCard}
                      title="Nenhuma cobrança registrada ainda"
                      description="Assim que uma cobrança da assinatura SaaS for emitida, ela aparecerá aqui com status, vencimento e atalho de regularização."
                    />
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-slate-100 text-slate-700">
                    <td className="py-4">
                      <div className="font-medium text-slate-900">
                        {payment.platform_plans?.name ?? "Plano da plataforma"}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        #{payment.asaas_payment_id ?? payment.id}
                      </div>
                    </td>
                    <td className="py-4">{formatCurrency(payment.amount_cents)}</td>
                    <td className="py-4 text-slate-500">{formatDate(payment.due_date)}</td>
                    <td className="py-4 text-slate-500">{formatDate(payment.paid_at)}</td>
                    <td className="py-4">{paymentBadge(payment.status)}</td>
                    <td className="py-4">
                      {payment.invoice_url ? (
                        <a
                          href={payment.invoice_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-200 hover:text-sky-700"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Abrir cobrança
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">Sem link disponível</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </PageLayout>
  );
}
