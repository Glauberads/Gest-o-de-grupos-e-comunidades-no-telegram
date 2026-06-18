import { useEffect, useState } from "react";

import { apiRequest } from "@/lib/api";

export function useTelegramLogs(organizationId?: string) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organizationId) {
      setLogs([]);
      setLoading(false);
      return;
    }

    let active = true;

    apiRequest<{ logs: any[] }>(`/api/telegram/logs?organizationId=${organizationId}`)
      .then((payload) => {
        if (!active) {
          return;
        }

        setLogs(payload.logs ?? []);
        setError(null);
      })
      .catch((nextError: Error) => {
        if (!active) {
          return;
        }

        setError(nextError.message);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [organizationId]);

  return {
    logs,
    loading,
    error
  };
}
