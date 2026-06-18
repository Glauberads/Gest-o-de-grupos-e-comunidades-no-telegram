import { useEffect, useState } from "react";

import { apiRequest } from "@/lib/api";

export type PlatformPlan = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  price_cents: number;
  billing_interval: string;
  trial_days: number;
  features: string[];
  status: string;
};

export function usePlatformPlans() {
  const [plans, setPlans] = useState<PlatformPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    apiRequest<{ plans: PlatformPlan[] }>("/api/platform-plans")
      .then((payload) => {
        if (active) {
          setPlans(payload.plans);
          setError(null);
        }
      })
      .catch((nextError: Error) => {
        if (active) {
          setError(nextError.message);
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
  }, []);

  return {
    plans,
    loading,
    error
  };
}
