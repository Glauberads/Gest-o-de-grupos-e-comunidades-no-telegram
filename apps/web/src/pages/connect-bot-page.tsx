import { useState } from "react";
import { Bot, CheckCircle2, Link2, Send, Shield } from "lucide-react";

import { PageLayout } from "@/components/app/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCommunityForm } from "@/features/communities/use-community-form";
import { useOrganizations } from "@/features/organizations/use-organizations";
import { useTelegramBotStatus } from "@/features/telegram/use-telegram-bot-status";
import { apiRequest } from "@/lib/api";

const steps = [
  {
    title: "Criar bot no BotFather",
    description: "Crie o bot, defina o nome e copie o token oficial gerado pelo Telegram."
  },
  {
    title: "Adicionar o bot ao grupo",
    description: "Inclua o bot como administrador com permissão para convidar e restringir membros."
  },
  {
    title: "Conectar no painel",
    description: "Valide o token, vincule o grupo certo e faça um teste de mensagem."
  }
];

export function ConnectBotPage() {
  const { organizations } = useOrganizations();
  const organization = organizations[0];
  const { communities, loading: communitiesLoading } = useCommunityForm(organization?.id);
  const { telegramBot } = useTelegramBotStatus(organization?.id);
  const [botMessage, setBotMessage] = useState<string | null>(null);
  const [groupMessage, setGroupMessage] = useState<string | null>(null);
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [botSubmitting, setBotSubmitting] = useState(false);
  const [groupSubmitting, setGroupSubmitting] = useState(false);
  const [testSubmitting, setTestSubmitting] = useState(false);

  async function handleBotConnect(formData: FormData) {
    if (!organization?.id) {
      setBotMessage("Nenhuma organização encontrada para este usuário.");
      return;
    }

    setBotSubmitting(true);
    setBotMessage(null);

    try {
      await apiRequest("/api/telegram/bot/connect", {
        method: "POST",
        body: {
          organizationId: organization.id,
          token: String(formData.get("token") ?? "")
        }
      });

      setBotMessage("Bot validado e salvo com sucesso.");
    } catch (error) {
      setBotMessage(error instanceof Error ? error.message : "Falha ao conectar bot.");
    } finally {
      setBotSubmitting(false);
    }
  }

  async function handleGroupConnect(formData: FormData) {
    if (!organization?.id) {
      setGroupMessage("Nenhuma organização encontrada para este usuário.");
      return;
    }

    setGroupSubmitting(true);
    setGroupMessage(null);

    try {
      await apiRequest("/api/telegram/groups", {
        method: "POST",
        body: {
          organizationId: organization.id,
          communityId: String(formData.get("communityId") ?? ""),
          telegramChatId: String(formData.get("telegramChatId") ?? ""),
          title: String(formData.get("title") ?? ""),
          chatType: String(formData.get("chatType") ?? "group"),
          botIsAdmin: formData.get("botIsAdmin") === "on",
          canInviteUsers: formData.get("canInviteUsers") === "on",
          canRestrictMembers: formData.get("canRestrictMembers") === "on",
          webhookSecret: String(formData.get("webhookSecret") ?? "") || undefined
        }
      });

      setGroupMessage("Grupo vinculado com sucesso.");
    } catch (error) {
      setGroupMessage(error instanceof Error ? error.message : "Falha ao salvar grupo.");
    } finally {
      setGroupSubmitting(false);
    }
  }

  async function handleTestMessage(formData: FormData) {
    if (!organization?.id) {
      setTestMessage("Nenhuma organização encontrada para este usuário.");
      return;
    }

    setTestSubmitting(true);
    setTestMessage(null);

    try {
      await apiRequest("/api/telegram/test-message", {
        method: "POST",
        body: {
          organizationId: organization.id,
          telegramChatId: String(formData.get("telegramChatId") ?? ""),
          text: String(formData.get("text") ?? "")
        }
      });

      setTestMessage("Mensagem de teste enviada com sucesso.");
    } catch (error) {
      setTestMessage(error instanceof Error ? error.message : "Falha ao enviar mensagem de teste.");
    } finally {
      setTestSubmitting(false);
    }
  }

  return (
    <PageLayout
      title="Conectar bot Telegram"
      description="Onboarding visual para validar o bot, vincular os grupos corretos e garantir que a operação esteja pronta para funcionar sem atrito."
      badge="Telegram"
    >
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="rounded-[28px] border border-slate-800 bg-[linear-gradient(180deg,_rgba(11,20,37,0.96)_0%,_rgba(15,23,42,0.98)_100%)] p-6 text-slate-50 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Onboarding</div>
              <h2 className="mt-2 text-xl font-semibold">Fluxo recomendado</h2>
            </div>
            {telegramBot?.username ? <Badge variant="success">Conectado</Badge> : <Badge variant="warning">Pendente</Badge>}
          </div>

          <div className="mt-6 space-y-4">
            {steps.map((step, index) => (
              <div key={step.title} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-400/10 text-sky-300">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-white">{step.title}</div>
                    <div className="mt-1 text-sm text-slate-400">{step.description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Status atual</div>
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-200">
              <Bot className="h-4 w-4 text-sky-300" />
              {telegramBot?.username
                ? `Bot @${telegramBot.username} já conectado neste workspace`
                : "Nenhum bot validado ainda"}
            </div>
          </div>
        </Card>

        <div className="grid gap-6">
          <Card className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Bot className="h-5 w-5 text-sky-700" />
              <h2 className="text-xl font-semibold text-slate-900">1. Validar token do bot</h2>
            </div>
            <form className="mt-5 grid gap-4" action={(formData) => void handleBotConnect(formData)}>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Token gerado pelo BotFather</span>
                <Input type="password" name="token" placeholder="123456:AA..." required />
              </label>
              {botMessage ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {botMessage}
                </div>
              ) : null}
              <Button disabled={botSubmitting}>{botSubmitting ? "Validando..." : "Conectar bot"}</Button>
            </form>
          </Card>

          <Card className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Link2 className="h-5 w-5 text-sky-700" />
              <h2 className="text-xl font-semibold text-slate-900">2. Vincular grupo ao painel</h2>
            </div>
            <form className="mt-5 grid gap-4" action={(formData) => void handleGroupConnect(formData)}>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Comunidade</span>
                <select
                  name="communityId"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400"
                  required
                  disabled={communitiesLoading}
                >
                  <option value="">Selecione uma comunidade</option>
                  {communities.map((community) => (
                    <option key={community.id} value={community.id}>
                      {community.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Título do grupo</span>
                  <Input name="title" placeholder="Ex.: G-ADS Premium" required />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Chat ID</span>
                  <Input name="telegramChatId" placeholder="-1004367730718" required />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Tipo do chat</span>
                  <select
                    name="chatType"
                    defaultValue="group"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400"
                  >
                    <option value="group">Grupo</option>
                    <option value="supergroup">Supergrupo</option>
                    <option value="channel">Canal</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Webhook secret</span>
                  <Input name="webhookSecret" placeholder="Segredo interno do grupo" />
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <input type="checkbox" name="botIsAdmin" defaultChecked /> Bot admin
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <input type="checkbox" name="canInviteUsers" defaultChecked /> Convida usuários
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <input type="checkbox" name="canRestrictMembers" defaultChecked /> Restringe membros
                </label>
              </div>

              {groupMessage ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {groupMessage}
                </div>
              ) : null}

              <Button disabled={groupSubmitting || communitiesLoading}>
                {groupSubmitting ? "Salvando grupo..." : "Salvar grupo conectado"}
              </Button>
            </form>
          </Card>

          <Card className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Send className="h-5 w-5 text-sky-700" />
              <h2 className="text-xl font-semibold text-slate-900">3. Testar envio de mensagem</h2>
            </div>
            <form className="mt-5 grid gap-4" action={(formData) => void handleTestMessage(formData)}>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Chat ID</span>
                <Input name="telegramChatId" placeholder="-1004367730718" required />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Mensagem</span>
                <textarea
                  name="text"
                  className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400"
                  placeholder="Olá, este é um teste operacional do GestorGram."
                  required
                />
              </label>
              {testMessage ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {testMessage}
                </div>
              ) : null}
              <Button disabled={testSubmitting}>
                <Shield className="mr-2 h-4 w-4" />
                {testSubmitting ? "Enviando teste..." : "Enviar mensagem teste"}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}
