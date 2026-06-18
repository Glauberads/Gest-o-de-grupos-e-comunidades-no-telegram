import { Activity, Bot, Building2, CreditCard, ShieldCheck, Users, Wallet } from "lucide-react";

import { EmptyStateCard } from "@/components/app/empty-state-card";
import { PageLayout } from "@/components/app/page-layout";
import { StatCard } from "@/components/app/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useBillingSubscription } from "@/features/billing/use-billing-subscription";
import { useAuth } from "@/features/auth/use-auth";
import { useCommunities } from "@/features/communities/use-communities";
import { useOrganizations } from "@/features/organizations/use-organizations";
import { useTelegramBotStatus } from "@/features/telegram/use-telegram-bot-status";
import { useTelegramGroups } from "@/features/telegram/use-telegram-groups";
import { useTelegramLogs } from "@/features/telegram/use-telegram-logs";

function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short"
  }).format(new Date(value));
}

function statusBadge(status?: string) {
  switch (status) {
    case "active":
      return <Badge variant="success">Ativo</Badge>;
    case "pending_payment":
      return <Badge variant="warning">Pendente</Badge>;
    case "overdue":
      return <Badge variant="warning">Vencendo</Badge>;
    case "suspended":
    case "cancelled":
      return <Badge variant="danger">Bloqueado</Badge>;
    default:
      return <Badge variant="info">Setup</Badge>;
  }
}

export function AdminDashboardPage() {
  const { session } = useAuth();
  const { organizations, loading: organizationsLoading } = useOrganizations();
  const organization = organizations[0];
  const { communities, loading: communitiesLoading, error: communitiesError } = useCommunities(
    organization?.id
  );
  const { groups, loading: groupsLoading, error: groupsError } = useTelegramGroups(organization?.id);
  const { telegramBot, loading: botLoading, error: botError } = useTelegramBotStatus(organization?.id);
  const {
    subscription,
    latestPayment,
    loading: billingLoading,
    error: billingError
  } = useBillingSubscription(organization?.id);
  const { logs, loading: logsLoading } = useTelegramLogs(organization?.id);

  const adminName =
    (session?.user.user_metadata.full_name as string | undefined) ??
    session?.user.email ??
    "Admin";

  const isLoading =
    organizationsLoading || communitiesLoading || groupsLoading || botLoading || billingLoading;

  const recentLogs = logs.slice(0, 4);
  const activeCommunities = communities.filter((community) => community.status === "active").length;
  const criticalError = communitiesError || groupsError || botError || billingError;

  return (
    <PageLayout
      title="Visão executiva da operação"
      description={`Olá, ${adminName}. Este painel resume sua assinatura, comunidades e operação Telegram com dados reais já disponíveis no produto.`}
      badge="Dashboard"
      actions={
        organization ? (
          <>
            <Card className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-slate-50 shadow-none">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Organização</div>
              <div className="mt-1 text-sm font-medium text-white">{organization.name}</div>
            </Card>
            <Card className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-slate-50 shadow-none">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Assinatura</div>
              <div className="mt-1 flex items-center gap-2 text-sm font-medium text-white">
                <span>{subscription?.platform_plans?.name ?? "Sem plano confirmado"}</span>
                {statusBadge(organization.status)}
              </div>
            </Card>
          </>
        ) : null
      }
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
              label="Comunidades ativas"
              value={String(activeCommunities)}
              description="Comunidades com status ativo"
            />
            <StatCard
              icon={Bot}
              label="Grupos conectados"
              value={String(groups.length)}
              description={telegramBot?.username ? `Bot @${telegramBot.username} conectado` : "Bot ainda não conectado"}
            />
            <StatCard
              icon={Users}
              label="Membros totais"
              value="—"
              description="Métrica ainda não disponível nesta fase do produto"
            />
            <StatCard
              icon={CreditCard}
              label="Próximo vencimento"
              value={formatDate(latestPayment?.due_date ?? subscription?.current_period_end)}
              description={latestPayment?.status ? `Último status: ${latestPayment.status}` : "Sem cobrança recente"}
            />
          </>
        )}
      </div>

      {criticalError ? (
        <EmptyStateCard
          icon={ShieldCheck}
          title="Parte do dashboard não carregou"
          description={criticalError}
        />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-sky-700" />
            <h2 className="text-xl font-semibold text-slate-900">Atividade do bot</h2>
          </div>
          <div className="mt-6 space-y-3">
            {logsLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-full rounded-2xl" />
              ))
            ) : recentLogs.length === 0 ? (
              <EmptyStateCard
                icon={Bot}
                title="Sem eventos recentes do bot"
                description="Depois que você validar o bot, conectar grupos ou enviar mensagens teste, os eventos operacionais aparecerão aqui."
              />
            ) : (
              recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-slate-900">{log.action}</div>
                    <Badge variant={log.status === "success" ? "success" : "warning"}>
                      {log.status}
                    </Badge>
                  </div>
                  <div className="mt-2 text-sm text-slate-600">
                    {log.message ?? "Evento operacional sem detalhes adicionais."}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="rounded-[28px] border border-slate-800 bg-[linear-gradient(180deg,_rgba(11,20,37,0.96)_0%,_rgba(15,23,42,0.98)_100%)] p-6 text-slate-50 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Saúde do workspace</div>
              <h2 className="mt-2 text-xl font-semibold">Resumo operacional</h2>
            </div>
            {statusBadge(organization?.status)}
          </div>

          <div className="mt-6 grid gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Plano atual</div>
              <div className="mt-2 text-lg font-medium text-white">
                {subscription?.platform_plans?.name ?? "Sem plano confirmado"}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Bot</div>
              <div className="mt-2 text-sm text-slate-200">
                {telegramBot?.username
                  ? `Bot @${telegramBot.username} pronto para automação`
                  : "Conecte o bot para começar a operar os grupos"}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Receita mensal da plataforma</div>
              <div className="mt-2 flex items-center gap-2 text-lg font-medium text-white">
                <Wallet className="h-4 w-4 text-sky-300" />
                {subscription?.platform_plans?.price_cents
                  ? new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL"
                    }).format(subscription.platform_plans.price_cents / 100)
                  : "—"}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {communities.length === 0 ? (
        <EmptyStateCard
          icon={Building2}
          title="Nenhuma comunidade cadastrada ainda"
          description="Crie sua primeira comunidade para começar a organizar grupos e preparar a operação Telegram."
        />
      ) : (
        <Card className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-slate-900">Comunidades recentes</h2>
            <Badge variant="success">{communities.length} total</Badge>
          </div>
          <div className="mt-6 space-y-3">
            {communities.slice(0, 4).map((community) => (
              <div
                key={community.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 px-4 py-4"
              >
                <div>
                  <div className="font-medium text-slate-900">{community.name}</div>
                  <div className="mt-1 text-sm text-slate-500">/{community.public_slug}</div>
                </div>
                <Badge variant={community.status === "active" ? "success" : "default"}>
                  {community.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </PageLayout>
  );
}
