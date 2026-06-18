import { useEffect, useState } from "react";

import { apiRequest } from "@/lib/api";

export function useBillingSubscription(organizationId?: string) {
  const [subscription, setSubscription] = useState<any>(null);
  const [latestPayment, setLatestPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organizationId) {
      setSubscription(null);
      setLatestPayment(null);
      setLoading(false);
      return;
    }

    let active = true;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    async function loadBilling() {
      try {
        const payload = await apiRequest<{ subscription: any; latestPayment: any }>(
          `/api/billing/subscription?organizationId=${organizationId}`
        );

        if (!active) {
          return;
        }

        setSubscription(payload.subscription);
        setLatestPayment(payload.latestPayment);
        setError(null);
      } catch (nextError) {
        if (!active) {
          return;
        }

        setError(
          nextError instanceof Error
            ? nextError.message
            : "Não foi possível carregar os dados da assinatura."
        );
      }
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
    error,
    setSubscription,
    setLatestPayment
  };
}
