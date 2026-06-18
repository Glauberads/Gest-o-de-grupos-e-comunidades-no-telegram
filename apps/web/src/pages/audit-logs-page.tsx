import { useMemo, useState } from "react";
import { Activity, Copy, ShieldCheck } from "lucide-react";

import { EmptyStateCard } from "@/components/app/empty-state-card";
import { PageLayout } from "@/components/app/page-layout";
import { StatCard } from "@/components/app/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { type AuditLogItem, useAuditLogs } from "@/features/audit/use-audit-logs";
import { useOrganizations } from "@/features/organizations/use-organizations";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function AuditLogsPage() {
  const { organizations } = useOrganizations();
  const organization = organizations[0];
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const { logs, loading, error } = useAuditLogs(
    "/api/audit-logs",
    {
      organizationId: organization?.id
    },
    Boolean(organization?.id)
  );
  const failedCount = useMemo(() => logs.filter((log) => log.status === "failed").length, [logs]);

  async function handleCopy() {
    if (!selectedLog) return;
    await navigator.clipboard.writeText(JSON.stringify(selectedLog.metadata ?? {}, null, 2));
  }

  return (
    <PageLayout
      title="Logs da organização"
      description="Visibilidade dos eventos importantes do seu workspace sem expor dados de outras organizações."
      badge="Configurações"
    >
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={Activity} label="Eventos" value={String(logs.length)} description="Logs recentes" />
        <StatCard icon={ShieldCheck} label="Falhas" value={String(failedCount)} description="Ações que exigem atenção" />
        <StatCard icon={ShieldCheck} label="Escopo" value="Sua organização" description="Sem dados globais" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3 font-medium">Data</th>
                  <th className="pb-3 font-medium">Categoria</th>
                  <th className="pb-3 font-medium">Ação</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Mensagem</th>
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index}><td colSpan={5} className="py-4"><Skeleton className="h-12 w-full rounded-2xl" /></td></tr>
                )) : error ? (
                  <tr><td colSpan={5} className="py-6"><EmptyStateCard icon={Activity} title="Não foi possível carregar os logs" description={error} /></td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan={5} className="py-6"><EmptyStateCard icon={Activity} title="Nenhum log disponível" description="Os eventos importantes da sua organização aparecerão aqui automaticamente." /></td></tr>
                ) : logs.map((log) => (
                  <tr key={log.id} className="cursor-pointer border-b border-slate-100 text-slate-700 hover:bg-slate-50" onClick={() => setSelectedLog(log)}>
                    <td className="py-4 text-slate-500">{formatDateTime(log.created_at)}</td>
                    <td className="py-4"><Badge variant="default">{log.category}</Badge></td>
                    <td className="py-4 font-medium text-slate-900">{log.action}</td>
                    <td className="py-4">{log.status}</td>
                    <td className="py-4 text-slate-600">{log.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="rounded-[28px] border border-slate-800 bg-[linear-gradient(180deg,_rgba(11,20,37,0.96)_0%,_rgba(15,23,42,0.98)_100%)] p-6 text-slate-50 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Detalhes</div>
              <h2 className="mt-2 text-xl font-semibold">{selectedLog?.action ?? "Selecione um log"}</h2>
            </div>
            <Badge variant="dark">Tenant</Badge>
          </div>

          {!selectedLog ? (
            <div className="mt-6 text-sm text-slate-400">
              Clique em uma linha para ver metadata, contexto e mensagem completa.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-sm text-slate-300">
                {selectedLog.message}
              </div>
              <Button variant="outline" className="border-slate-700 text-slate-100 hover:bg-slate-800" onClick={() => void handleCopy()}>
                <Copy className="mr-2 h-4 w-4" />
                Copiar metadata
              </Button>
              <pre className="overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-300">
                {JSON.stringify(selectedLog.metadata ?? {}, null, 2)}
              </pre>
            </div>
          )}
        </Card>
      </div>
    </PageLayout>
  );
}
