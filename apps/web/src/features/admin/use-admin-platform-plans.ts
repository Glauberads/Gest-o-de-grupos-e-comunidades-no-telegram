import { useCallback, useEffect, useState } from "react";

import { apiRequest } from "@/lib/api";

export type AdminPlatformPlan = {
  id: string;
  name: string;
  slug: string;
  code: string;
  description: string | null;
  price_cents: number;
  billing_interval: "monthly" | "quarterly" | "semiannual" | "annual" | "lifetime";
  max_communities: number;
  max_telegram_groups: number;
  max_automations: number;
  has_priority_support: boolean;
  has_advanced_reports: boolean;
  has_ai_moderation: boolean;
  is_featured: boolean;
  sort_order: number;
  status: "active" | "inactive" | "archived";
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export function useAdminPlatformPlans(enabled: boolean) {
  const [plans, setPlans] = useState<AdminPlatformPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) {
      setPlans([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const payload = await apiRequest<{ plans: AdminPlatformPlan[] }>("/api/admin/platform-plans");
      setPlans(payload.plans ?? []);
      setError(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Falha ao carregar os planos.");
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    plans,
    loading,
    error,
    refresh: load
  };
}
