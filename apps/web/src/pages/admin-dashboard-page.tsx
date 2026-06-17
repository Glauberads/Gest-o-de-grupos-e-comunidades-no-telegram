import { ArrowUpRight, CreditCard, LogOut, Users, Wallet } from "lucide-react";
import { Link } from "react-router-dom";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/use-auth";
import { useOrganizations } from "@/features/organizations/use-organizations";
import { supabase } from "@/lib/supabase";

const metrics = [
  { label: "Membros ativos", value: "124", icon: Users },
  { label: "Receita mensal", value: "R$ 12.480", icon: Wallet },
  { label: "Pendentes Pix", value: "18", icon: CreditCard }
];

export function AdminDashboardPage() {
  const { session } = useAuth();
  const { organizations, loading } = useOrganizations();
  const adminName =
    (session?.user.user_metadata.full_name as string | undefined) ??
    session?.user.email ??
    "Admin";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.20),_transparent_35%),linear-gradient(180deg,_#f8fafc_0%,_#e2e8f0_100%)] px-6 py-10 text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <Card className="overflow-hidden">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <span className="rounded-full border border-sky-200 bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                  MVP foundation
                </span>
                <div className="flex items-center gap-2">
                  <Button asChild variant="outline">
                    <Link to="/communities">Comunidades</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/telegram/connect">Conectar bot</Link>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      void supabase.auth.signOut();
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </Button>
                </div>
              </div>
              <div className="max-w-2xl space-y-4">
                <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
                  Venda acesso ao Telegram com Pix, automacao e operacao multi-tenant.
                </h1>
                <p className="text-base text-slate-600">
                  Ola, {adminName}.{" "}
                  Esta base ja organiza dashboard, checkout publico, API modular,
                  schema inicial e servicos separados para Telegram, Asaas,
                  membros e webhooks.
                </p>
                <p className="text-sm text-slate-500">
                  Tenant atual:{" "}
                  {loading ? "carregando..." : organizations[0]?.name ?? "nenhuma organizacao criada"}
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {metrics.map(({ label, value, icon: Icon }) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-slate-200 bg-white/75 p-4"
                  >
                    <Icon className="mb-4 h-5 w-5 text-sky-600" />
                    <div className="text-2xl font-semibold text-slate-900">{value}</div>
                    <div className="text-sm text-slate-500">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
          <Card className="flex flex-col justify-between bg-slate-900 text-slate-50">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                Proximos marcos
              </p>
              <div className="space-y-3 text-sm text-slate-300">
                <p>1. Persistir auth, comunidades e planos no Postgres.</p>
                <p>2. Conectar webhook real do Asaas com idempotencia.</p>
                <p>3. Liberar convite Telegram apos pagamento confirmado.</p>
              </div>
            </div>
            <Button className="mt-6 w-full bg-sky-400 text-slate-950 hover:bg-sky-300">
              Ver arquitetura
            </Button>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {[
            "services/asaas com Pix primeiro",
            "services/telegram para convite e moderacao",
            "webhooks auditaveis com logs e payload bruto"
          ].map((item) => (
            <Card key={item} className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-700">{item}</span>
              <ArrowUpRight className="h-4 w-4 text-slate-500" />
            </Card>
          ))}
        </section>
      </div>
    </main>
  );
}
