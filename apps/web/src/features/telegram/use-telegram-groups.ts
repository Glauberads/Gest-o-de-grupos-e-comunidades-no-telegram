import { useEffect, useState } from "react";

import { apiRequest } from "@/lib/api";

export function useTelegramGroups(organizationId?: string) {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organizationId) {
      setGroups([]);
      setLoading(false);
      return;
    }

    let active = true;

    apiRequest<{ groups: any[] }>(`/api/telegram/groups?organizationId=${organizationId}`)
      .then((payload) => {
        if (active) {
          setGroups(payload.groups);
          setError(null);
        }
      })
      .catch((nextError: Error) => {
        if (active) {
          setError(nextError.message);
        }
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
    groups,
    loading,
    error,
    setGroups
  };
}
