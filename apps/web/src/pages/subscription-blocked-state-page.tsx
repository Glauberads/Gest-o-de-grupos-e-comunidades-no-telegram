import { CreditCard, Lock, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { PageLayout } from "@/components/app/page-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  getSubscriptionCta,
  getSubscriptionStatusDescription,
  getSubscriptionStatusLabel
} from "@/features/organizations/access-control";

type SubscriptionBlockedStatePageProps = {
  status?: string | null;
  title?: string;
  description?: string;
};

export function SubscriptionBlockedStatePage({
  status,
  title,
  description
}: SubscriptionBlockedStatePageProps) {
  const navigate = useNavigate();

  return (
    <PageLayout
      title={title ?? getSubscriptionStatusLabel(status)}
      description={description ?? getSubscriptionStatusDescription(status)}
      badge="Acesso bloqueado"
      badgeVariant="warning"
    >
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">O que está acontecendo</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Seu workspace ainda não está com a assinatura em condição operacional. Enquanto isso, os módulos privados do GestorGram ficam protegidos para evitar configurações incompletas.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Status</div>
              <div className="mt-2 text-lg font-semibold text-slate-900">{getSubscriptionStatusLabel(status)}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Próxima ação</div>
              <div className="mt-2 text-sm font-medium text-slate-700">{getSubscriptionCta(status)}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Liberação</div>
              <div className="mt-2 text-sm font-medium text-slate-700">Automática após confirmação</div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => navigate("/app/subscription")}>
              <CreditCard className="mr-2 h-4 w-4" />
              {getSubscriptionCta(status)}
            </Button>
            <Button variant="outline" onClick={() => navigate("/app/dashboard")}>
              Voltar ao início
            </Button>
          </div>
        </Card>

        <Card className="rounded-[28px] border border-slate-800 bg-[linear-gradient(180deg,_rgba(11,20,37,0.96)_0%,_rgba(15,23,42,0.98)_100%)] p-6 text-slate-50 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-400/10 text-sky-300">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Acesso protegido</div>
              <h2 className="mt-1 text-xl font-semibold">Por que alguns recursos ficam indisponíveis</h2>
            </div>
          </div>

          <div className="mt-6 space-y-3 text-sm text-slate-300">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3">
              Comunidades, Telegram e automações dependem de uma assinatura ativa para garantir fluxo completo e seguro.
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3">
              Assim que o pagamento for confirmado, o painel libera automaticamente sem precisar de suporte manual.
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3">
              Se você já pagou, aguarde alguns instantes e atualize a página. O webhook do Asaas faz essa ativação.
            </div>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
