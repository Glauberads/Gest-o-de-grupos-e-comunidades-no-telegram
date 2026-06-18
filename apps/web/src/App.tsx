import { lazy, Suspense, type ReactNode } from "react";
import {
  BarChart3,
  Building2,
  CreditCard,
  LayoutDashboard,
  LifeBuoy,
  LoaderCircle,
  Shield,
  Sparkles,
  Users,
  Zap
} from "lucide-react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";

import { AppShell } from "./components/app/app-shell";
import { Card } from "./components/ui/card";
import { useAuth } from "./features/auth/use-auth";
import {
  getSubscriptionStatusDescription,
  isBillingBlockingStatus
} from "./features/organizations/access-control";
import { useOrganizations } from "./features/organizations/use-organizations";
import { ModulePlaceholderPage } from "./pages/module-placeholder-page";
import { SubscriptionBlockedStatePage } from "./pages/subscription-blocked-state-page";

const AuthPage = lazyPage(() => import("./pages/auth-page"), "AuthPage");
const PublicLandingPage = lazyPage(() => import("./pages/public-landing-page"), "PublicLandingPage");
const PublicCheckoutPage = lazyPage(() => import("./pages/public-checkout-page"), "PublicCheckoutPage");
const AdminDashboardPage = lazyPage(() => import("./pages/admin-dashboard-page"), "AdminDashboardPage");
const AdminPlansPage = lazyPage(() => import("./pages/admin-plans-page"), "AdminPlansPage");
const AdminPlatformDashboardPage = lazyPage(
  () => import("./pages/admin-platform-dashboard-page"),
  "AdminPlatformDashboardPage"
);
const AdminUsersPage = lazyPage(() => import("./pages/admin-users-page"), "AdminUsersPage");
const AdminOrganizationsPage = lazyPage(
  () => import("./pages/admin-organizations-page"),
  "AdminOrganizationsPage"
);
const AdminSubscriptionsPage = lazyPage(
  () => import("./pages/admin-subscriptions-page"),
  "AdminSubscriptionsPage"
);
const AdminAuditLogsPage = lazyPage(
  () => import("./pages/admin-audit-logs-page"),
  "AdminAuditLogsPage"
);
const AuditLogsPage = lazyPage(() => import("./pages/audit-logs-page"), "AuditLogsPage");
const CommunitiesPage = lazyPage(() => import("./pages/communities-page"), "CommunitiesPage");
const CommunityCreatePage = lazyPage(
  () => import("./pages/community-create-page"),
  "CommunityCreatePage"
);
const ConnectBotPage = lazyPage(() => import("./pages/connect-bot-page"), "ConnectBotPage");
const SubscriptionPage = lazyPage(() => import("./pages/subscription-page"), "SubscriptionPage");
const SubscriptionHistoryPage = lazyPage(
  () => import("./pages/subscription-history-page"),
  "SubscriptionHistoryPage"
);
const TelegramGroupsPage = lazyPage(
  () => import("./pages/telegram-groups-page"),
  "TelegramGroupsPage"
);
const TelegramGroupDetailPage = lazyPage(
  () => import("./pages/telegram-group-detail-page"),
  "TelegramGroupDetailPage"
);
const TelegramLogsPage = lazyPage(() => import("./pages/telegram-logs-page"), "TelegramLogsPage");

function lazyPage<TModule extends Record<string, unknown>, TKey extends keyof TModule>(
  loader: () => Promise<TModule>,
  exportName: TKey
) {
  return lazy(async () => {
    const module = await loader();
    return {
      default: module[exportName] as React.ComponentType
    };
  });
}

function FullScreenLoader() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-50">
      <LoaderCircle className="h-6 w-6 animate-spin" />
    </main>
  );
}

function RouteLoader() {
  return (
    <div className="space-y-6">
      <Card className="rounded-[28px] border border-slate-800 bg-slate-900/80 p-8 text-slate-100 shadow-sm">
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Carregando módulo do GestorGram...
        </div>
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="h-36 rounded-[28px] border border-slate-200 bg-white shadow-sm" />
        ))}
      </div>
    </div>
  );
}

function LazyRoute({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RouteLoader />}>{children}</Suspense>;
}

function ProtectedAppLayout() {
  const { session, loading } = useAuth();
  const { organizations, loading: organizationsLoading, error } = useOrganizations();
  const isSuperAdmin = session?.user.app_metadata?.is_super_admin === true;

  if (loading || (session && organizationsLoading)) {
    return <FullScreenLoader />;
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (!isSuperAdmin && error) {
    return (
      <SubscriptionBlockedStatePage
        title="Não foi possível carregar sua organização"
        description={error}
      />
    );
  }

  if (!isSuperAdmin && organizations.length === 0) {
    return (
      <SubscriptionBlockedStatePage
        title="Nenhuma organização disponível"
        description="Seu usuário ainda não possui uma organização pronta para operar. Finalize o onboarding ou revise o bootstrap do tenant."
      />
    );
  }

  return <AppShell />;
}

function AppIndexRedirect() {
  const { session } = useAuth();
  const { organizations } = useOrganizations();

  const organization = organizations[0];
  const isSuperAdmin = session?.user.app_metadata?.is_super_admin === true;

  if (isSuperAdmin) {
    return <Navigate to="/app/admin/dashboard" replace />;
  }

  if (organization && isBillingBlockingStatus(organization.status)) {
    return <Navigate to="/app/subscription" replace />;
  }

  return <Navigate to="/app/dashboard" replace />;
}

function TenantSubscriptionGuard() {
  const { session } = useAuth();
  const { organizations } = useOrganizations();
  const organization = organizations[0];
  const isSuperAdmin = session?.user.app_metadata?.is_super_admin === true;

  if (isSuperAdmin) {
    return <Navigate to="/app/admin/dashboard" replace />;
  }

  if (!organization) {
    return (
      <SubscriptionBlockedStatePage
        title="Organização não encontrada"
        description="Não encontramos um tenant válido para esta conta. Revise o onboarding antes de continuar."
      />
    );
  }

  return <Outlet />;
}

function TenantActiveGuard() {
  const { session } = useAuth();
  const { organizations } = useOrganizations();
  const organization = organizations[0];
  const isSuperAdmin = session?.user.app_metadata?.is_super_admin === true;

  if (isSuperAdmin) {
    return <Navigate to="/app/admin/dashboard" replace />;
  }

  if (!organization) {
    return (
      <SubscriptionBlockedStatePage
        title="Organização não encontrada"
        description="Seu acesso ainda não possui um tenant operacional vinculado."
      />
    );
  }

  if (isBillingBlockingStatus(organization.status)) {
    return <Navigate to="/app/subscription" replace />;
  }

  return <Outlet />;
}

function SuperAdminGuard() {
  const { session } = useAuth();
  const isSuperAdmin = session?.user.app_metadata?.is_super_admin === true;

  if (!isSuperAdmin) {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}

export function App() {
  const { loading, session } = useAuth();
  const { organizations, loading: organizationsLoading } = useOrganizations();

  if (loading || (session && organizationsLoading)) {
    return <FullScreenLoader />;
  }

  const organization = organizations[0];

  return (
    <Routes>
      <Route
        path="/"
        element={
          session && organization && !isBillingBlockingStatus(organization.status) ? (
            <Navigate to="/app" replace />
          ) : (
            <LazyRoute>
              <PublicLandingPage />
            </LazyRoute>
          )
        }
      />
      <Route
        path="/auth"
        element={
          <LazyRoute>
            <AuthPage />
          </LazyRoute>
        }
      />
      <Route
        path="/c/:slug"
        element={
          <LazyRoute>
            <PublicCheckoutPage />
          </LazyRoute>
        }
      />

      <Route path="/app" element={<ProtectedAppLayout />}>
        <Route index element={<AppIndexRedirect />} />

        <Route element={<TenantSubscriptionGuard />}>
          <Route
            path="subscription"
            element={
              <LazyRoute>
                <SubscriptionPage />
              </LazyRoute>
            }
          />
          <Route
            path="subscription/history"
            element={
              <LazyRoute>
                <SubscriptionHistoryPage />
              </LazyRoute>
            }
          />
        </Route>

        <Route element={<TenantActiveGuard />}>
          <Route
            path="dashboard"
            element={
              <LazyRoute>
                <AdminDashboardPage />
              </LazyRoute>
            }
          />
          <Route
            path="communities"
            element={
              <LazyRoute>
                <CommunitiesPage />
              </LazyRoute>
            }
          />
          <Route
            path="communities/new"
            element={
              <LazyRoute>
                <CommunityCreatePage />
              </LazyRoute>
            }
          />
          <Route
            path="telegram/connect"
            element={
              <LazyRoute>
                <ConnectBotPage />
              </LazyRoute>
            }
          />
          <Route
            path="telegram/groups"
            element={
              <LazyRoute>
                <TelegramGroupsPage />
              </LazyRoute>
            }
          />
          <Route
            path="telegram/groups/:groupId"
            element={
              <LazyRoute>
                <TelegramGroupDetailPage />
              </LazyRoute>
            }
          />
          <Route
            path="telegram/logs"
            element={
              <LazyRoute>
                <TelegramLogsPage />
              </LazyRoute>
            }
          />
          <Route
            path="automations/welcome"
            element={
              <ModulePlaceholderPage
                eyebrow="Automações"
                title="Boas-vindas inteligentes"
                description="Configure mensagens de entrada, tom da marca e gatilhos iniciais por comunidade."
                icon={Sparkles}
                highlights={[
                  "Templates por comunidade",
                  "Pré-visualização da mensagem",
                  "Ativação gradual por fluxo"
                ]}
              />
            }
          />
          <Route
            path="automations/approval"
            element={
              <ModulePlaceholderPage
                eyebrow="Automações"
                title="Aprovação automática de acesso"
                description="Centralize regras de pagamento confirmado, vencimento e bloqueio em uma única visão."
                icon={Zap}
                highlights={[
                  "Fluxos por status de pagamento",
                  "Tempo de tolerância configurável",
                  "Liberação e remoção automatizadas"
                ]}
              />
            }
          />
          <Route
            path="automations/messages"
            element={
              <ModulePlaceholderPage
                eyebrow="Automações"
                title="Mensagens automáticas do ciclo de vida"
                description="Prepare lembretes de vencimento, reengajamento e mensagens pós-pagamento com contexto claro."
                icon={LifeBuoy}
                highlights={[
                  "Avisos antes do vencimento",
                  "Mensagens pós-cobrança",
                  "Comunicação alinhada ao plano"
                ]}
              />
            }
          />
          <Route
            path="members/list"
            element={
              <ModulePlaceholderPage
                eyebrow="Membros"
                title="Lista operacional de membros"
                description="A próxima etapa desta área trará filtros de status, plano atual e ações rápidas por usuário."
                icon={Users}
                highlights={[
                  "Busca por membro e comunidade",
                  "Status ativo, pendente e vencido",
                  "Ações manuais de liberação e remoção"
                ]}
              />
            }
          />
          <Route
            path="members/stats"
            element={
              <ModulePlaceholderPage
                eyebrow="Membros"
                title="Estatísticas de retenção"
                description="Esta visão vai consolidar crescimento, churn e comportamento de pagamento em um único painel."
                icon={BarChart3}
                highlights={[
                  "Ativação por comunidade",
                  "Churn por ciclo de cobrança",
                  "Tendência de novos membros"
                ]}
              />
            }
          />
          <Route
            path="settings/profile"
            element={
              <ModulePlaceholderPage
                eyebrow="Configurações"
                title="Perfil e identidade do workspace"
                description="Ajuste nome, avatar e identidade visual principal do seu workspace GestorGram."
                icon={LayoutDashboard}
                highlights={[
                  "Dados do administrador",
                  "Identidade da organização",
                  "Preferências de exibição"
                ]}
              />
            }
          />
          <Route
            path="settings/security"
            element={
              <ModulePlaceholderPage
                eyebrow="Configurações"
                title="Segurança e acesso"
                description="Central de segurança preparada para MFA, sessões ativas e políticas de acesso."
                icon={Shield}
                highlights={[
                  "Sessões autenticadas",
                  "Políticas de acesso",
                  "Controles sensíveis centralizados"
                ]}
              />
            }
          />
          <Route
            path="settings/preferences"
            element={
              <ModulePlaceholderPage
                eyebrow="Configurações"
                title="Preferências do produto"
                description="Defina padrões de idioma, notificações e experiência geral do painel."
                icon={Building2}
                highlights={[
                  "Notificações e alertas",
                  "Preferências de interface",
                  "Padronização da operação"
                ]}
              />
            }
          />
          <Route
            path="audit-logs"
            element={
              <LazyRoute>
                <AuditLogsPage />
              </LazyRoute>
            }
          />
        </Route>

        <Route element={<SuperAdminGuard />}>
          <Route
            path="admin/dashboard"
            element={
              <LazyRoute>
                <AdminPlatformDashboardPage />
              </LazyRoute>
            }
          />
          <Route
            path="admin/plans"
            element={
              <LazyRoute>
                <AdminPlansPage />
              </LazyRoute>
            }
          />
          <Route
            path="admin/subscriptions"
            element={
              <LazyRoute>
                <AdminSubscriptionsPage />
              </LazyRoute>
            }
          />
          <Route
            path="admin/audit-logs"
            element={
              <LazyRoute>
                <AdminAuditLogsPage />
              </LazyRoute>
            }
          />
          <Route
            path="admin/users"
            element={
              <LazyRoute>
                <AdminUsersPage />
              </LazyRoute>
            }
          />
          <Route
            path="admin/organizations"
            element={
              <LazyRoute>
                <AdminOrganizationsPage />
              </LazyRoute>
            }
          />
        </Route>
      </Route>

      <Route path="/subscription" element={<Navigate to="/app/subscription" replace />} />
      <Route path="/communities" element={<Navigate to="/app/communities" replace />} />
      <Route path="/telegram/connect" element={<Navigate to="/app/telegram/connect" replace />} />
      <Route path="/checkout/mock" element={<Navigate to="/app/subscription" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
