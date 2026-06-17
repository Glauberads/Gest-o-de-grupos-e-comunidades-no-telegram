import { useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCommunities } from "@/features/communities/use-communities";
import { useOrganizations } from "@/features/organizations/use-organizations";
import { apiRequest } from "@/lib/api";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CommunitiesPage() {
  const { organizations, loading: organizationsLoading } = useOrganizations();
  const organizationId = organizations[0]?.id;
  const { communities, loading, setCommunities } = useCommunities(organizationId);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    if (!organizationId) {
      setMessage("Nenhuma organizacao encontrada para este usuario.");
      return;
    }

    const name = String(formData.get("name") ?? "");

    setSubmitting(true);
    setMessage(null);

    try {
      const payload = await apiRequest<{
        community: {
          id: string;
          name: string;
          description: string | null;
          public_slug: string;
          public_url: string | null;
          image_url: string | null;
          status: string;
          auto_approve_enabled: boolean;
          welcome_message: string | null;
        };
      }>("/api/communities", {
        method: "POST",
        body: {
          organizationId,
          name,
          description: String(formData.get("description") ?? ""),
          telegramChatId: String(formData.get("telegramChatId") ?? "pending-chat-id"),
          publicSlug: slugify(name),
          publicUrl: String(formData.get("publicUrl") ?? "") || undefined,
          imageUrl: String(formData.get("imageUrl") ?? "") || undefined,
          welcomeMessage: String(formData.get("welcomeMessage") ?? "") || undefined,
          autoApproveEnabled: formData.get("autoApproveEnabled") === "on"
        }
      });

      setCommunities((current) => [payload.community, ...current]);
      setMessage("Comunidade criada com sucesso.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao criar comunidade.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#f8fafc_0%,_#e2e8f0_100%)] px-6 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-sky-700">Gestao de comunidades</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Criar e organizar comunidades</h1>
          </div>
          <Button asChild variant="outline">
            <Link to="/">Voltar ao painel</Link>
          </Button>
        </div>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="bg-white">
            <h2 className="text-xl font-semibold text-slate-900">Nova comunidade</h2>
            <p className="mt-2 text-sm text-slate-500">
              Cadastre o basico da comunidade agora e conecte o bot na etapa seguinte.
            </p>

            <form
              className="mt-6 grid gap-4"
              action={(formData) => {
                void handleSubmit(formData);
              }}
            >
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Nome</span>
                <input
                  name="name"
                  placeholder="Ex.: Comunidade Premium"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-400"
                  required
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Descricao</span>
                <textarea
                  name="description"
                  placeholder="Descreva o objetivo da comunidade"
                  className="min-h-28 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-400"
                  required
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Link publico</span>
                <input
                  name="publicUrl"
                  placeholder="https://t.me/..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-400"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Imagem da comunidade</span>
                <input
                  name="imageUrl"
                  placeholder="https://..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-400"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Mensagem de boas-vindas</span>
                <textarea
                  name="welcomeMessage"
                  placeholder="Bem-vindo(a) a comunidade."
                  className="min-h-24 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-400"
                />
              </label>

              <label className="flex items-center gap-3 text-sm text-slate-700">
                <input type="checkbox" name="autoApproveEnabled" defaultChecked />
                Aprovar automaticamente apos pagamento confirmado
              </label>

              {message ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {message}
                </div>
              ) : null}

              <Button disabled={submitting || organizationsLoading}>
                {submitting ? "Criando..." : "Criar comunidade"}
              </Button>
            </form>
          </Card>

          <Card className="bg-slate-950 text-slate-50">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Comunidades criadas</h2>
              {organizationId ? (
                <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  {organizations[0]?.name}
                </span>
              ) : null}
            </div>

            <div className="mt-6 grid gap-4">
              {loading ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">
                  Carregando comunidades...
                </div>
              ) : communities.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">
                  Nenhuma comunidade cadastrada ainda.
                </div>
              ) : (
                communities.map((community) => (
                  <div
                    key={community.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-lg font-semibold">{community.name}</div>
                        <div className="text-sm text-slate-400">/{community.public_slug}</div>
                      </div>
                      <Button asChild variant="outline">
                        <Link to="/telegram/connect">Conectar bot</Link>
                      </Button>
                    </div>
                    <p className="mt-3 text-sm text-slate-300">
                      {community.description ?? "Sem descricao"}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}

