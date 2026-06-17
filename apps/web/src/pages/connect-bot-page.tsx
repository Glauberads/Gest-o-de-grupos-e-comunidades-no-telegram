import { useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useOrganizations } from "@/features/organizations/use-organizations";
import { useCommunityForm } from "@/features/communities/use-community-form";
import { apiRequest } from "@/lib/api";

export function ConnectBotPage() {
  const { organizations, loading: organizationsLoading } = useOrganizations();
  const organizationId = organizations[0]?.id;
  const { communities, loading: communitiesLoading } = useCommunityForm(organizationId);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    if (!organizationId) {
      setMessage("Nenhuma organizacao encontrada para este usuario.");
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      await apiRequest("/api/telegram/connect", {
        method: "POST",
        body: {
          organizationId,
          communityId: String(formData.get("communityId") ?? ""),
          telegramChatId: String(formData.get("telegramChatId") ?? ""),
          title: String(formData.get("title") ?? ""),
          chatType: String(formData.get("chatType") ?? "group"),
          botIsAdmin: formData.get("botIsAdmin") === "on",
          canInviteUsers: formData.get("canInviteUsers") === "on",
          canRestrictMembers: formData.get("canRestrictMembers") === "on",
          webhookSecret: String(formData.get("webhookSecret") ?? "")
        }
      });

      setMessage("Configuracao do Telegram salva com sucesso.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao salvar configuracao.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#f8fafc_0%,_#e2e8f0_100%)] px-6 py-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-sky-700">Telegram setup</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Conectar bot ao grupo</h1>
          </div>
          <Button asChild variant="outline">
            <Link to="/">Voltar ao painel</Link>
          </Button>
        </div>

        <Card className="bg-white">
          <form
            className="grid gap-4"
            action={(formData) => {
              void handleSubmit(formData);
            }}
          >
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Comunidade</span>
              <select
                name="communityId"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-400"
                required
                disabled={organizationsLoading || communitiesLoading}
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
              <span className="text-sm font-medium text-slate-700">Chat ID do Telegram</span>
              <input
                name="telegramChatId"
                placeholder="Ex.: -1004367730718"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-400"
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Tipo do chat</span>
              <select
                name="chatType"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-400"
                defaultValue="group"
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
                placeholder="Segredo para uso interno"
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
              Bot pode restringir ou remover membros
            </label>

            {message ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {message}
              </div>
            ) : null}

            <Button disabled={submitting}>
              {submitting ? "Salvando..." : "Salvar configuracao do bot"}
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}

