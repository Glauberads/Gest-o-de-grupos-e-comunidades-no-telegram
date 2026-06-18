import type { LucideIcon } from "lucide-react";
import { ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { EmptyStateCard } from "@/components/app/empty-state-card";
import { PageLayout } from "@/components/app/page-layout";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type ModulePlaceholderPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon?: LucideIcon;
  highlights?: string[];
};

export function ModulePlaceholderPage({
  eyebrow,
  title,
  description,
  icon: Icon = Sparkles,
  highlights = []
}: ModulePlaceholderPageProps) {
  const navigate = useNavigate();

  return (
    <PageLayout title={title} description={description} badge={eyebrow} badgeVariant="info">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <EmptyStateCard
          icon={Icon}
          title="Módulo já reposicionado na arquitetura premium"
          description="Esta área ganhou contexto, navegação correta e padrão visual unificado. O próximo passo aqui será apenas plugar dados reais, sem quebrar a experiência do painel."
          actionLabel="Voltar ao dashboard"
          onAction={() => navigate("/app/dashboard")}
        />

        <Card className="rounded-[28px] border border-slate-800 bg-[linear-gradient(180deg,_rgba(11,20,37,0.96)_0%,_rgba(15,23,42,0.98)_100%)] p-6 text-slate-50 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Roadmap visual</div>
              <h2 className="mt-2 text-xl font-semibold">Próxima camada desta seção</h2>
            </div>
            <Badge variant="dark">Contextualizado</Badge>
          </div>

          <div className="mt-6 space-y-3">
            {highlights.length > 0 ? (
              highlights.map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-300"
                >
                  <span>{item}</span>
                  <ArrowRight className="h-4 w-4 text-slate-500" />
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-300">
                Estrutura pronta para receber dados operacionais sem perder consistência visual.
              </div>
            )}
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
