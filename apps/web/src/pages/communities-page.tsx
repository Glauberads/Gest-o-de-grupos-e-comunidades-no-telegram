import { Plus, Search, ShieldCheck, Sparkles, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { EmptyStateCard } from "@/components/app/empty-state-card";
import { PageLayout } from "@/components/app/page-layout";
import { StatCard } from "@/components/app/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useCommunities } from "@/features/communities/use-communities";
import { useOrganizations } from "@/features/organizations/use-organizations";

function formatDate(value?: string) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}

function communityStatusBadge(status: string) {
  switch (status) {
    case "active":
      return <Badge variant="success">Ativo</Badge>;
    case "paused":
      return <Badge variant="warning">Pausado</Badge>;
    case "archived":
      return <Badge variant="dark">Arquivado</Badge>;
    default:
      return <Badge variant="info">Configuração</Badge>;
  }
}

const filters = [
  { label: "Todos", value: "all" },
  { label: "Ativo", value: "active" },
  { label: "Pausado", value: "paused" },
  { label: "Arquivado", value: "archived" }
] as const;

export function CommunitiesPage() {
  const navigate = useNavigate();
  const { organizations } = useOrganizations();
  const organization = organizations[0];
  const { communities, loading, error } = useCommunities(organization?.id);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]["value"]>("all");

  const filteredCommunities = useMemo(() => {
    return communities.filter((community) => {
      const matchesFilter = filter === "all" ? true : community.status === filter;
      const term = query.trim().toLowerCase();
      const matchesQuery =
        term.length === 0 ||
        community.name.toLowerCase().includes(term) ||
        community.public_slug.toLowerCase().includes(term) ||
        (community.description ?? "").toLowerCase().includes(term);

      return matchesFilter && matchesQuery;
    });
  }, [communities, filter, query]);

  const activeCount = communities.filter((community) => community.status === "active").length;
  const autoApproveCount = communities.filter((community) => community.auto_approve_enabled).length;

  return (
    <PageLayout
      title="Comunidades"
      description="Gerencie cada comunidade com visão operacional clara, filtros rápidos e estrutura preparada para escalar a experiência do cliente final."
      badge="Operação"
      actions={
        <Button onClick={() => navigate("/app/communities/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Nova comunidade
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={ShieldCheck}
          label="Comunidades ativas"
          value={String(activeCount)}
          description="Ambientes liberados para operação"
        />
        <StatCard
          icon={Sparkles}
          label="Autoaprovação"
          value={String(autoApproveCount)}
          description="Fluxos com aprovação automática habilitada"
        />
        <StatCard
          icon={Users}
          label="Catálogo total"
          value={String(communities.length)}
          description="Comunidades cadastradas no workspace"
        />
      </div>

      <Card className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Todas as comunidades</h2>
            <p className="mt-1 text-sm text-slate-500">
              Busque, filtre e entre nas próximas etapas de operação com mais clareza visual.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <Search className="h-4 w-4 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por nome, slug ou descrição"
                className="h-auto min-w-[220px] border-0 bg-transparent px-0 py-0 shadow-none"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value)}
                  className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                    filter === item.value
                      ? "bg-slate-950 text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-3 font-medium">Nome</th>
                <th className="pb-3 font-medium">Link público</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Membros</th>
                <th className="pb-3 font-medium">Data criação</th>
                <th className="pb-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={index} className="border-b border-slate-100">
                    <td colSpan={6} className="py-4">
                      <Skeleton className="h-12 w-full rounded-2xl" />
                    </td>
                  </tr>
                ))
              ) : filteredCommunities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6">
                    <EmptyStateCard
                      icon={ShieldCheck}
                      title="Nenhuma comunidade encontrada"
                      description="Ajuste os filtros ou cadastre uma nova comunidade para iniciar a operação no GestorGram."
                      actionLabel="Nova comunidade"
                      onAction={() => navigate("/app/communities/new")}
                    />
                  </td>
                </tr>
              ) : (
                filteredCommunities.map((community) => (
                  <tr key={community.id} className="border-b border-slate-100 text-slate-700">
                    <td className="py-4">
                      <div className="font-medium text-slate-900">{community.name}</div>
                      <div className="mt-1 text-xs text-slate-500">/{community.public_slug}</div>
                    </td>
                    <td className="py-4 text-slate-500">
                      {community.public_url ? (
                        <a href={community.public_url} target="_blank" rel="noreferrer" className="text-sky-700 hover:underline">
                          Abrir link público
                        </a>
                      ) : (
                        "Aguardando link"
                      )}
                    </td>
                    <td className="py-4">{communityStatusBadge(community.status)}</td>
                    <td className="py-4 text-slate-400">Este recurso está preparado para a próxima versão.</td>
                    <td className="py-4 text-slate-500">{formatDate(community.created_at)}</td>
                    <td className="py-4">
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="outline">
                          <Link to="/app/telegram/connect">Conectar bot</Link>
                        </Button>
                        <Button asChild>
                          <Link to="/app/subscription">Ver assinatura</Link>
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
    </PageLayout>
  );
}
