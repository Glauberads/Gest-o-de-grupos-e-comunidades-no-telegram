import {
  Activity,
  Bot,
  Building2,
  CreditCard,
  ShieldCheck,
  Users,
  Wallet
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

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
      return <Badge variant="danger">Suspenso</Badge>;
    default:
      return <Badge variant="info">Setup</Badge>;
  }
}

const activityData = [
  { name: "Seg", entries: 8, bot: 21 },
  { name: "Ter", entries: 12, bot: 26 },
  { name: "Qua", entries: 10, bot: 24 },
  { name: "Qui", entries: 17, bot: 31 },
  { name: "Sex", entries: 16, bot: 28 },
  { name: "Sáb", entries: 11, bot: 20 },
  { name: "Dom", entries: 9, bot: 18 }
];

export function AdminDashboardPage() {
  const { session } = useAuth();
  const { organizations, loading: organizationsLoading } = useOrganizations();
  const organization = organizations[0];
  const { communities, loading: communitiesLoading } = useCommunities(organization?.id);
  const { groups, loading: groupsLoading } = useTelegramGroups(organization?.id);
  const { telegramBot, loading: botLoading } = useTelegramBotStatus(organization?.id);
  const { subscription, latestPayment, loading: billingLoading } = useBillingSubscription(
    organization?.id
  );

  const adminName =
    (session?.user.user_metadata.full_name as string | undefined) ??
    session?.user.email ??
    "Admin";

  const isLoading =
    organizationsLoading || communitiesLoading || groupsLoading || botLoading || billingLoading;

  const activeCommunities = communities.filter((community) => community.status === "active").length;
  const connectedGroups = groups.length;
  const estimatedMembers = connectedGroups * 37 + activeCommunities * 18;
  const latestLogs = [
    telegramBot?.username
      ? `Bot @${telegramBot.username} validado para a organização.`
      : "Bot ainda não conectado ao workspace.",
    `${connectedGroups} grupo(s) já vinculados ao ambiente operacional.`,
    latestPayment?.status
      ? `Último status financeiro: ${String(latestPayment.status).toUpperCase()}.`
      : "Nenhuma cobrança recente registrada no painel."
  ];

  return (
    <PageLayout
      title="Visão executiva da operação"
      description={`Olá, ${adminName}. Este painel resume comunidades, conexão Telegram, atividade operacional e status da assinatura em uma linguagem de produto pronta para venda.`}
      badge="Dashboard"
      actions={
        <>
          <Card className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-slate-50 shadow-none">
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Organização</div>
            <div className="mt-1 text-sm font-medium text-white">
              {organization?.name ?? "Sem organização"}
            </div>
          </Card>
          <Card className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-slate-50 shadow-none">
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Assinatura</div>
            <div className="mt-1 flex items-center gap-2 text-sm font-medium text-white">
              <span>{subscription?.platform_plans?.name ?? "Starter"}</span>
              {statusBadge(organization?.status)}
            </div>
          </Card>
        </>
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
              description="Workspaces prontos para operação"
            />
            <StatCard
              icon={Bot}
              label="Grupos conectados"
              value={String(connectedGroups)}
              description={telegramBot?.username ? `Bot @${telegramBot.username} online` : "Bot ainda não conectado"}
            />
            <StatCard
              icon={Users}
              label="Membros totais"
              value={estimatedMembers.toLocaleString("pt-BR")}
              description="Estimativa operacional da base atual"
            />
            <StatCard
              icon={CreditCard}
              label="Status da assinatura"
              value={organization?.status === "active" ? "Ativa" : "Em setup"}
              description={latestPayment?.status ? `Último pagamento: ${latestPayment.status}` : "Sem pagamento recente"}
            />
          </>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Crescimento semanal</div>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">Entradas e atividade do bot</h2>
            </div>
            <Badge variant="info">Recharts</Badge>
          </div>

          <div className="mt-6 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="entriesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="botFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1e293b" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#1e293b" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} width={36} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 16,
                    border: "1px solid #e2e8f0",
                    background: "#ffffff",
                    boxShadow: "0 18px 50px rgba(15,23,42,0.10)"
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="entries"
                  stroke="#0ea5e9"
                  strokeWidth={3}
                  fill="url(#entriesFill)"
                  name="Entradas"
                />
                <Area
                  type="monotone"
                  dataKey="bot"
                  stroke="#1e293b"
                  strokeWidth={2}
                  fill="url(#botFill)"
                  name="Ações do bot"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="rounded-[28px] border border-slate-800 bg-[linear-gradient(180deg,_rgba(11,20,37,0.96)_0%,_rgba(15,23,42,0.98)_100%)] p-6 text-slate-50 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Saúde operacional</div>
              <h2 className="mt-2 text-xl font-semibold">Resumo do ambiente</h2>
            </div>
            {statusBadge(organization?.status)}
          </div>

          <div className="mt-6 grid gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Próximo vencimento</div>
              <div className="mt-2 text-lg font-medium text-white">
                {formatDate(latestPayment?.due_date ?? subscription?.current_period_end)}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Atividade do bot</div>
              <div className="mt-2 flex items-center gap-2 text-sm text-slate-200">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                {telegramBot?.username
                  ? `Bot @${telegramBot.username} pronto para automação`
                  : "Bot ainda não configurado"}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Receita mensal estimada</div>
              <div className="mt-2 flex items-center gap-2 text-lg font-medium text-white">
                <Wallet className="h-4 w-4 text-sky-300" />
                {subscription?.platform_plans?.price_cents
                  ? new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL"
                    }).format(subscription.platform_plans.price_cents / 100)
                  : "R$ 0,00"}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-sky-700" />
            <h2 className="text-xl font-semibold text-slate-900">Logs recentes</h2>
          </div>
          <div className="mt-6 space-y-3">
            {latestLogs.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
              >
                {item}
              </div>
            ))}
          </div>
        </Card>

        {communities.length === 0 ? (
          <EmptyStateCard
            icon={Building2}
            title="Nenhuma comunidade ativa no novo painel"
            description="Crie sua primeira comunidade para começar a organizar grupos, checkout e automações dentro do GestorGram."
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
                  <div className="text-right">
                    <div>{statusBadge(community.status)}</div>
                    <div className="mt-2 text-xs text-slate-400">{formatDate(community.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}
