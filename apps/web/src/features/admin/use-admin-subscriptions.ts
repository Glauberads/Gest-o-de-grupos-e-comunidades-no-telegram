import { useCallback, useEffect, useState } from "react";

import { apiRequest } from "@/lib/api";

export type AdminSubscriptionItem = {
  id: string;
  organization_id: string;
  platform_plan_id: string;
  status: string;
  active_until: string | null;
  current_period_end: string | null;
  lifetime: boolean;
  activation_source: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  platform_plans?: {
    id: string;
    name: string;
    code: string;
    price_cents: number;
  } | null;
  organizations?: {
    id: string;
    name: string;
    slug: string;
    status: string;
    owner_user_id: string;
  } | null;
};

export type AdminSubscriptionDetail = {
  organization: {
    id: string;
    name: string;
    slug: string;
    status: string;
    owner_user_id: string;
  };
  subscription: AdminSubscriptionItem | null;
  latestPayment: {
    id: string;
    status: string;
    due_date: string | null;
    paid_at: string | null;
    amount_cents: number;
    activation_source: string;
    notes: string | null;
  } | null;
  auditLogs: Array<{
    id: string;
    action: string;
    old_status: string | null;
    new_status: string | null;
    notes: string | null;
    admin_user_id: string;
    created_at: string;
  }>;
};

export function useAdminSubscriptions(enabled: boolean) {
  const [subscriptions, setSubscriptions] = useState<AdminSubscriptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) {
      setSubscriptions([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const payload = await apiRequest<{ subscriptions: AdminSubscriptionItem[] }>(
        "/api/admin/subscriptions"
      );

      setSubscriptions(payload.subscriptions ?? []);
      setError(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Falha ao carregar assinaturas.");
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    subscriptions,
    loading,
    error,
    refresh: load
  };
}

export function useAdminSubscriptionDetail(organizationId: string | null, enabled: boolean) {
  const [detail, setDetail] = useState<AdminSubscriptionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled || !organizationId) {
      setDetail(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const payload = await apiRequest<AdminSubscriptionDetail>(
        `/api/admin/subscriptions/${organizationId}`
      );

      setDetail(payload);
      setError(null);
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "Falha ao carregar detalhes da assinatura."
      );
    } finally {
      setLoading(false);
    }
  }, [enabled, organizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    detail,
    loading,
    error,
    refresh: load
  };
}
