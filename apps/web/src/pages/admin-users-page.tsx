import { Shield, Users } from "lucide-react";

import { EmptyStateCard } from "@/components/app/empty-state-card";
import { PageLayout } from "@/components/app/page-layout";
import { StatCard } from "@/components/app/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/use-auth";
import { useAdminUsers } from "@/features/admin/use-admin-users";

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

export function AdminUsersPage() {
  const { session } = useAuth();
  const isSuperAdmin = session?.user.app_metadata?.is_super_admin === true;
  const { users, loading, error } = useAdminUsers(isSuperAdmin);

  return (
    <PageLayout
      title="Usuários da plataforma"
      description="Base administrativa global do GestorGram, com foco em auditoria de acesso e suporte operacional."
      badge="Admin"
      badgeVariant="warning"
    >
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={Users} label="Usuários" value={String(users.length)} description="Contas carregadas nesta visão" />
        <StatCard icon={Shield} label="Acesso" value="Protegido" description="Rota exclusiva de super admin" />
        <StatCard icon={Users} label="Escopo" value="Global" description="Não vinculado ao tenant atual" />
      </div>

      <Card className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Inventário de usuários</h2>
            <p className="mt-1 text-sm text-slate-500">
              Visualização segura das contas já persistidas no backend.
            </p>
          </div>
          <Badge variant="dark">Global</Badge>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-3 font-medium">Nome</th>
                <th className="pb-3 font-medium">Email</th>
                <th className="pb-3 font-medium">Criado em</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    <td colSpan={3} className="py-4">
                      <Skeleton className="h-12 w-full rounded-2xl" />
                    </td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={3} className="py-6">
                    <EmptyStateCard icon={Shield} title="Não foi possível carregar os usuários" description={error} />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6">
                    <EmptyStateCard
                      icon={Users}
                      title="Nenhum usuário encontrado"
                      description="Quando houver contas cadastradas na plataforma, elas aparecerão aqui."
                    />
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100 text-slate-700">
                    <td className="py-4">
                      <div className="font-medium text-slate-900">{user.full_name ?? "Sem nome definido"}</div>
                      <div className="mt-1 text-xs text-slate-500">{user.id}</div>
                    </td>
                    <td className="py-4">{user.email}</td>
                    <td className="py-4 text-slate-500">{formatDate(user.created_at)}</td>
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
