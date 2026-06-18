import { useEffect, useState } from "react";

import { apiRequest } from "@/lib/api";

export function useBillingSubscription(organizationId?: string) {
  const [subscription, setSubscription] = useState<any>(null);
  const [latestPayment, setLatestPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    let active = true;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    async function loadBilling() {
      const payload = await apiRequest<{ subscription: any; latestPayment: any }>(
        `/api/billing/subscription?organizationId=${organizationId}`
      );

      if (!active) {
        return;
      }

      setSubscription(payload.subscription);
      setLatestPayment(payload.latestPayment);
    }

    loadBilling()
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    intervalId = setInterval(() => {
      void loadBilling();
    }, 15000);

    return () => {
      active = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [organizationId]);

  return {
    subscription,
    latestPayment,
    loading,
    setSubscription,
    setLatestPayment
  };
}
