import { useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCommunityForm } from "@/features/communities/use-community-form";
import { useOrganizations } from "@/features/organizations/use-organizations";
import { apiRequest } from "@/lib/api";

export function ConnectBotPage() {
  const { organizations, loading: organizationsLoading } = useOrganizations();
  const organization = organizations[0];
  const { communities, loading: communitiesLoading } = useCommunityForm(organization?.id);
  const [botMessage, setBotMessage] = useState<string | null>(null);
  const [groupMessage, setGroupMessage] = useState<string | null>(null);
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [botSubmitting, setBotSubmitting] = useState(false);
  const [groupSubmitting, setGroupSubmitting] = useState(false);
  const [testSubmitting, setTestSubmitting] = useState(false);

  async function handleBotConnect(formData: FormData) {
    if (!organization?.id) {
      setBotMessage("Nenhuma organizacao encontrada para este usuario.");
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
      setGroupMessage("Nenhuma organizacao encontrada para este usuario.");
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
      setTestMessage("Nenhuma organizacao encontrada para este usuario.");
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
    <main className="min-h-screen bg-[linear-gradient(180deg,_#f8fafc_0%,_#e2e8f0_100%)] px-6 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-sky-700">Telegram bot</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">
              Conectar bot e vincular grupo
            </h1>
          </div>
          <Button asChild variant="outline">
            <Link to="/">Voltar ao painel</Link>
          </Button>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Card className="bg-white">
            <h2 className="text-xl font-semibold text-slate-900">1. Conectar bot</h2>
            <p className="mt-2 text-sm text-slate-500">
              Cole o token gerado pelo BotFather para validar o bot com `getMe`.
            </p>

            <form
              className="mt-6 grid gap-4"
              action={(formData) => {
                void handleBotConnect(formData);
              }}
            >
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Token do bot</span>
                <input
                  type="password"
                  name="token"
                  placeholder="123456:AA..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-400"
                  required
                />
              </label>

              {botMessage ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {botMessage}
                </div>
              ) : null}

              <Button disabled={botSubmitting || organizationsLoading}>
                {botSubmitting ? "Validando..." : "Conectar bot"}
              </Button>
            </form>
          </Card>

          <Card className="bg-white">
            <h2 className="text-xl font-semibold text-slate-900">2. Vincular grupo</h2>
            <p className="mt-2 text-sm text-slate-500">
              Cadastre o grupo e informe o `chat_id` para que o sistema opere a comunidade.
            </p>

            <form
              className="mt-6 grid gap-4"
              action={(formData) => {
                void handleGroupConnect(formData);
              }}
            >
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Comunidade</span>
                <select
                  name="communityId"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-400"
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

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Titulo do grupo</span>
                <input
                  name="title"
                  placeholder="Ex.: G-ADS Premium"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-400"
                  required
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Chat ID</span>
                <input
                  name="telegramChatId"
                  placeholder="-1004367730718"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-400"
                  required
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Tipo do chat</span>
                <select
                  name="chatType"
                  defaultValue="group"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-400"
                >
                  <option value="group">Grupo</option>
                  <option value="supergroup">Supergrupo</option>
                  <option value="channel">Canal</option>
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Webhook secret</span>
                <input
                  name="webhookSecret"
                  placeholder="Segredo interno do bot"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-400"
                />
              </label>

              <label className="flex items-center gap-3 text-sm text-slate-700">
                <input type="checkbox" name="botIsAdmin" defaultChecked />
                Bot ja esta como administrador
              </label>
              <label className="flex items-center gap-3 text-sm text-slate-700">
                <input type="checkbox" name="canInviteUsers" defaultChecked />
                Bot pode convidar usuarios
              </label>
              <label className="flex items-center gap-3 text-sm text-slate-700">
                <input type="checkbox" name="canRestrictMembers" defaultChecked />
                Bot pode restringir/remover membros
              </label>

              {groupMessage ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {groupMessage}
                </div>
              ) : null}

              <Button disabled={groupSubmitting || communitiesLoading}>
                {groupSubmitting ? "Salvando..." : "Salvar grupo"}
              </Button>
            </form>
          </Card>
        </section>

        <Card className="bg-slate-950 text-slate-50">
          <h2 className="text-xl font-semibold">3. Enviar mensagem teste</h2>
          <p className="mt-2 text-sm text-slate-400">
            Use este teste para confirmar que o bot esta no grupo e com permissao para enviar mensagens.
          </p>

          <form
            className="mt-6 grid gap-4"
            action={(formData) => {
              void handleTestMessage(formData);
            }}
          >
            <input
              name="telegramChatId"
              placeholder="-1004367730718"
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-sky-400"
              required
            />
            <textarea
              name="text"
              placeholder="Mensagem de teste do Gestorgram."
              className="min-h-24 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-sky-400"
              required
              defaultValue="Mensagem de teste enviada pelo Gestorgram."
            />

            {testMessage ? (
              <div className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-300">
                {testMessage}
              </div>
            ) : null}

            <Button disabled={testSubmitting}>
              {testSubmitting ? "Enviando..." : "Enviar mensagem teste"}
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
