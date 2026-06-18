import { useEffect, useState } from "react";

import { apiRequest } from "@/lib/api";

export function useBillingHistory(organizationId?: string) {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organizationId) {
      setPayments([]);
      setLoading(false);
      return;
    }

    let active = true;

    apiRequest<{ payments: any[] }>(`/api/billing/history?organizationId=${organizationId}`)
      .then((payload) => {
        if (!active) {
          return;
        }

        setPayments(payload.payments ?? []);
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
  }, [organizationId]);

  return {
    payments,
    loading,
    error
  };
}
