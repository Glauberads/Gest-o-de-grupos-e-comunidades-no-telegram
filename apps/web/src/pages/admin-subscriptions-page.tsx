import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Crown,
  PauseCircle,
  RefreshCcw,
  ShieldCheck,
  Slash,
  TimerReset
} from "lucide-react";

import { EmptyStateCard } from "@/components/app/empty-state-card";
import { PageLayout } from "@/components/app/page-layout";
import { StatCard } from "@/components/app/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminSubscriptionDetail,
  useAdminSubscriptions
} from "@/features/admin/use-admin-subscriptions";
import { useAuth } from "@/features/auth/use-auth";
import { usePlatformPlans } from "@/features/billing/use-platform-plans";
import { apiRequest } from "@/lib/api";

type AdminAction = "activate" | "extend" | "change-plan" | "suspend" | "cancel" | "lifetime";
type ActivationSource = "manual" | "partner" | "bonus" | "migration" | "asaas";

const activationSourceOptions: Array<{ value: ActivationSource; label: string }> = [
  { value: "manual", label: "Manual" },
  { value: "partner", label: "Parceiro" },
  { value: "bonus", label: "Bônus" },
  { value: "migration", label: "Migração" },
  { value: "asaas", label: "Asaas" }
];

const actionMeta: Record<
  AdminAction,
  { title: string; description: string; submitLabel: string }
> = {
  activate: {
    title: "Ativar assinatura",
    description: "Libera o tenant imediatamente com plano, prazo e origem administrativa.",
    submitLabel: "Ativar agora"
  },
  extend: {
    title: "Conceder dias extras",
    description: "Estende o vencimento atual sem depender do webhook do Asaas.",
    submitLabel: "Adicionar dias"
  },
  "change-plan": {
    title: "Trocar plano",
    description: "Atualiza o plano da organização sem mudar o restante do tenant.",
    submitLabel: "Salvar novo plano"
  },
  suspend: {
    title: "Suspender acesso",
    description: "Bloqueia o painel imediatamente até nova intervenção administrativa.",
    submitLabel: "Suspender assinatura"
  },
  cancel: {
    title: "Cancelar assinatura",
    description: "Encerra a assinatura e impede acesso do tenant ao painel privado.",
    submitLabel: "Cancelar assinatura"
  },
  lifetime: {
    title: "Conceder acesso vitalício",
    description: "Ativa a assinatura sem vencimento, ideal para parceiros ou contas permanentes.",
    submitLabel: "Salvar acesso vitalício"
  }
};

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
    year: "numeric"
  }).format(new Date(value));
}

function originLabel(value?: string | null) {
  switch (value) {
    case "manual":
      return "Manual";
    case "partner":
      return "Parceiro";
    case "bonus":
      return "Bônus";
    case "migration":
      return "Migração";
    case "asaas":
      return "Asaas";
    default:
      return value ?? "—";
  }
}

function subscriptionBadge(input: {
  status?: string | null;
  lifetime?: boolean;
  activeUntil?: string | null;
  activationSource?: string | null;
}) {
  if (input.lifetime) {
    return <Badge variant="success">Vitalícia</Badge>;
  }

  if (
    input.status === "active" &&
    input.activationSource &&
    ["partner", "bonus"].includes(input.activationSource)
  ) {
    return <Badge variant="info">Teste</Badge>;
  }

  if (input.status === "active" && input.activeUntil && new Date(input.activeUntil) < new Date()) {
    return <Badge variant="warning">Expirada</Badge>;
  }

  switch (input.status) {
    case "active":
      return <Badge variant="success">Ativa</Badge>;
    case "suspended":
      return <Badge variant="danger">Suspensa</Badge>;
    case "cancelled":
      return <Badge variant="default">Cancelada</Badge>;
    case "overdue":
      return <Badge variant="warning">Vencida</Badge>;
    case "pending_payment":
      return <Badge variant="warning">Pendente</Badge>;
    default:
      return <Badge variant="default">{input.status ?? "Sem status"}</Badge>;
  }
}

export function AdminSubscriptionsPage() {
  const { session } = useAuth();
  const isSuperAdmin = session?.user.app_metadata?.is_super_admin === true;
  const { plans, loading: plansLoading } = usePlatformPlans();
  const {
    subscriptions,
    loading,
    error,
    refresh: refreshSubscriptions
  } = useAdminSubscriptions(isSuperAdmin);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null);
  const {
    detail,
    loading: detailLoading,
    error: detailError,
    refresh: refreshDetail
  } = useAdminSubscriptionDetail(selectedOrganizationId, isSuperAdmin);
  const [action, setAction] = useState<AdminAction>("activate");
  const [planId, setPlanId] = useState("");
  const [days, setDays] = useState("30");
  const [notes, setNotes] = useState("");
  const [activationSource, setActivationSource] = useState<ActivationSource>("manual");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!selectedOrganizationId && subscriptions.length > 0) {
      setSelectedOrganizationId(subscriptions[0].organization_id);
    }
  }, [selectedOrganizationId, subscriptions]);

  useEffect(() => {
    if (!detail?.subscription) {
      return;
    }

    setPlanId(detail.subscription.platform_plan_id ?? "");
    setActivationSource((detail.subscription.activation_source as ActivationSource) ?? "manual");
    setNotes(detail.subscription.notes ?? "");
  }, [detail?.subscription]);

  const activeCount = useMemo(
    () =>
      subscriptions.filter(
        (item) => item.status === "active" || item.lifetime || item.organizations?.status === "active"
      ).length,
    [subscriptions]
  );
  const lifetimeCount = useMemo(
    () => subscriptions.filter((item) => item.lifetime).length,
    [subscriptions]
  );

  async function handleSubmit() {
    if (!selectedOrganizationId) {
      setMessage("Selecione uma organização para continuar.");
      return;
    }

    const currentAction = action;
    const payloadBase = {
      organizationId: selectedOrganizationId,
      notes: notes.trim() || undefined
    };

    setSubmitting(true);
    setMessage(null);

    try {
      if (currentAction === "activate") {
        await apiRequest("/api/admin/subscriptions/activate", {
          method: "POST",
          body: {
            ...payloadBase,
            planId,
            days: Number(days),
            activationSource,
            lifetime: false
          }
        });
      }

      if (currentAction === "lifetime") {
        await apiRequest("/api/admin/subscriptions/activate", {
          method: "POST",
          body: {
            ...payloadBase,
            planId,
            activationSource,
            lifetime: true
          }
        });
      }

      if (currentAction === "extend") {
        await apiRequest("/api/admin/subscriptions/extend", {
          method: "POST",
          body: {
            ...payloadBase,
            days: Number(days),
            activationSource
          }
        });
      }

      if (currentAction === "change-plan") {
        await apiRequest("/api/admin/subscriptions/change-plan", {
          method: "POST",
          body: {
            ...payloadBase,
            planId
          }
        });
      }

      if (currentAction === "suspend") {
        await apiRequest("/api/admin/subscriptions/suspend", {
          method: "POST",
          body: payloadBase
        });
      }

      if (currentAction === "cancel") {
        await apiRequest("/api/admin/subscriptions/cancel", {
          method: "POST",
          body: payloadBase
        });
      }

      await Promise.all([refreshSubscriptions(), refreshDetail()]);
      setMessage("Ação administrativa aplicada com sucesso.");
    } catch (nextError) {
      setMessage(
        nextError instanceof Error ? nextError.message : "Não foi possível salvar a ação agora."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageLayout
      title="Assinaturas da plataforma"
      description="Ativação manual, suspensão, cancelamento, extensão e correções operacionais sem depender do fluxo do Asaas."
      badge="Admin"
      badgeVariant="warning"
    >
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          icon={CreditCard}
          label="Assinaturas"
          value={String(subscriptions.length)}
          description="Registros listados no billing"
        />
        <StatCard
          icon={CheckCircle2}
          label="Ativas"
          value={String(activeCount)}
          description="Tenants liberados agora"
        />
        <StatCard
          icon={Crown}
          label="Vitalícias"
          value={String(lifetimeCount)}
          description="Acessos sem vencimento"
        />
        <StatCard
          icon={ShieldCheck}
          label="Escopo"
          value="Super admin"
          description="Sem acesso para tenants"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Operação manual de assinaturas</h2>
              <p className="mt-1 text-sm text-slate-500">
                Selecione uma organização para ativar, suspender, cancelar, trocar plano ou conceder bônus.
              </p>
            </div>
            <Badge variant="dark">Global</Badge>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3 font-medium">Empresa</th>
                  <th className="pb-3 font-medium">Plano</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Vencimento</th>
                  <th className="pb-3 font-medium">Origem</th>
                  <th className="pb-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index}>
                      <td colSpan={6} className="py-4">
                        <Skeleton className="h-12 w-full rounded-2xl" />
                      </td>
                    </tr>
                  ))
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="py-6">
                      <EmptyStateCard
                        icon={ShieldCheck}
                        title="Não foi possível carregar as assinaturas"
                        description={error}
                      />
                    </td>
                  </tr>
                ) : subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6">
                      <EmptyStateCard
                        icon={CreditCard}
                        title="Nenhuma assinatura registrada"
                        description="As assinaturas aparecerão aqui assim que o billing criar o primeiro vínculo por organização."
                      />
                    </td>
                  </tr>
                ) : (
                  subscriptions.map((subscription) => (
                    <tr
                      key={subscription.id}
                      className={`border-b border-slate-100 text-slate-700 ${
                        selectedOrganizationId === subscription.organization_id ? "bg-sky-50/60" : ""
                      }`}
                    >
                      <td className="py-4">
                        <div className="font-medium text-slate-900">
                          {subscription.organizations?.name ?? "Organização sem nome"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {subscription.organizations?.slug ?? subscription.organization_id}
                        </div>
                      </td>
                      <td className="py-4 text-slate-600">
                        {subscription.platform_plans?.name ?? "Sem plano"}
                      </td>
                      <td className="py-4">
                        {subscriptionBadge({
                          status: subscription.status,
                          lifetime: subscription.lifetime,
                          activeUntil: subscription.active_until ?? subscription.current_period_end,
                          activationSource: subscription.activation_source
                        })}
                      </td>
                      <td className="py-4 text-slate-600">
                        {subscription.lifetime
                          ? "Sem vencimento"
                          : formatDate(subscription.active_until ?? subscription.current_period_end)}
                      </td>
                      <td className="py-4 text-slate-600">
                        {originLabel(subscription.activation_source)}
                      </td>
                      <td className="py-4">
                        <Button
                          variant="outline"
                          onClick={() => setSelectedOrganizationId(subscription.organization_id)}
                        >
                          Gerenciar
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[28px] border border-slate-800 bg-[linear-gradient(180deg,_rgba(11,20,37,0.96)_0%,_rgba(15,23,42,0.98)_100%)] p-6 text-slate-50 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Central manual
                </div>
                <h2 className="mt-2 text-xl font-semibold">
                  {actionMeta[action].title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {actionMeta[action].description}
                </p>
              </div>
              {detail?.subscription
                ? subscriptionBadge({
                    status: detail.subscription.status,
                    lifetime: detail.subscription.lifetime,
                    activeUntil:
                      detail.subscription.active_until ?? detail.subscription.current_period_end,
                    activationSource: detail.subscription.activation_source
                  })
                : <Badge variant="dark">Selecione</Badge>}
            </div>

            <div className="mt-5 grid gap-2 md:grid-cols-3 xl:grid-cols-2">
              {[
                { key: "activate", label: "Ativar", icon: CheckCircle2 },
                { key: "suspend", label: "Suspender", icon: PauseCircle },
                { key: "cancel", label: "Cancelar", icon: Slash },
                { key: "extend", label: "Estender", icon: TimerReset },
                { key: "change-plan", label: "Trocar plano", icon: RefreshCcw },
                { key: "lifetime", label: "Vitalício", icon: Crown }
              ].map((item) => (
                <Button
                  key={item.key}
                  variant={action === item.key ? "default" : "outline"}
                  className={action === item.key ? "" : "border-slate-700 text-slate-100 hover:bg-slate-800"}
                  onClick={() => setAction(item.key as AdminAction)}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              ))}
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Organização</div>
                <div className="mt-2 text-base font-medium text-white">
                  {detail?.organization.name ?? "Selecione uma organização na tabela"}
                </div>
                <div className="mt-1 text-sm text-slate-400">
                  {detail?.organization.slug ?? "Sem tenant selecionado"}
                </div>
              </div>

              {(action === "activate" || action === "change-plan" || action === "lifetime") ? (
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-200">Plano</span>
                  <select
                    value={planId}
                    onChange={(event) => setPlanId(event.target.value)}
                    className="h-11 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 text-sm text-slate-100 outline-none focus:border-sky-400"
                  >
                    <option value="">Selecione um plano</option>
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} · {formatCurrency(plan.price_cents)}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {(action === "activate" || action === "extend") ? (
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-200">Dias</span>
                  <input
                    type="number"
                    min={1}
                    value={days}
                    onChange={(event) => setDays(event.target.value)}
                    className="h-11 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 text-sm text-slate-100 outline-none focus:border-sky-400"
                    placeholder="30"
                  />
                </label>
              ) : null}

              {(action === "activate" || action === "extend" || action === "lifetime") ? (
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-200">Origem</span>
                  <select
                    value={activationSource}
                    onChange={(event) => setActivationSource(event.target.value as ActivationSource)}
                    className="h-11 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 text-sm text-slate-100 outline-none focus:border-sky-400"
                  >
                    {activationSourceOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-200">Observações administrativas</span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-400"
                  placeholder="Ex.: Cliente VIP, correção de falha de webhook, parceria comercial..."
                />
              </label>

              {message ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-300">
                  {message}
                </div>
              ) : null}

              <Button
                className="w-full"
                disabled={
                  submitting ||
                  !selectedOrganizationId ||
                  plansLoading ||
                  ((action === "activate" || action === "change-plan" || action === "lifetime") &&
                    !planId)
                }
                onClick={() => void handleSubmit()}
              >
                {submitting ? "Salvando..." : actionMeta[action].submitLabel}
              </Button>
            </div>
          </Card>

          <Card className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Detalhes e auditoria</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Status atual, último pagamento conhecido e histórico das ações administrativas.
                </p>
              </div>
              <Badge variant="info">Auditável</Badge>
            </div>

            {detailLoading ? (
              <div className="mt-6 space-y-3">
                <Skeleton className="h-20 w-full rounded-2xl" />
                <Skeleton className="h-32 w-full rounded-2xl" />
              </div>
            ) : detailError ? (
              <div className="mt-6">
                <EmptyStateCard
                  icon={ShieldCheck}
                  title="Não foi possível carregar os detalhes"
                  description={detailError}
                />
              </div>
            ) : !detail ? (
              <div className="mt-6">
                <EmptyStateCard
                  icon={CalendarClock}
                  title="Selecione uma organização"
                  description="Escolha uma linha da tabela para revisar a assinatura e aplicar uma ação manual."
                />
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Plano atual</div>
                    <div className="mt-2 text-lg font-semibold text-slate-900">
                      {detail.subscription?.platform_plans?.name ?? "Sem plano"}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      Origem {originLabel(detail.subscription?.activation_source)}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Vencimento</div>
                    <div className="mt-2 text-lg font-semibold text-slate-900">
                      {detail.subscription?.lifetime
                        ? "Sem vencimento"
                        : formatDate(
                            detail.subscription?.active_until ??
                              detail.subscription?.current_period_end
                          )}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      {subscriptionBadge({
                        status: detail.subscription?.status,
                        lifetime: detail.subscription?.lifetime,
                        activeUntil:
                          detail.subscription?.active_until ??
                          detail.subscription?.current_period_end,
                        activationSource: detail.subscription?.activation_source
                      })}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Último pagamento conhecido</div>
                  {detail.latestPayment ? (
                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                      <div>
                        <div className="text-sm font-medium text-slate-900">
                          {formatCurrency(detail.latestPayment.amount_cents)}
                        </div>
                        <div className="text-xs text-slate-500">Valor</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900">
                          {formatDate(detail.latestPayment.due_date)}
                        </div>
                        <div className="text-xs text-slate-500">Vencimento</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900">
                          {detail.latestPayment.status}
                        </div>
                        <div className="text-xs text-slate-500">Status</div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 text-sm text-slate-500">
                      Ainda não existe pagamento registrado para esta organização.
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Auditoria</div>
                  {detail.auditLogs.length === 0 ? (
                    <div className="mt-3 text-sm text-slate-500">
                      Nenhuma ação manual registrada ainda para esta assinatura.
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {detail.auditLogs.map((log) => (
                        <div
                          key={log.id}
                          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="font-medium text-slate-900">{log.action}</div>
                            <div className="text-xs text-slate-500">{formatDate(log.created_at)}</div>
                          </div>
                          <div className="mt-2 text-sm text-slate-500">
                            {log.old_status ?? "—"} → {log.new_status ?? "—"}
                          </div>
                          {log.notes ? (
                            <div className="mt-2 text-sm text-slate-600">{log.notes}</div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}
