import { Building2, CreditCard, ShieldCheck, Users, Wallet, Workflow } from "lucide-react";

import { EmptyStateCard } from "@/components/app/empty-state-card";
import { PageLayout } from "@/components/app/page-layout";
import { StatCard } from "@/components/app/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminOrganizations } from "@/features/admin/use-admin-organizations";
import { useAdminUsers } from "@/features/admin/use-admin-users";
import { useAuth } from "@/features/auth/use-auth";
import { usePlatformPlans } from "@/features/billing/use-platform-plans";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value / 100);
}

export function AdminPlatformDashboardPage() {
  const { session } = useAuth();
  const isSuperAdmin = session?.user.app_metadata?.is_super_admin === true;
  const { plans, loading, error: plansError } = usePlatformPlans();
  const {
    organizations,
    loading: organizationsLoading,
    error: organizationsError
  } = useAdminOrganizations(isSuperAdmin);
  const { users, loading: usersLoading, error: usersError } = useAdminUsers(isSuperAdmin);

  const activePlans = plans.filter((plan) => plan.status === "active").length;
  const cheapestPlan = plans.length > 0 ? Math.min(...plans.map((plan) => plan.price_cents)) : 0;
  const adminName =
    (session?.user.user_metadata.full_name as string | undefined) ??
    session?.user.email ??
    "Super admin";
  const isLoading = loading || organizationsLoading || usersLoading;
  const hasError = plansError || organizationsError || usersError;

  return (
    <PageLayout
      title="Central da plataforma"
      description={`Olá, ${adminName}. Esta é a visão global do GestorGram para super admin — focada em catálogo, tenants e operação da plataforma, sem misturar a cobrança do tenant na home.`}
      badge="Admin"
      badgeVariant="warning"
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="rounded-[28px] border border-slate-200 bg-white p-5">
              <Skeleton className="h-24 w-full rounded-2xl" />
            </Card>
          ))
        ) : (
          <>
            <StatCard
              icon={Building2}
              label="Organizações"
              value={String(organizations.length)}
              description="Tenants visíveis no escopo global"
            />
            <StatCard
              icon={Users}
              label="Usuários"
              value={String(users.length)}
              description="Contas carregadas no backend"
            />
            <StatCard
              icon={CreditCard}
              label="Planos ativos"
              value={String(activePlans)}
              description="Oferta SaaS atualmente habilitada"
            />
            <StatCard
              icon={Wallet}
              label="Ticket inicial"
              value={cheapestPlan ? formatCurrency(cheapestPlan) : "R$ 0,00"}
              description="Menor plano ativo disponível"
            />
          </>
        )}
      </div>

      {hasError ? (
        <EmptyStateCard
          icon={ShieldCheck}
          title="A visão global não carregou por completo"
          description={hasError}
        />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Prioridades do super admin</div>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">Núcleo de gestão global</h2>
            </div>
            <Badge variant="warning">Plataforma</Badge>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              {
                title: "Planos SaaS",
                description: "Acompanhar catálogo, posicionamento e precificação da oferta."
              },
              {
                title: "Usuários da plataforma",
                description: "Gerenciar acesso, permissão e suporte administrativo."
              },
              {
                title: "Organizações",
                description: "Monitorar tenants, status comerciais e saúde operacional."
              },
              {
                title: "Evolução do produto",
                description: "Garantir consistência da experiência SaaS em todos os módulos."
              }
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="font-medium text-slate-900">{item.title}</div>
                <div className="mt-2 text-sm leading-6 text-slate-500">{item.description}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-[28px] border border-slate-800 bg-[linear-gradient(180deg,_rgba(11,20,37,0.96)_0%,_rgba(15,23,42,0.98)_100%)] p-6 text-slate-50 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Escopo atual</div>
              <h2 className="mt-2 text-xl font-semibold">Modo plataforma ativo</h2>
            </div>
            <Badge variant="dark">Super admin</Badge>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <Users className="h-4 w-4 text-sky-300" />
                Experiência separada do tenant
              </div>
              <p className="mt-2 text-sm text-slate-400">
                O super admin agora prioriza a visão da plataforma e não cai mais direto na cobrança da organização.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <Workflow className="h-4 w-4 text-sky-300" />
                Navegação administrativa destacada
              </div>
              <p className="mt-2 text-sm text-slate-400">
                O menu Admin agora tem dashboard próprio e a seção de assinatura do tenant fica fora da navegação principal do super admin.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="text-sm text-slate-300">
                {isLoading
                  ? "Carregando visão global..."
                  : `${plans.length} plano(s), ${organizations.length} organização(ões) e ${users.length} usuário(s) visíveis para gestão administrativa.`}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
