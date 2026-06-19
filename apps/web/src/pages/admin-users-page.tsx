import { FormEvent, useState } from "react";
import { Loader2, Plus, Shield, UserPlus, Users } from "lucide-react";

import { EmptyStateCard } from "@/components/app/empty-state-card";
import { PageLayout } from "@/components/app/page-layout";
import { StatCard } from "@/components/app/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const { users, loading, error, creating, createCustomer } = useAdminUsers(isSuperAdmin);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    organizationName: "",
    password: "",
    organizationStatus: "pending_payment" as "pending_payment" | "active"
  });

  async function handleCreateCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    try {
      await createCustomer(form);
      setSuccessMessage(
        "Cliente criado com sucesso. Envie a senha temporária por um canal seguro e oriente o primeiro login."
      );
      setForm({
        fullName: "",
        email: "",
        organizationName: "",
        password: "",
        organizationStatus: "pending_payment"
      });
      setShowCreateForm(false);
    } catch (nextError) {
      setFormError(
        nextError instanceof Error
          ? nextError.message
          : "Não foi possível criar o cliente agora."
      );
    }
  }

  return (
    <PageLayout
      title="Usuários da plataforma"
      description="Base administrativa global do GestorGram, com foco em auditoria de acesso e suporte operacional."
      badge="Admin"
      badgeVariant="warning"
      actions={
        <Button
          className="rounded-full bg-sky-400 px-5 text-slate-950 hover:bg-sky-300"
          onClick={() => {
            setShowCreateForm((current) => !current);
            setFormError(null);
            setSuccessMessage(null);
          }}
          type="button"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo cliente
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={Users} label="Usuários" value={String(users.length)} description="Contas carregadas nesta visão" />
        <StatCard icon={Shield} label="Acesso" value="Protegido" description="Rota exclusiva de super admin" />
        <StatCard icon={Users} label="Escopo" value="Global" description="Não vinculado ao tenant atual" />
      </div>

      {showCreateForm ? (
        <Card className="rounded-[28px] border border-sky-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <Badge variant="info">Criação manual</Badge>
              <h2 className="mt-3 text-xl font-semibold text-slate-900">Novo cliente</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                Cria o acesso no Supabase Auth, o perfil local e uma organização inicial. Por padrão, o
                cliente entra como pendente de pagamento.
              </p>
            </div>
            <UserPlus className="h-10 w-10 rounded-2xl bg-sky-50 p-2 text-sky-600" />
          </div>

          {formError ? (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          ) : null}

          <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleCreateCustomer}>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Nome do cliente
              <input
                className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                placeholder="Ex: Glauber Luciano"
                required
                type="text"
                value={form.fullName}
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              Email de acesso
              <input
                className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="cliente@email.com"
                required
                type="email"
                value={form.email}
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              Organização
              <input
                className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                onChange={(event) => setForm((current) => ({ ...current, organizationName: event.target.value }))}
                placeholder="Ex: Comunidade Premium"
                required
                type="text"
                value={form.organizationName}
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              Senha temporária
              <input
                className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                minLength={8}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="Mínimo de 8 caracteres"
                required
                type="password"
                value={form.password}
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              Status inicial
              <select
                className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    organizationStatus: event.target.value as "pending_payment" | "active"
                  }))
                }
                value={form.organizationStatus}
              >
                <option value="pending_payment">Pendente de pagamento</option>
                <option value="active">Ativo manualmente</option>
              </select>
            </label>

            <div className="flex items-end gap-3">
              <Button
                className="h-11 rounded-2xl bg-slate-950 px-5 text-white hover:bg-slate-800"
                disabled={creating}
                type="submit"
              >
                {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                Criar cliente
              </Button>
              <Button
                className="h-11 rounded-2xl"
                disabled={creating}
                onClick={() => setShowCreateForm(false)}
                type="button"
                variant="outline"
              >
                Cancelar
              </Button>
            </div>
          </form>

          <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Segurança: a senha temporária não é exibida novamente. Compartilhe com o cliente por um canal seguro.
          </p>
        </Card>
      ) : null}

      {successMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

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
