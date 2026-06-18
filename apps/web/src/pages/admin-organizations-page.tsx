import { Building2, Shield, Wallet } from "lucide-react";

import { EmptyStateCard } from "@/components/app/empty-state-card";
import { PageLayout } from "@/components/app/page-layout";
import { StatCard } from "@/components/app/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/use-auth";
import { useAdminOrganizations } from "@/features/admin/use-admin-organizations";

function statusBadge(status?: string | null) {
  switch (status) {
    case "active":
      return <Badge variant="success">Ativa</Badge>;
    case "pending_payment":
      return <Badge variant="warning">Pendente</Badge>;
    case "overdue":
      return <Badge variant="danger">Vencida</Badge>;
    case "suspended":
      return <Badge variant="danger">Suspensa</Badge>;
    case "cancelled":
      return <Badge variant="default">Cancelada</Badge>;
    default:
      return <Badge variant="info">{status ?? "Sem status"}</Badge>;
  }
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

export function AdminOrganizationsPage() {
  const { session } = useAuth();
  const isSuperAdmin = session?.user.app_metadata?.is_super_admin === true;
  const { organizations, loading, error } = useAdminOrganizations(isSuperAdmin);

  const activeCount = organizations.filter((item) => item.status === "active").length;

  return (
    <PageLayout
      title="Organizações da plataforma"
      description="Visão global dos tenants do GestorGram para suporte, auditoria e operação comercial."
      badge="Admin"
      badgeVariant="warning"
    >
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={Building2} label="Organizações" value={String(organizations.length)} description="Tenants listados" />
        <StatCard icon={Wallet} label="Ativas" value={String(activeCount)} description="Prontas para operar" />
        <StatCard icon={Shield} label="Escopo" value="Global" description="Separado do painel do tenant" />
      </div>

      <Card className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Tenants cadastrados</h2>
            <p className="mt-1 text-sm text-slate-500">
              Status real da assinatura e identidade de cada organização.
            </p>
          </div>
          <Badge variant="dark">Global</Badge>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-3 font-medium">Organização</th>
                <th className="pb-3 font-medium">Slug</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Owner</th>
                <th className="pb-3 font-medium">Criada em</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    <td colSpan={5} className="py-4">
                      <Skeleton className="h-12 w-full rounded-2xl" />
                    </td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={5} className="py-6">
                    <EmptyStateCard
                      icon={Shield}
                      title="Não foi possível carregar as organizações"
                      description={error}
                    />
                  </td>
                </tr>
              ) : organizations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6">
                    <EmptyStateCard
                      icon={Building2}
                      title="Nenhuma organização encontrada"
                      description="Os tenants aparecerão aqui assim que forem criados via onboarding."
                    />
                  </td>
                </tr>
              ) : (
                organizations.map((organization) => (
                  <tr key={organization.id} className="border-b border-slate-100 text-slate-700">
                    <td className="py-4">
                      <div className="font-medium text-slate-900">{organization.name}</div>
                      <div className="mt-1 text-xs text-slate-500">{organization.id}</div>
                    </td>
                    <td className="py-4 text-slate-500">{organization.slug}</td>
                    <td className="py-4">{statusBadge(organization.status)}</td>
                    <td className="py-4 text-slate-500">{organization.owner_user_id}</td>
                    <td className="py-4 text-slate-500">{formatDate(organization.created_at)}</td>
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
