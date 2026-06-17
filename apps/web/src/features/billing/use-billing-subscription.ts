import { useEffect, useState } from "react";

import { apiRequest } from "@/lib/api";

export function useBillingSubscription(organizationId?: string) {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    let active = true;

    apiRequest<{ subscription: any }>(
      `/api/billing/subscription?organizationId=${organizationId}`
    )
      .then((payload) => {
        if (active) {
          setSubscription(payload.subscription);
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
    subscription,
    loading,
    setSubscription
  };
}

