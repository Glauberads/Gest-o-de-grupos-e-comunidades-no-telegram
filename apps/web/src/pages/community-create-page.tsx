import { useState } from "react";
import { ArrowRight, Bot, Globe, PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { PageLayout } from "@/components/app/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

export function CommunityCreatePage() {
  const navigate = useNavigate();
  const { organizations } = useOrganizations();
  const organizationId = organizations[0]?.id;
  const { setCommunities } = useCommunities(organizationId);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    if (!organizationId) {
      setMessage("Nenhuma organização encontrada para este usuário.");
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
          created_at?: string;
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
      navigate("/app/communities");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao criar comunidade.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageLayout
      title="Nova comunidade"
      description="Cadastre uma nova comunidade em um fluxo limpo, pronto para seguir direto para Telegram, checkout e automações."
      badge="Comunidades"
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <Card className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Dados principais</h2>
            <p className="mt-1 text-sm text-slate-500">
              Mantenha a estrutura enxuta agora. Depois seguimos para a conexão do bot.
            </p>
          </div>

          <form
            className="mt-6 grid gap-4"
            action={(formData) => {
              void handleSubmit(formData);
            }}
          >
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Nome da comunidade</span>
              <Input name="name" placeholder="Ex.: Comunidade Premium" required />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Descrição</span>
              <textarea
                name="description"
                placeholder="Descreva a proposta de valor da comunidade"
                className="min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400"
                required
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Link público</span>
                <Input name="publicUrl" placeholder="https://t.me/..." />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Imagem</span>
                <Input name="imageUrl" placeholder="https://..." />
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Mensagem de boas-vindas</span>
              <textarea
                name="welcomeMessage"
                placeholder="Bem-vindo(a) à comunidade. Seu acesso está ativo."
                className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400"
              />
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <input type="checkbox" name="autoApproveEnabled" defaultChecked />
              Aprovar automaticamente após pagamento confirmado
            </label>

            {message ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {message}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3 pt-2">
              <Button type="submit" disabled={submitting}>
                <PlusCircle className="mr-2 h-4 w-4" />
                {submitting ? "Criando comunidade..." : "Criar comunidade"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/app/communities") }>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>

        <Card className="rounded-[28px] border border-slate-800 bg-[linear-gradient(180deg,_rgba(11,20,37,0.96)_0%,_rgba(15,23,42,0.98)_100%)] p-6 text-slate-50 shadow-sm">
          <div className="flex items-center gap-3">
            <Badge variant="dark">Fluxo recomendado</Badge>
          </div>

          <div className="mt-6 space-y-4">
            {[
              {
                icon: Globe,
                title: "1. Estruture a comunidade",
                description: "Nome, posicionamento, link público e mensagem base da experiência."
              },
              {
                icon: Bot,
                title: "2. Conecte o bot Telegram",
                description: "Valide o token, adicione o bot no grupo e vincule o chat ao painel."
              },
              {
                icon: ArrowRight,
                title: "3. Libere a operação",
                description: "Ative automações, cobrança e o onboarding completo do cliente final."
              }
            ].map((step) => (
              <div key={step.title} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-400/10 text-sky-300">
                    <step.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium text-white">{step.title}</div>
                    <div className="mt-1 text-sm text-slate-400">{step.description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
