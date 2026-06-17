import { supabase } from "./supabase";

const apiUrl = import.meta.env.VITE_API_URL;

type RequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}) {
  const {
    data: { session }
  } = await supabase.auth.getSession();

  const headers = new Headers({
    "Content-Type": "application/json"
  });

  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  const response = await fetch(`${apiUrl}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.message ?? "Request failed");
  }

  return response.json() as Promise<T>;
}

