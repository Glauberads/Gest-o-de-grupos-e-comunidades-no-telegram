import { useMemo, useState } from "react";
import { Activity, Copy, Filter, ShieldCheck } from "lucide-react";

import { EmptyStateCard } from "@/components/app/empty-state-card";
import { PageLayout } from "@/components/app/page-layout";
import { StatCard } from "@/components/app/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuditLogs, type AuditLogFilters, type AuditLogItem } from "@/features/audit/use-audit-logs";
import { useAuth } from "@/features/auth/use-auth";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function severityBadge(value: string) {
  switch (value) {
    case "critical":
    case "error":
      return <Badge variant="danger">{value}</Badge>;
    case "warning":
      return <Badge variant="warning">{value}</Badge>;
    default:
      return <Badge variant="info">{value}</Badge>;
  }
}

function statusBadge(value: string) {
  switch (value) {
    case "success":
      return <Badge variant="success">success</Badge>;
    case "failed":
      return <Badge variant="danger">failed</Badge>;
    case "pending":
      return <Badge variant="warning">pending</Badge>;
    default:
      return <Badge variant="default">{value}</Badge>;
  }
}

function AuditLogDetailPanel({ log }: { log: AuditLogItem | null }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!log) return;
    await navigator.clipboard.writeText(JSON.stringify(log.metadata ?? {}, null, 2));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="rounded-[28px] border border-slate-800 bg-[linear-gradient(180deg,_rgba(11,20,37,0.96)_0%,_rgba(15,23,42,0.98)_100%)] p-6 text-slate-50 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Detalhes</div>
          <h2 className="mt-2 text-xl font-semibold">
            {log ? log.action : "Selecione um log"}
          </h2>
        </div>
        {log ? severityBadge(log.severity) : <Badge variant="dark">Audit</Badge>}
      </div>

      {!log ? (
        <div className="mt-6 text-sm text-slate-400">
          Escolha uma linha da tabela para ver metadata, IP, user-agent e contexto da ação.
        </div>
      ) : (
        <div className="mt-6 space-y-4 text-sm">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Categoria</div>
              <div className="mt-2 font-medium">{log.category}</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Status</div>
              <div className="mt-2">{statusBadge(log.status)}</div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Mensagem</div>
            <div className="mt-2 text-slate-200">{log.message}</div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Usuário</div>
              <div className="mt-2">{log.actor_email ?? "Sistema"}</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Organização</div>
              <div className="mt-2">{log.organization_id ?? "Global"}</div>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">IP</div>
              <div className="mt-2 break-all">{log.ip_address ?? "—"}</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Request ID</div>
              <div className="mt-2 break-all">{log.request_id ?? "—"}</div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">User-Agent</div>
            <div className="mt-2 break-all text-slate-300">{log.user_agent ?? "—"}</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Metadata</div>
              <Button variant="outline" className="border-slate-700 text-slate-100 hover:bg-slate-800" onClick={() => void handleCopy()}>
                <Copy className="mr-2 h-4 w-4" />
                {copied ? "Copiado" : "Copiar"}
              </Button>
            </div>
            <pre className="overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-300">
              {JSON.stringify(log.metadata ?? {}, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </Card>
  );
}

export function AdminAuditLogsPage() {
  const { session } = useAuth();
  const isSuperAdmin = session?.user.app_metadata?.is_super_admin === true;
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const { logs, loading, error } = useAuditLogs("/api/admin/audit-logs", filters, isSuperAdmin);

  const criticalCount = useMemo(
    () => logs.filter((log) => ["critical", "error"].includes(log.severity)).length,
    [logs]
  );

  return (
    <PageLayout
      title="Logs do sistema"
      description="Auditoria global de autenticação, billing, Telegram, webhooks, segurança e ações administrativas."
      badge="Admin"
      badgeVariant="warning"
    >
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={Activity} label="Eventos" value={String(logs.length)} description="Retorno filtrado" />
        <StatCard icon={ShieldCheck} label="Críticos" value={String(criticalCount)} description="Erros e alertas fortes" />
        <StatCard icon={Filter} label="Categorias" value="10" description="Escopo auditável" />
        <StatCard icon={ShieldCheck} label="Escopo" value="Global" description="Somente super admin" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-3 md:grid-cols-4">
            <input className="h-11 rounded-2xl border border-slate-200 px-4 text-sm" placeholder="Buscar mensagem ou ação" onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value || undefined }))} />
            <select className="h-11 rounded-2xl border border-slate-200 px-4 text-sm" onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value || undefined }))}>
              <option value="">Todas categorias</option>
              {["auth","billing","asaas","telegram","organization","community","admin","security","system","webhook"].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select className="h-11 rounded-2xl border border-slate-200 px-4 text-sm" onChange={(event) => setFilters((current) => ({ ...current, severity: event.target.value || undefined }))}>
              <option value="">Toda severidade</option>
              {["info","warning","error","critical"].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select className="h-11 rounded-2xl border border-slate-200 px-4 text-sm" onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value || undefined }))}>
              <option value="">Todo status</option>
              {["success","failed","pending","ignored"].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3 font-medium">Data</th>
                  <th className="pb-3 font-medium">Categoria</th>
                  <th className="pb-3 font-medium">Ação</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Severidade</th>
                  <th className="pb-3 font-medium">Usuário</th>
                  <th className="pb-3 font-medium">Mensagem</th>
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index}><td colSpan={7} className="py-4"><Skeleton className="h-12 w-full rounded-2xl" /></td></tr>
                )) : error ? (
                  <tr><td colSpan={7} className="py-6"><EmptyStateCard icon={Activity} title="Não foi possível carregar os logs" description={error} /></td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan={7} className="py-6"><EmptyStateCard icon={Activity} title="Nenhum log encontrado" description="Ajuste os filtros ou aguarde novos eventos auditáveis." /></td></tr>
                ) : logs.map((log) => (
                  <tr key={log.id} className="cursor-pointer border-b border-slate-100 text-slate-700 hover:bg-slate-50" onClick={() => setSelectedLog(log)}>
                    <td className="py-4 text-slate-500">{formatDateTime(log.created_at)}</td>
                    <td className="py-4"><Badge variant="default">{log.category}</Badge></td>
                    <td className="py-4 font-medium text-slate-900">{log.action}</td>
                    <td className="py-4">{statusBadge(log.status)}</td>
                    <td className="py-4">{severityBadge(log.severity)}</td>
                    <td className="py-4 text-slate-500">{log.actor_email ?? log.actor_type}</td>
                    <td className="py-4 text-slate-600">{log.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <AuditLogDetailPanel log={selectedLog} />
      </div>
    </PageLayout>
  );
}
