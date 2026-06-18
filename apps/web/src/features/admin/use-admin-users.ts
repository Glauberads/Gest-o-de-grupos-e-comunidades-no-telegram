import { useEffect, useState } from "react";

import { apiRequest } from "@/lib/api";

export function useAdminUsers(enabled: boolean) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setUsers([]);
      setLoading(false);
      return;
    }

    let active = true;

    apiRequest<{ users: any[] }>("/api/admin/users")
      .then((payload) => {
        if (!active) {
          return;
        }

        setUsers(payload.users ?? []);
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
  }, [enabled]);

  return {
    users,
    loading,
    error
  };
}
