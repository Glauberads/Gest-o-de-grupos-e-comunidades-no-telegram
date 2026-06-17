import { useEffect, useState } from "react";

import { apiRequest } from "@/lib/api";
import { useAuth } from "@/features/auth/use-auth";

export type Community = {
  id: string;
  name: string;
  description: string | null;
  public_slug: string;
  public_url: string | null;
  image_url: string | null;
  status: string;
  auto_approve_enabled: boolean;
  welcome_message: string | null;
};

export function useCommunities(organizationId?: string) {
  const { session } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session || !organizationId) {
      setCommunities([]);
      setLoading(false);
      return;
    }

    let active = true;

    apiRequest<{ communities: Community[] }>(
      `/api/communities?organizationId=${organizationId}`
    )
      .then((payload) => {
        if (!active) {
          return;
        }

        setCommunities(payload.communities);
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
  }, [organizationId, session]);

  return {
    communities,
    loading,
    error,
    setCommunities
  };
}

