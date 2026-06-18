import { useCallback, useEffect, useState } from "react";

import { apiRequest } from "@/lib/api";

export type AuditLogItem = {
  id: string;
  organization_id: string | null;
  user_id: string | null;
  actor_type: string;
  actor_id: string | null;
  actor_email: string | null;
  category: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  status: string;
  severity: string;
  message: string;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  request_id: string | null;
  created_at: string;
};

export type AuditLogFilters = {
  category?: string;
  severity?: string;
  status?: string;
  organizationId?: string;
  userId?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
};

function toQueryString(filters: AuditLogFilters) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

export function useAuditLogs(path: string, filters: AuditLogFilters, enabled: boolean) {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) {
      setLogs([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const payload = await apiRequest<{ logs: AuditLogItem[] }>(
        `${path}${toQueryString(filters)}`
      );
      setLogs(payload.logs ?? []);
      setError(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Falha ao carregar os logs.");
    } finally {
      setLoading(false);
    }
  }, [enabled, filters, path]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    logs,
    loading,
    error,
    refresh: load
  };
}
