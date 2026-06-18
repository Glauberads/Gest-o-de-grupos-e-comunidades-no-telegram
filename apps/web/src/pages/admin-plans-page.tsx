import { useMemo, useState } from "react";
import {
  Archive,
  CheckCircle2,
  CreditCard,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2
} from "lucide-react";

import { EmptyStateCard } from "@/components/app/empty-state-card";
import { PageLayout } from "@/components/app/page-layout";
import { StatCard } from "@/components/app/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type AdminPlatformPlan,
  useAdminPlatformPlans
} from "@/features/admin/use-admin-platform-plans";
import { useAuth } from "@/features/auth/use-auth";
import { apiRequest } from "@/lib/api";

type PlanFormState = {
  name: string;
  slug: string;
  description: string;
  priceCents: string;
  billingCycle: "monthly" | "quarterly" | "semiannual" | "annual" | "lifetime";
  maxCommunities: string;
  maxTelegramGroups: string;
  maxAutomations: string;
  hasPrioritySupport: boolean;
  hasAdvancedReports: boolean;
  hasAiModeration: boolean;
  isFeatured: boolean;
  status: "active" | "inactive" | "archived";
  sortOrder: string;
};

const emptyForm: PlanFormState = {
  name: "",
  slug: "",
  description: "",
  priceCents: "0",
  billingCycle: "monthly",
  maxCommunities: "1",
  maxTelegramGroups: "1",
  maxAutomations: "0",
  hasPrioritySupport: false,
  hasAdvancedReports: false,
  hasAiModeration: false,
  isFeatured: false,
  status: "inactive",
  sortOrder: "0"
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value / 100);
}

function statusBadge(status: string) {
  switch (status) {
    case "active":
      return <Badge variant="success">Ativo</Badge>;
    case "inactive":
      return <Badge variant="warning">Inativo</Badge>;
    case "archived":
      return <Badge variant="default">Arquivado</Badge>;
    default:
      return <Badge variant="default">{status}</Badge>;
  }
}

function cycleLabel(value: string) {
  switch (value) {
    case "monthly":
      return "Mensal";
    case "quarterly":
      return "Trimestral";
    case "semiannual":
      return "Semestral";
    case "annual":
      return "Anual";
    case "lifetime":
      return "Vitalício";
    default:
      return value;
  }
}

function toFormState(plan?: AdminPlatformPlan | null): PlanFormState {
  if (!plan) {
    return emptyForm;
  }

  return {
    name: plan.name,
    slug: plan.slug,
    description: plan.description ?? "",
    priceCents: String(plan.price_cents),
    billingCycle: plan.billing_interval,
    maxCommunities: String(plan.max_communities),
    maxTelegramGroups: String(plan.max_telegram_groups),
    maxAutomations: String(plan.max_automations),
    hasPrioritySupport: plan.has_priority_support,
    hasAdvancedReports: plan.has_advanced_reports,
    hasAiModeration: plan.has_ai_moderation,
    isFeatured: plan.is_featured,
    status: plan.status,
    sortOrder: String(plan.sort_order)
  };
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function AdminPlansPage() {
  const { session } = useAuth();
  const isSuperAdmin = session?.user.app_metadata?.is_super_admin === true;
  const { plans, loading, error, refresh } = useAdminPlatformPlans(isSuperAdmin);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [form, setForm] = useState<PlanFormState>(emptyForm);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlanId) ?? null,
    [plans, selectedPlanId]
  );

  function handleCreateMode() {
    setMode("create");
    setSelectedPlanId(null);
    setForm(emptyForm);
    setMessage(null);
  }

  function handleEditMode(plan: AdminPlatformPlan) {
    setMode("edit");
    setSelectedPlanId(plan.id);
    setForm(toFormState(plan));
    setMessage(null);
  }

  function updateField<K extends keyof PlanFormState>(field: K, value: PlanFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSave() {
    setSubmitting(true);
    setMessage(null);

    try {
      const payload = {
        name: form.name.trim(),
        slug: slugify(form.slug || form.name),
        description: form.description.trim() || null,
        priceCents: Number(form.priceCents),
        billingCycle: form.billingCycle,
        maxCommunities: Number(form.maxCommunities),
        maxTelegramGroups: Number(form.maxTelegramGroups),
        maxAutomations: Number(form.maxAutomations),
        hasPrioritySupport: form.hasPrioritySupport,
        hasAdvancedReports: form.hasAdvancedReports,
        hasAiModeration: form.hasAiModeration,
        isFeatured: form.isFeatured,
        status: form.status,
        sortOrder: Number(form.sortOrder)
      };

      if (mode === "create") {
        await apiRequest("/api/admin/platform-plans", {
          method: "POST",
          body: payload
        });
        setMessage("Plano criado com sucesso.");
        handleCreateMode();
      } else if (selectedPlanId) {
        await apiRequest(`/api/admin/platform-plans/${selectedPlanId}`, {
          method: "PATCH",
          body: payload
        });
        setMessage("Plano atualizado com sucesso.");
      }

      await refresh();
    } catch (nextError) {
      setMessage(
        nextError instanceof Error
          ? nextError.message
          : "Não foi possível salvar o plano. Confira os dados e tente novamente."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleArchive(planId: string) {
    setSubmitting(true);
    setMessage(null);

    try {
      await apiRequest(`/api/admin/platform-plans/${planId}/archive`, { method: "POST" });
      setMessage("Plano arquivado com sucesso.");
      await refresh();
    } catch (nextError) {
      setMessage(nextError instanceof Error ? nextError.message : "Falha ao arquivar o plano.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRestore(planId: string) {
    setSubmitting(true);
    setMessage(null);

    try {
      await apiRequest(`/api/admin/platform-plans/${planId}/restore`, { method: "POST" });
      setMessage("Plano restaurado com sucesso.");
      await refresh();
    } catch (nextError) {
      setMessage(nextError instanceof Error ? nextError.message : "Falha ao restaurar o plano.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(planId: string) {
    setSubmitting(true);
    setMessage(null);

    try {
      const payload = await apiRequest<{ message: string }>(
        `/api/admin/platform-plans/${planId}`,
        { method: "DELETE" as never }
      );
      setMessage(payload.message);
      await refresh();
    } catch (nextError) {
      setMessage(nextError instanceof Error ? nextError.message : "Falha ao remover o plano.");
    } finally {
      setSubmitting(false);
    }
  }

  const activePlans = plans.filter((plan) => plan.status === "active").length;
  const featuredPlans = plans.filter((plan) => plan.is_featured).length;

  return (
    <PageLayout
      title="Planos SaaS"
      description="Gerencie os planos vendidos aos clientes do GestorGram com segurança para histórico, assinatura e checkout."
      badge="Admin"
      badgeVariant="warning"
      actions={
        <Button onClick={handleCreateMode}>
          <Plus className="mr-2 h-4 w-4" />
          Novo plano
        </Button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-4">
        <StatCard
          icon={CreditCard}
          label="Planos"
          value={String(plans.length)}
          description="Catálogo total"
        />
        <StatCard
          icon={CheckCircle2}
          label="Ativos"
          value={String(activePlans)}
          description="Disponíveis no checkout"
        />
        <StatCard
          icon={Sparkles}
          label="Destaques"
          value={String(featuredPlans)}
          description="Planos em evidência"
        />
        <StatCard
          icon={ShieldCheck}
          label="Acesso"
          value="Super admin"
          description="CRUD protegido"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Catálogo de planos</h2>
              <p className="mt-1 text-sm text-slate-500">
                Planos ativos aparecem no checkout. Inativos saem da vitrine. Arquivados ficam apenas por histórico.
              </p>
            </div>
            <Badge variant="dark">Global</Badge>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3 font-medium">Nome</th>
                  <th className="pb-3 font-medium">Preço</th>
                  <th className="pb-3 font-medium">Ciclo</th>
                  <th className="pb-3 font-medium">Comunidades</th>
                  <th className="pb-3 font-medium">Grupos</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Destaque</th>
                  <th className="pb-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index}>
                      <td colSpan={8} className="py-4">
                        <Skeleton className="h-12 w-full rounded-2xl" />
                      </td>
                    </tr>
                  ))
                ) : error ? (
                  <tr>
                    <td colSpan={8} className="py-6">
                      <EmptyStateCard
                        icon={CreditCard}
                        title="Não foi possível carregar os planos"
                        description={error}
                      />
                    </td>
                  </tr>
                ) : plans.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6">
                      <EmptyStateCard
                        icon={CreditCard}
                        title="Nenhum plano criado ainda"
                        description="Crie o primeiro plano para começar a vender o GestorGram."
                      />
                    </td>
                  </tr>
                ) : (
                  plans.map((plan) => (
                    <tr key={plan.id} className="border-b border-slate-100 text-slate-700">
                      <td className="py-4">
                        <div className="font-medium text-slate-900">{plan.name}</div>
                        <div className="text-xs text-slate-500">{plan.slug}</div>
                      </td>
                      <td className="py-4">{formatCurrency(plan.price_cents)}</td>
                      <td className="py-4">{cycleLabel(plan.billing_interval)}</td>
                      <td className="py-4">{plan.max_communities}</td>
                      <td className="py-4">{plan.max_telegram_groups}</td>
                      <td className="py-4">{statusBadge(plan.status)}</td>
                      <td className="py-4">
                        {plan.is_featured ? <Badge variant="info">Destaque</Badge> : "—"}
                      </td>
                      <td className="py-4">
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" onClick={() => handleEditMode(plan)}>
                            Editar
                          </Button>
                          {plan.status !== "archived" ? (
                            <Button variant="outline" onClick={() => void handleArchive(plan.id)}>
                              <Archive className="mr-2 h-4 w-4" />
                              Arquivar
                            </Button>
                          ) : (
                            <Button variant="outline" onClick={() => void handleRestore(plan.id)}>
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Restaurar
                            </Button>
                          )}
                          <Button variant="outline" onClick={() => void handleDelete(plan.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remover
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="rounded-[28px] border border-slate-800 bg-[linear-gradient(180deg,_rgba(11,20,37,0.96)_0%,_rgba(15,23,42,0.98)_100%)] p-6 text-slate-50 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                {mode === "create" ? "Novo plano" : "Editar plano"}
              </div>
              <h2 className="mt-2 text-xl font-semibold">
                {mode === "create" ? "Criar oferta SaaS" : selectedPlan?.name ?? "Editar oferta"}
              </h2>
            </div>
            {selectedPlan ? statusBadge(selectedPlan.status) : <Badge variant="dark">Rascunho</Badge>}
          </div>

          <div className="mt-6 space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-200">Nome do plano</span>
              <input
                value={form.name}
                onChange={(event) => {
                  updateField("name", event.target.value);
                  if (!form.slug) {
                    updateField("slug", slugify(event.target.value));
                  }
                }}
                className="h-11 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 text-sm text-slate-100 outline-none focus:border-sky-400"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-200">Slug</span>
              <input
                value={form.slug}
                onChange={(event) => updateField("slug", slugify(event.target.value))}
                className="h-11 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 text-sm text-slate-100 outline-none focus:border-sky-400"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-200">Descrição</span>
              <textarea
                rows={3}
                value={form.description}
                onChange={(event) => updateField("description", event.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-400"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-200">Preço em centavos</span>
                <input
                  type="number"
                  min={0}
                  value={form.priceCents}
                  onChange={(event) => updateField("priceCents", event.target.value)}
                  className="h-11 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 text-sm text-slate-100 outline-none focus:border-sky-400"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-200">Ciclo</span>
                <select
                  value={form.billingCycle}
                  onChange={(event) => updateField("billingCycle", event.target.value as PlanFormState["billingCycle"])}
                  className="h-11 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 text-sm text-slate-100 outline-none focus:border-sky-400"
                >
                  <option value="monthly">Mensal</option>
                  <option value="quarterly">Trimestral</option>
                  <option value="semiannual">Semestral</option>
                  <option value="annual">Anual</option>
                  <option value="lifetime">Vitalício</option>
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-200">Limite de comunidades</span>
                <input
                  type="number"
                  min={0}
                  value={form.maxCommunities}
                  onChange={(event) => updateField("maxCommunities", event.target.value)}
                  className="h-11 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 text-sm text-slate-100 outline-none focus:border-sky-400"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-200">Limite de grupos</span>
                <input
                  type="number"
                  min={0}
                  value={form.maxTelegramGroups}
                  onChange={(event) => updateField("maxTelegramGroups", event.target.value)}
                  className="h-11 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 text-sm text-slate-100 outline-none focus:border-sky-400"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-200">Limite de automações</span>
                <input
                  type="number"
                  min={0}
                  value={form.maxAutomations}
                  onChange={(event) => updateField("maxAutomations", event.target.value)}
                  className="h-11 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 text-sm text-slate-100 outline-none focus:border-sky-400"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-200">Ordem</span>
                <input
                  type="number"
                  min={0}
                  value={form.sortOrder}
                  onChange={(event) => updateField("sortOrder", event.target.value)}
                  className="h-11 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 text-sm text-slate-100 outline-none focus:border-sky-400"
                />
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {[
                ["hasPrioritySupport", "Suporte prioritário"],
                ["hasAdvancedReports", "Relatórios avançados"],
                ["hasAiModeration", "Moderação IA"],
                ["isFeatured", "Plano em destaque"]
              ].map(([field, label]) => (
                <label
                  key={field}
                  className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-200"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(form[field as keyof PlanFormState])}
                    onChange={(event) =>
                      updateField(
                        field as
                          | "hasPrioritySupport"
                          | "hasAdvancedReports"
                          | "hasAiModeration"
                          | "isFeatured",
                        event.target.checked
                      )
                    }
                  />
                  {label}
                </label>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-200">Status</span>
                <select
                  value={form.status}
                  onChange={(event) => updateField("status", event.target.value as PlanFormState["status"])}
                  className="h-11 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 text-sm text-slate-100 outline-none focus:border-sky-400"
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                  <option value="archived">Arquivado</option>
                </select>
              </label>
            </div>

            {message ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-300">
                {message}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button disabled={submitting} onClick={() => void handleSave()}>
                <Save className="mr-2 h-4 w-4" />
                {submitting ? "Salvando..." : mode === "create" ? "Criar plano" : "Salvar alterações"}
              </Button>
              <Button variant="outline" onClick={handleCreateMode}>
                Limpar
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
