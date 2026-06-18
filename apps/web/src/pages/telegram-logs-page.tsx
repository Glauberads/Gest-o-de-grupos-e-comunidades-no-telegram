import { AlertTriangle, Bot, ScrollText } from "lucide-react";

import { EmptyStateCard } from "@/components/app/empty-state-card";
import { PageLayout } from "@/components/app/page-layout";
import { StatCard } from "@/components/app/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrganizations } from "@/features/organizations/use-organizations";
import { useTelegramLogs } from "@/features/telegram/use-telegram-logs";

function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function logBadge(status?: string | null) {
  switch (String(status ?? "").toLowerCase()) {
    case "success":
      return <Badge variant="success">Sucesso</Badge>;
    case "error":
      return <Badge variant="danger">Erro</Badge>;
    case "warning":
      return <Badge variant="warning">Atenção</Badge>;
    default:
      return <Badge variant="info">{status ?? "Info"}</Badge>;
  }
}

export function TelegramLogsPage() {
  const { organizations } = useOrganizations();
  const organization = organizations[0];
  const { logs, loading, error } = useTelegramLogs(organization?.id);

  const successCount = logs.filter((item) => item.status === "success").length;
  const errorCount = logs.filter((item) => item.status === "error").length;

  return (
    <PageLayout
      title="Logs do bot"
      description="Linha do tempo operacional do Telegram para auditar conexões, testes, grupos vinculados e eventos relevantes do bot."
      badge="Telegram"
    >
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={ScrollText}
          label="Eventos recentes"
          value={String(logs.length)}
          description="Últimos 50 registros disponíveis"
        />
        <StatCard
          icon={Bot}
          label="Sucessos"
          value={String(successCount)}
          description="Ações concluídas sem falha"
        />
        <StatCard
          icon={AlertTriangle}
          label="Falhas"
          value={String(errorCount)}
          description="Pontos que exigem revisão"
        />
      </div>

      <Card className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Auditoria operacional</h2>
            <p className="mt-1 text-sm text-slate-500">
              Use esta visão para confirmar se o bot foi validado, se os grupos foram conectados e quando ocorreram testes operacionais.
            </p>
          </div>
          <Badge variant="dark">Somente leitura</Badge>
        </div>

        <div className="mt-6 space-y-3">
          {loading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-20 w-full rounded-2xl" />
            ))
          ) : error ? (
            <EmptyStateCard
              icon={AlertTriangle}
              title="Não foi possível carregar os logs"
              description={error}
            />
          ) : logs.length === 0 ? (
            <EmptyStateCard
              icon={ScrollText}
              title="Nenhum log registrado ainda"
              description="Depois que você validar o bot, conectar grupos ou enviar mensagem teste, os eventos começarão a aparecer aqui."
            />
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-medium text-slate-900">{log.action}</div>
                      {logBadge(log.status)}
                    </div>
                    <div className="mt-2 text-sm leading-6 text-slate-600">
                      {log.message ?? "Evento operacional sem mensagem detalhada."}
                    </div>
                  </div>
                  <div className="text-sm text-slate-500">{formatDate(log.created_at)}</div>
                </div>

                {log.metadata && Object.keys(log.metadata).length > 0 ? (
                  <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
                    {JSON.stringify(log.metadata)}
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </Card>
    </PageLayout>
  );
}
