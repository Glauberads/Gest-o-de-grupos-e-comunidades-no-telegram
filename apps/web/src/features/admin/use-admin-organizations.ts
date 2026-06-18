import { useEffect, useState } from "react";

import { apiRequest } from "@/lib/api";

export function useAdminOrganizations(enabled: boolean) {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setOrganizations([]);
      setLoading(false);
      return;
    }

    let active = true;

    apiRequest<{ organizations: any[] }>("/api/admin/organizations")
      .then((payload) => {
        if (!active) {
          return;
        }

        setOrganizations(payload.organizations ?? []);
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
    organizations,
    loading,
    error
  };
}
