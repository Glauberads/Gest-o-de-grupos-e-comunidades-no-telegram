import { CreditCard, Layers3, ShieldCheck } from "lucide-react";

import { EmptyStateCard } from "@/components/app/empty-state-card";
import { PageLayout } from "@/components/app/page-layout";
import { StatCard } from "@/components/app/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { usePlatformPlans } from "@/features/billing/use-platform-plans";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value / 100);
}

export function AdminPlansPage() {
  const { plans, loading } = usePlatformPlans();

  return (
    <PageLayout
      title="Administração da plataforma"
      description="Área premium para super admin acompanhar os planos SaaS e a estrutura global da oferta."
      badge="Admin"
      badgeVariant="warning"
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard
          icon={CreditCard}
          label="Planos SaaS"
          value={String(plans.length)}
          description="Catálogo disponível na plataforma"
        />
        <StatCard
          icon={Layers3}
          label="Estrutura"
          value="Centralizada"
          description="Arquitetura pronta para expansão do CRUD"
        />
        <StatCard
          icon={ShieldCheck}
          label="Acesso"
          value="Super admin"
          description="Visão reservada à operação global"
        />
      </div>

      <Card className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Planos cadastrados</h2>
            <p className="mt-1 text-sm text-slate-500">
              Esta visão já mostra o inventário atual do produto, sem abrir novas funcionalidades.
            </p>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-3 font-medium">Plano</th>
                <th className="pb-3 font-medium">Código</th>
                <th className="pb-3 font-medium">Preço</th>
                <th className="pb-3 font-medium">Intervalo</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-6 text-slate-500">
                    Carregando planos...
                  </td>
                </tr>
              ) : (
                plans.map((plan) => (
                  <tr key={plan.id} className="border-b border-slate-100 text-slate-700">
                    <td className="py-4">
                      <div className="font-medium text-slate-900">{plan.name}</div>
                      <div className="text-xs text-slate-500">{plan.description}</div>
                    </td>
                    <td className="py-4 uppercase">{plan.code}</td>
                    <td className="py-4">{formatCurrency(plan.price_cents)}</td>
                    <td className="py-4 capitalize">{plan.billing_interval}</td>
                    <td className="py-4">
                      <Badge variant={plan.status === "active" ? "success" : "default"}>
                        {plan.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <EmptyStateCard
        icon={Layers3}
        title="Usuários, organizações e pagamentos ficarão neste mesmo padrão visual"
        description="A navegação administrativa já está agrupada. O próximo passo natural será plugar as listagens reais mantendo o mesmo design system."
      />
    </PageLayout>
  );
}
