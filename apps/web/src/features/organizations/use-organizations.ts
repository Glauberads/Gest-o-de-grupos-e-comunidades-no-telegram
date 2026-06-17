import { useEffect, useState } from "react";

import { apiRequest } from "@/lib/api";
import { useAuth } from "@/features/auth/use-auth";

type Organization = {
  id: string;
  name: string;
  slug: string;
  status: string;
};

export function useOrganizations() {
  const { session } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      setOrganizations([]);
      setLoading(false);
      return;
    }

    let active = true;

    apiRequest<{ organizations: Organization[] }>("/api/organizations")
      .then((payload) => {
        if (!active) {
          return;
        }

        setOrganizations(payload.organizations);
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
  }, [session]);

  return {
    organizations,
    loading,
    error
  };
}

