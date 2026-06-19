import { useCallback, useEffect, useState } from "react";

import { apiRequest } from "@/lib/api";

export type AdminUser = {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string | null;
};

export type CreateAdminCustomerInput = {
  fullName: string;
  email: string;
  organizationName: string;
  password: string;
  organizationStatus?: "pending_payment" | "active";
};

export function useAdminUsers(enabled: boolean) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const loadUsers = useCallback(async () => {
    if (!enabled) {
      setUsers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = await apiRequest<{ users: AdminUser[] }>("/api/admin/users");
      setUsers(payload.users ?? []);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Não foi possível carregar os usuários.");
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  async function createCustomer(input: CreateAdminCustomerInput) {
    setCreating(true);
    setError(null);

    try {
      await apiRequest<{ user: AdminUser; organization: unknown }>("/api/admin/users", {
        method: "POST",
        body: input
      });

      await loadUsers();
    } finally {
      setCreating(false);
    }
  }

  return {
    users,
    loading,
    error,
    creating,
    createCustomer,
    refresh: loadUsers
  };
}
