import { useEffect, useState } from "react";

import { apiRequest } from "@/lib/api";

export function useTelegramGroupDetail(groupId?: string, organizationId?: string) {
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId || !organizationId) {
      setGroup(null);
      setLoading(false);
      return;
    }

    let active = true;

    apiRequest<{ group: any }>(
      `/api/telegram/groups/${groupId}?organizationId=${organizationId}`
    )
      .then((payload) => {
        if (!active) {
          return;
        }

        setGroup(payload.group);
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
  }, [groupId, organizationId]);

  return {
    group,
    loading,
    error
  };
}
