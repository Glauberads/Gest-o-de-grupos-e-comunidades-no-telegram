import { useMemo, useState } from "react";
import {
  Bot,
  MessageSquareText,
  Settings,
  Shield,
  Sparkles,
  Users,
  Workflow
} from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";

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
import { useTelegramBotStatus } from "@/features/telegram/use-telegram-bot-status";
import { useTelegramGroupDetail } from "@/features/telegram/use-telegram-group-detail";
import { useTelegramLogs } from "@/features/telegram/use-telegram-logs";
import { apiRequest } from "@/lib/api";

const tabs = [
  { key: "overview", label: "Visão geral", icon: Bot },
  { key: "automations", label: "Automações", icon: Workflow },
  { key: "moderation", label: "Moderação", icon: Shield },
  { key: "messages", label: "Mensagens", icon: MessageSquareText },
  { key: "logs", label: "Logs", icon: Sparkles },
  { key: "members", label: "Membros", icon: Users },
  { key: "settings", label: "Configurações", icon: Settings }
] as const;

function statusBadge(group: any) {
  if (!group) {
    return <Badge variant="info">Carregando</Badge>;
  }

  if (group.bot_is_admin) {
    return <Badge variant="success">Operacional</Badge>;
  }

  return <Badge variant="warning">Revisar permissões</Badge>;
}

function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function TelegramGroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get("tab") ?? "overview") as (typeof tabs)[number]["key"];

  const { organizations } = useOrganizations();
  const organization = organizations[0];
  const { group, loading, error } = useTelegramGroupDetail(groupId, organization?.id);
  const { communities } = useCommunities(organization?.id);
  const { telegramBot } = useTelegramBotStatus(organization?.id);
  const { logs, loading: logsLoading } = useTelegramLogs(organization?.id);
  const [messageFeedback, setMessageFeedback] = useState<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);

  const community = communities.find((item) => item.id === group?.community_id);
  const groupLogs = useMemo(
    () => logs.filter((item) => item.community_id === group?.community_id),
    [group?.community_id, logs]
  );

  async function handleSendTestMessage(formData: FormData) {
    if (!organization?.id || !group?.telegram_chat_id) {
      setMessageFeedback("Grupo ou organização indisponível para o envio do teste.");
      return;
    }

    setSendingMessage(true);
    setMessageFeedback(null);

    try {
      await apiRequest("/api/telegram/test-message", {
        method: "POST",
        body: {
          organizationId: organization.id,
          telegramChatId: group.telegram_chat_id,
          text: String(formData.get("text") ?? "")
        }
      });

      setMessageFeedback("Mensagem de teste enviada com sucesso para este grupo.");
    } catch (nextError) {
      setMessageFeedback(
        nextError instanceof Error ? nextError.message : "Não foi possível enviar a mensagem teste."
      );
    } finally {
      setSendingMessage(false);
    }
  }

  function renderPreparedState(title: string, description: string) {
    return (
      <EmptyStateCard
        icon={Sparkles}
        title={title}
        description={`${description} Este recurso está preparado para a próxima versão.`}
      />
    );
  }

  function renderTabContent() {
    if (!group) {
      return null;
    }

    switch (activeTab) {
      case "overview":
        return (
          <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
            <Card className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Resumo do grupo</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Central para confirmar comunidade, chat ID, permissões e próximos passos da operação.
                  </p>
                </div>
                {statusBadge(group)}
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Grupo</div>
                  <div className="mt-2 text-lg font-semibold text-slate-900">{group.title}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Comunidade</div>
                  <div className="mt-2 text-lg font-semibold text-slate-900">
                    {community?.name ?? "Comunidade não localizada"}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Chat ID</div>
                  <div className="mt-2 text-sm font-medium text-slate-900">{group.telegram_chat_id}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Bot</div>
                  <div className="mt-2 text-sm font-medium text-slate-900">
                    {telegramBot?.username ? `@${telegramBot.username}` : "Bot ainda não validado"}
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Próximo passo recomendado: confirme que o bot está como administrador no Telegram e siga para as automações ou para o envio de mensagem teste.
              </div>
            </Card>

            <Card className="rounded-[28px] border border-slate-800 bg-[linear-gradient(180deg,_rgba(11,20,37,0.96)_0%,_rgba(15,23,42,0.98)_100%)] p-6 text-slate-50 shadow-sm">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Ações rápidas</div>
              <h2 className="mt-2 text-xl font-semibold">O que você pode fazer agora</h2>

              <div className="mt-6 grid gap-3">
                <Button variant="outline" className="justify-start border-slate-700 text-slate-100 hover:bg-slate-800" onClick={() => setSearchParams({ tab: "messages" })}>
                  Enviar mensagem teste
                </Button>
                <Button variant="outline" className="justify-start border-slate-700 text-slate-100 hover:bg-slate-800" onClick={() => setSearchParams({ tab: "logs" })}>
                  Ver logs do grupo
                </Button>
                <Button variant="outline" className="justify-start border-slate-700 text-slate-100 hover:bg-slate-800" onClick={() => setSearchParams({ tab: "automations" })}>
                  Configurar automações
                </Button>
                <Button variant="outline" className="justify-start border-slate-700 text-slate-100 hover:bg-slate-800" onClick={() => setSearchParams({ tab: "settings" })}>
                  Abrir configurações
                </Button>
              </div>
            </Card>
          </div>
        );

      case "messages":
        return (
          <Card className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <MessageSquareText className="h-5 w-5 text-sky-700" />
              <h2 className="text-xl font-semibold text-slate-900">Mensagem de teste</h2>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Envie uma mensagem real para este grupo e confirme que o bot está operacional.
            </p>

            <form className="mt-5 grid gap-4" action={(formData) => void handleSendTestMessage(formData)}>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Mensagem</span>
                <textarea
                  name="text"
                  className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400"
                  placeholder="Olá, este é um teste do GestorGram neste grupo."
                  required
                />
              </label>

              {messageFeedback ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {messageFeedback}
                </div>
              ) : null}

              <Button disabled={sendingMessage}>
                {sendingMessage ? "Enviando..." : "Enviar mensagem teste"}
              </Button>
            </form>
          </Card>
        );

      case "logs":
        return (
          <Card className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Logs do grupo</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Histórico operacional filtrado pela comunidade vinculada a este grupo.
                </p>
              </div>
              <Badge variant="dark">{groupLogs.length} evento(s)</Badge>
            </div>

            <div className="mt-6 space-y-3">
              {logsLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full rounded-2xl" />
                ))
              ) : groupLogs.length === 0 ? (
                <EmptyStateCard
                  icon={Sparkles}
                  title="Ainda não há logs para este grupo"
                  description="Depois de conectar, testar mensagens ou operar automações, os eventos aparecerão aqui."
                />
              ) : (
                groupLogs.map((log) => (
                  <div key={log.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium text-slate-900">{log.action}</div>
                      <Badge variant={log.status === "success" ? "success" : "warning"}>
                        {log.status}
                      </Badge>
                    </div>
                    <div className="mt-2 text-sm text-slate-600">
                      {log.message ?? "Evento sem descrição adicional."}
                    </div>
                    <div className="mt-2 text-xs text-slate-400">{formatDate(log.created_at)}</div>
                  </div>
                ))
              )}
            </div>
          </Card>
        );

      case "automations":
        return renderPreparedState(
          "Automações por grupo",
          "Aqui você vai ativar ou desativar boas-vindas, aprovação automática e rotinas específicas deste grupo."
        );

      case "moderation":
        return renderPreparedState(
          "Central de moderação",
          "Aqui ficarão as regras para bloquear links, bloquear palavras, limitar comportamentos e revisar proteção do grupo."
        );

      case "members":
        return renderPreparedState(
          "Membros e estado futuro",
          "Aqui você vai acompanhar a base conectada ao grupo e a evolução dos recursos de acesso."
        );

      case "settings":
        return renderPreparedState(
          "Configurações do grupo",
          "Aqui você vai revisar permissões, webhook secret, dados do chat e preferências operacionais."
        );

      default:
        return renderPreparedState(
          "Área em preparação",
          "Este módulo já está reservado no fluxo do produto."
        );
    }
  }

  if (loading) {
    return (
      <PageLayout
        title="Central do grupo"
        description="Carregando o grupo conectado..."
        badge="Telegram"
      >
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="rounded-[28px] border border-slate-200 bg-white p-5">
              <Skeleton className="h-24 w-full rounded-2xl" />
            </Card>
          ))}
        </div>
      </PageLayout>
    );
  }

  if (error || !group) {
    return (
      <PageLayout
        title="Central do grupo"
        description="Não foi possível abrir a central deste grupo."
        badge="Telegram"
      >
        <EmptyStateCard
          icon={Bot}
          title="Grupo não encontrado"
          description={error ?? "Revise se o grupo ainda está conectado a esta organização."}
          actionLabel="Voltar para grupos conectados"
          onAction={() => {
            window.location.href = "/app/telegram/groups";
          }}
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={`Central do grupo • ${group.title}`}
      description="Use esta central para entender o estado atual do grupo, revisar próximos passos e acessar os módulos operacionais por contexto."
      badge="Telegram"
      actions={
        <>
          <Badge variant="dark">{community?.name ?? "Sem comunidade"}</Badge>
          {statusBadge(group)}
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          icon={Bot}
          label="Bot"
          value={telegramBot?.username ? `@${telegramBot.username}` : "Pendente"}
          description="Bot conectado neste workspace"
        />
        <StatCard
          icon={Shield}
          label="Admin"
          value={group.bot_is_admin ? "Sim" : "Revisar"}
          description="Permissão administrativa do bot"
        />
        <StatCard
          icon={Workflow}
          label="Automações"
          value="Preparado"
          description="Pronto para próxima versão"
        />
        <StatCard
          icon={Users}
          label="Membros"
          value="Futuro"
          description="Base operacional ainda não conectada"
        />
      </div>

      <Card className="rounded-[28px] border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSearchParams({ tab: tab.key })}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                activeTab === tab.key
                  ? "bg-slate-950 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      {renderTabContent()}

      <Card className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Próximos passos sugeridos</h2>
            <p className="mt-1 text-sm text-slate-500">
              Jornada recomendada: revisar permissões do bot, enviar teste e depois acompanhar logs.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to={`/app/telegram/groups/${group.id}?tab=messages`}>Enviar teste</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={`/app/telegram/groups/${group.id}?tab=logs`}>Ver logs</Link>
            </Button>
            <Button asChild>
              <Link to="/app/telegram/groups">Voltar para grupos conectados</Link>
            </Button>
          </div>
        </div>
      </Card>
    </PageLayout>
  );
}
