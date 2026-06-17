import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Navigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { bootstrapTenant } from "@/features/auth/bootstrap-tenant";
import { useAuth } from "@/features/auth/use-auth";
import { supabase } from "@/lib/supabase";

type AuthMode = "signin" | "signup";

export function AuthPage() {
  const { loading, session } = useAuth();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!loading && session) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(formData: FormData) {
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const fullName = String(formData.get("fullName") ?? "");
    const organizationName = String(formData.get("organizationName") ?? "");

    setSubmitting(true);
    setMessage(null);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              organization_name: organizationName
            }
          }
        });

        if (error) {
          throw error;
        }

        const {
          data: { session: nextSession }
        } = await supabase.auth.getSession();

        if (nextSession) {
          await bootstrapTenant(organizationName);
        }

        setMessage("Conta criada. Se a confirmacao de email estiver ativa no Supabase, confirme antes de entrar.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          throw error;
        }
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha na autenticacao.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_35%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] px-6 py-10">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-slate-800 bg-slate-900 text-slate-50">
          <span className="w-fit rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-sky-300">
            Supabase auth
          </span>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight">
            Painel admin com autenticacao real e base pronta para multi-tenant.
          </h1>
          <p className="mt-4 text-sm text-slate-300">
            Nesta etapa, conectamos o login ao seu projeto Supabase e deixamos o backend preparado
            para usar `service role` na persistencia segura do tenant.
          </p>
        </Card>

        <Card className="bg-white">
          <div className="mb-6 flex gap-2 rounded-2xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium ${mode === "signin" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium ${mode === "signup" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}
            >
              Criar conta
            </button>
          </div>

          <form
            className="space-y-4"
            action={(formData) => {
              void handleSubmit(formData);
            }}
          >
            {mode === "signup" ? (
              <>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">Nome completo</span>
                  <input
                    name="fullName"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400"
                    placeholder="Seu nome"
                    required
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">Nome da operacao</span>
                  <input
                    name="organizationName"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400"
                    placeholder="Minha comunidade premium"
                    required
                  />
                </label>
              </>
            ) : null}

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <input
                type="email"
                name="email"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400"
                placeholder="admin@comunidade.com"
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Senha</span>
              <input
                type="password"
                name="password"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400"
                placeholder="Minimo de 8 caracteres"
                minLength={8}
                required
              />
            </label>

            {message ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {message}
              </div>
            ) : null}

            <Button className="w-full" size="lg" disabled={submitting}>
              {submitting ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Processando
                </>
              ) : mode === "signin" ? (
                "Entrar no painel"
              ) : (
                "Criar conta"
              )}
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
