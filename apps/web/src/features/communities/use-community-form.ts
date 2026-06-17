import { useEffect, useState } from "react";

import { apiRequest } from "@/lib/api";

type Community = {
  id: string;
  name: string;
  description: string | null;
  public_slug: string;
  status: string;
};

export function useCommunityForm(organizationId?: string) {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) {
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
    communities,
    loading
  };
}

