import { ReactElement, useMemo } from "react";
import {
  BarChart3,
  Bot,
  Building2,
  CreditCard,
  LayoutDashboard,
  LifeBuoy,
  LoaderCircle,
  Settings,
  Shield,
  Sparkles,
  Users,
  Zap
} from "lucide-react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AppShell } from "./components/app/app-shell";
import { useAuth } from "./features/auth/use-auth";
import { useOrganizations } from "./features/organizations/use-organizations";
import { AdminDashboardPage } from "./pages/admin-dashboard-page";
import { AdminPlansPage } from "./pages/admin-plans-page";
import { AuthPage } from "./pages/auth-page";
import { CommunitiesPage } from "./pages/communities-page";
import { CommunityCreatePage } from "./pages/community-create-page";
import { ConnectBotPage } from "./pages/connect-bot-page";
import { ModulePlaceholderPage } from "./pages/module-placeholder-page";
import { PublicCheckoutPage } from "./pages/public-checkout-page";
import { PublicLandingPage } from "./pages/public-landing-page";
import { SubscriptionPage } from "./pages/subscription-page";
import { TelegramGroupsPage } from "./pages/telegram-groups-page";

function ProtectedLayout({
  requiresActiveSubscription = true
}: {
  requiresActiveSubscription?: boolean;
}) {
  const { session } = useAuth();
  const { organizations, loading } = useOrganizations();

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-50">
        <LoaderCircle className="h-6 w-6 animate-spin" />
      </main>
    );
  }

  const organization = organizations[0];
  const organizationNeedsBilling =
    organization &&
    ["pending_payment", "overdue", "suspended", "cancelled"].includes(organization.status);

  if (requiresActiveSubscription && organizationNeedsBilling) {
    return <Navigate to="/app/subscription" replace />;
  }

  return <AppShell />;
}

function SuperAdminGuard({ children }: { children: ReactElement }) {
  const { session } = useAuth();
  const isSuperAdmin = Boolean(session?.user.app_metadata?.is_super_admin);

  if (!isSuperAdmin) {
    return <Navigate to="/app" replace />;
  }

  return children;
}

export function App() {
  const { loading, session } = useAuth();
  const { organizations, loading: organizationsLoading } = useOrganizations();

  const organization = organizations[0];
  const organizationNeedsBilling = useMemo(
    () =>
      organization &&
      ["pending_payment", "overdue", "suspended", "cancelled"].includes(organization.status),
    [organization]
  );

  if (loading || (session && organizationsLoading)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-50">
        <LoaderCircle className="h-6 w-6 animate-spin" />
      </main>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<PublicLandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/c/:slug" element={<PublicCheckoutPage />} />

      <Route path="/app" element={<ProtectedLayout requiresActiveSubscription={false} />}>
        <Route
          index
          element={
            organizationNeedsBilling ? (
              <Navigate to="/app/subscription" replace />
            ) : (
              <Navigate to="/app/dashboard" replace />
            )
          }
        />
        <Route
          path="dashboard"
          element={
            organizationNeedsBilling ? <Navigate to="/app/subscription" replace /> : <AdminDashboardPage />
          }
        />
        <Route
          path="communities"
          element={
            organizationNeedsBilling ? <Navigate to="/app/subscription" replace /> : <CommunitiesPage />
          }
        />
        <Route
          path="communities/new"
          element={
            organizationNeedsBilling ? <Navigate to="/app/subscription" replace /> : <CommunityCreatePage />
          }
        />
        <Route
          path="telegram/connect"
          element={
            organizationNeedsBilling ? <Navigate to="/app/subscription" replace /> : <ConnectBotPage />
          }
        />
        <Route
          path="telegram/groups"
          element={
            organizationNeedsBilling ? <Navigate to="/app/subscription" replace /> : <TelegramGroupsPage />
          }
        />
        <Route
          path="telegram/logs"
          element={
            organizationNeedsBilling ? (
              <Navigate to="/app/subscription" replace />
            ) : (
              <ModulePlaceholderPage
                eyebrow="Telegram"
                title="Logs do bot centralizados"
                description="Aqui vamos concentrar eventos do webhook, falhas do bot e histórico operacional por comunidade."
                icon={Bot}
                highlights={[
                  "Eventos do webhook Telegram com filtros por comunidade",
                  "Erros de permissão e reconexão do bot",
                  "Linha do tempo operacional com auditoria"
                ]}
              />
            )
          }
        />
        <Route
          path="automations/welcome"
          element={
            organizationNeedsBilling ? (
              <Navigate to="/app/subscription" replace />
            ) : (
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
            )
          }
        />
        <Route
          path="automations/approval"
          element={
            organizationNeedsBilling ? (
              <Navigate to="/app/subscription" replace />
            ) : (
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
            )
          }
        />
        <Route
          path="automations/messages"
          element={
            organizationNeedsBilling ? (
              <Navigate to="/app/subscription" replace />
            ) : (
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
            )
          }
        />
        <Route
          path="members/list"
          element={
            organizationNeedsBilling ? (
              <Navigate to="/app/subscription" replace />
            ) : (
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
            )
          }
        />
        <Route
          path="members/stats"
          element={
            organizationNeedsBilling ? (
              <Navigate to="/app/subscription" replace />
            ) : (
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
            )
          }
        />
        <Route path="subscription" element={<SubscriptionPage />} />
        <Route
          path="subscription/history"
          element={
            <ModulePlaceholderPage
              eyebrow="Assinatura"
              title="Histórico financeiro da plataforma"
              description="Aqui vamos detalhar faturas, tentativas, confirmações e recorrências do SaaS GestorGram."
              icon={CreditCard}
              highlights={[
                "Linha do tempo de cobranças",
                "Status por pagamento",
                "Detalhes completos da recorrência"
              ]}
            />
          }
        />
        <Route
          path="admin/plans"
          element={
            <SuperAdminGuard>
              <AdminPlansPage />
            </SuperAdminGuard>
          }
        />
        <Route
          path="admin/users"
          element={
            <SuperAdminGuard>
              <ModulePlaceholderPage
                eyebrow="Admin"
                title="Gestão de usuários da plataforma"
                description="Área reservada para controlar acesso administrativo, roles e suporte operacional."
                icon={Shield}
                highlights={[
                  "Usuários por tenant",
                  "Permissões e roles",
                  "Ações administrativas seguras"
                ]}
              />
            </SuperAdminGuard>
          }
        />
        <Route
          path="admin/organizations"
          element={
            <SuperAdminGuard>
              <ModulePlaceholderPage
                eyebrow="Admin"
                title="Organizações da plataforma"
                description="Tenants, status comerciais e visão operacional consolidada em um só lugar."
                icon={Building2}
                highlights={[
                  "Status da organização",
                  "Plano contratado",
                  "Contexto operacional por tenant"
                ]}
              />
            </SuperAdminGuard>
          }
        />
        <Route
          path="settings/profile"
          element={
            <ModulePlaceholderPage
              eyebrow="Configurações"
              title="Perfil e identidade do workspace"
              description="Ajuste nome, avatar e identidade visual principal do seu workspace GestorGram."
              icon={Settings}
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
              icon={LayoutDashboard}
              highlights={[
                "Notificações e alertas",
                "Preferências de interface",
                "Padronização da operação"
              ]}
            />
          }
        />
      </Route>

      <Route path="/subscription" element={<Navigate to="/app/subscription" replace />} />
      <Route path="/communities" element={<Navigate to="/app/communities" replace />} />
      <Route path="/telegram/connect" element={<Navigate to="/app/telegram/connect" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
