import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/features/auth/use-auth";
import { usePlatformPlans } from "@/features/billing/use-platform-plans";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value / 100);
}

const highlights = [
  "Assinatura SaaS com Pix via Asaas",
  "Painel multi-tenant para donos de comunidades",
  "Conexão com bot Telegram e operação centralizada"
];

export function PublicLandingPage() {
  const { session } = useAuth();
  const { plans, loading } = usePlatformPlans();

  const primaryCtaHref = session ? "/subscription" : "/auth";
  const primaryCtaLabel = session ? "Continuar assinatura" : "Criar conta e assinar";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_35%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] px-6 py-10 text-slate-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-slate-800 bg-slate-900 text-slate-50">
            <span className="w-fit rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-sky-300">
              Gestorgram
            </span>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight">
              Venda, opere e organize sua comunidade Telegram com assinatura SaaS.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-slate-300">
              Uma plataforma para donos de comunidades que precisam cobrar acesso,
              conectar bot, centralizar pagamentos e crescer com operação mais profissional.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-sky-400 text-slate-950 hover:bg-sky-300">
                <Link to={primaryCtaHref}>
                  {primaryCtaLabel}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-slate-700 text-slate-100 hover:bg-slate-800">
                <Link to="/auth">Já tenho conta</Link>
              </Button>
            </div>

            <div className="mt-8 grid gap-3">
              {highlights.map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-sky-300" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="bg-white text-slate-900">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-700">Como funciona</p>
            <div className="mt-5 space-y-4 text-sm text-slate-600">
              <p><strong>1.</strong> Crie sua conta e escolha um plano da plataforma.</p>
              <p><strong>2.</strong> Pague com Pix e libere automaticamente o painel.</p>
              <p><strong>3.</strong> Conecte o bot Telegram e comece a operar sua comunidade.</p>
            </div>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="bg-white text-slate-900">
                  <div className="h-28 animate-pulse rounded-xl bg-slate-100" />
                </Card>
              ))
            : plans.map((plan) => (
                <Card key={plan.id} className="bg-white text-slate-900">
                  <div className="flex h-full flex-col justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-semibold">{plan.name}</h2>
                      <p className="mt-3 text-sm text-slate-500">
                        {plan.description ?? "Plano para operar sua comunidade com mais eficiência."}
                      </p>
                    </div>
                    <div>
                      <div className="text-3xl font-semibold">{formatCurrency(plan.price_cents)}</div>
                      <Button asChild className="mt-4 w-full">
                        <Link to={primaryCtaHref}>Assinar este plano</Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
        </section>
      </div>
    </main>
  );
}
