import { useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, Menu, Search, Sparkles } from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/use-auth";
import { useBillingSubscription } from "@/features/billing/use-billing-subscription";
import { useOrganizations } from "@/features/organizations/use-organizations";
import { appNavigation, flattenNavigation, getVisibleNavigation } from "@/lib/app-navigation";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

function subscriptionBadgeVariant(status?: string, isSuperAdmin?: boolean) {
  if (isSuperAdmin) {
    return "dark" as const;
  }

  switch (status) {
    case "active":
      return "success" as const;
    case "overdue":
      return "warning" as const;
    case "suspended":
    case "cancelled":
      return "danger" as const;
    default:
      return "info" as const;
  }
}

function subscriptionLabel(status?: string, isSuperAdmin?: boolean) {
  if (isSuperAdmin) {
    return "Global";
  }

  switch (status) {
    case "active":
      return "Ativo";
    case "overdue":
      return "Vencendo";
    case "suspended":
      return "Suspenso";
    case "cancelled":
      return "Cancelado";
    case "pending_payment":
      return "Pendente";
    default:
      return "Trial";
  }
}

export function AppShell() {
  const { session } = useAuth();
  const { organizations } = useOrganizations();
  const organization = organizations[0];
  const { subscription } = useBillingSubscription(organization?.id);
  const isSuperAdmin = session?.user.app_metadata?.is_super_admin === true;
  const visibleNavigation = useMemo(() => getVisibleNavigation(isSuperAdmin), [isSuperAdmin]);
  const flatNavigation = useMemo(() => flattenNavigation(appNavigation), []);
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const currentItem =
    flatNavigation
      .filter((item) => location.pathname === item.href || location.pathname.startsWith(`${item.href}/`))
      .sort((left, right) => right.href.length - left.href.length)[0] ?? null;

  const adminName =
    (session?.user.user_metadata.full_name as string | undefined) ??
    session?.user.email ??
    "Admin";
  const currentPlanName = isSuperAdmin
    ? "Platform Admin"
    : subscription?.platform_plans?.name ?? (organization?.status === "active" ? "Starter" : "Setup");
  const scopeTitle = isSuperAdmin ? "Escopo" : "Organização";
  const scopeValue = isSuperAdmin ? "Plataforma GestorGram" : organization?.name ?? "Sem organização";

  return (
    <div className="min-h-screen bg-[#081120] text-slate-100">
      <div className="flex min-h-screen">
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-40 border-r border-slate-800/80 bg-[#0b1425]/95 backdrop-blur-xl transition-all duration-300 lg:sticky lg:translate-x-0",
            isSidebarCollapsed ? "w-[92px]" : "w-[280px]",
            isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-400/15 text-sky-300">
                  <Sparkles className="h-5 w-5" />
                </div>
                {!isSidebarCollapsed ? (
                  <div>
                    <div className="text-sm font-medium text-slate-300">GestorGram</div>
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500">SaaS Console</div>
                  </div>
                ) : null}
              </div>
              <Button
                variant="outline"
                className="hidden border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 lg:inline-flex"
                onClick={() => setIsSidebarCollapsed((value) => !value)}
              >
                <ChevronLeft className={cn("h-4 w-4 transition-transform", isSidebarCollapsed && "rotate-180")} />
              </Button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
              {visibleNavigation.map((section) => (
                <div key={section.title} className="space-y-2">
                  {!isSidebarCollapsed ? (
                    <div className="px-3 text-[11px] uppercase tracking-[0.22em] text-slate-500">{section.title}</div>
                  ) : null}

                  <div className="space-y-1">
                    {(section.children ?? [section]).map((item) => (
                      <NavLink
                        key={item.href}
                        to={item.href}
                        onClick={() => setIsMobileSidebarOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            "group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition",
                            isActive || location.pathname === item.href || location.pathname.startsWith(`${item.href}/`)
                              ? "bg-sky-400/12 text-white shadow-[inset_0_0_0_1px_rgba(56,189,248,0.18)]"
                              : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                          )
                        }
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!isSidebarCollapsed ? (
                          <div className="min-w-0">
                            <div className="truncate font-medium">{item.title}</div>
                            {item.description ? (
                              <div className="truncate text-xs text-slate-500 group-hover:text-slate-400">{item.description}</div>
                            ) : null}
                          </div>
                        ) : null}
                      </NavLink>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-800 px-4 py-4 text-xs text-slate-500">
              {!isSidebarCollapsed ? "GestorGram • painel operacional multi-tenant" : "GG"}
            </div>
          </div>
        </div>

        {isMobileSidebarOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-sm lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        ) : null}

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-[#081120]/95 backdrop-blur-xl">
            <div className="flex items-center gap-4 px-4 py-4 md:px-6">
              <Button
                variant="outline"
                className="border-slate-700 bg-transparent text-slate-200 hover:bg-slate-800 lg:hidden"
                onClick={() => setIsMobileSidebarOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </Button>

              <div className="min-w-0 flex-1">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{currentItem?.title ?? "GestorGram"}</div>
                <div className="truncate text-lg font-semibold text-white">
                  {currentItem?.description ?? "SaaS dashboard premium para operação de comunidades"}
                </div>
              </div>

              <div className="hidden w-full max-w-sm items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-400 md:flex">
                <Search className="h-4 w-4" />
                <Input
                  className="h-auto border-0 bg-transparent px-0 py-0 text-slate-100 shadow-none focus:ring-0"
                  placeholder="Pesquisar comunidades, grupos ou pagamentos..."
                />
              </div>

              <div className="hidden items-center gap-3 xl:flex">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-2">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{scopeTitle}</div>
                  <div className="text-sm font-medium text-white">{scopeValue}</div>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-2">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Modo</div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{currentPlanName}</span>
                    <Badge variant={subscriptionBadgeVariant(organization?.status, isSuperAdmin)}>
                      {subscriptionLabel(organization?.status, isSuperAdmin)}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen((value) => !value)}
                  className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-left"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-400/15 text-sm font-semibold text-sky-300">
                    {adminName.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="hidden md:block">
                    <div className="text-sm font-medium text-white">{adminName}</div>
                    <div className="text-xs text-slate-500">{isSuperAdmin ? "Super admin" : "Admin da organização"}</div>
                  </div>
                  <ChevronDown className="hidden h-4 w-4 text-slate-500 md:block" />
                </button>

                {isUserMenuOpen ? (
                  <div className="absolute right-0 top-[calc(100%+12px)] z-30 w-72 rounded-3xl border border-slate-800 bg-[#0b1425] p-3 shadow-2xl">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                      <div className="text-sm font-medium text-white">{adminName}</div>
                      <div className="mt-1 text-sm text-slate-400">{session?.user.email}</div>
                    </div>
                    <div className="mt-3 grid gap-2">
                      <button
                        type="button"
                        className="rounded-2xl px-4 py-3 text-left text-sm text-slate-300 transition hover:bg-slate-900 hover:text-white"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          navigate("/app/settings/profile");
                        }}
                      >
                        Perfil e preferências
                      </button>
                      <button
                        type="button"
                        className="rounded-2xl px-4 py-3 text-left text-sm text-slate-300 transition hover:bg-slate-900 hover:text-white"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          navigate(isSuperAdmin ? "/app/admin/dashboard" : "/app/subscription");
                        }}
                      >
                        {isSuperAdmin ? "Central da plataforma" : "Meu plano e cobrança"}
                      </button>
                      <button
                        type="button"
                        className="rounded-2xl px-4 py-3 text-left text-sm text-rose-300 transition hover:bg-rose-500/10 hover:text-rose-200"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          void supabase.auth.signOut();
                        }}
                      >
                        Sair
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          <main className="px-4 py-6 md:px-6">
            <div className="mx-auto max-w-[1400px]">
              <Outlet />
            </div>
          </main>

          <footer className="border-t border-slate-800/80 px-6 py-4 text-xs text-slate-500">
            GestorGram • produto SaaS multi-tenant para comunidades Telegram • build premium
          </footer>
        </div>
      </div>
    </div>
  );
}
