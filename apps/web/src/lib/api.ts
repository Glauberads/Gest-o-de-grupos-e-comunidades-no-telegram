import { supabase } from "./supabase";

const apiUrl = import.meta.env.VITE_API_URL;

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}) {
  if (!apiUrl) {
    throw new Error(
      "VITE_API_URL não está configurada no frontend. Atualize as variáveis do projeto antes de continuar."
    );
  }

  const {
    data: { session }
  } = await supabase.auth.getSession();

  const headers = new Headers({
    "Content-Type": "application/json"
  });

  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${apiUrl}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
  } catch (error) {
    throw new Error(
      error instanceof Error && error.message === "Failed to fetch"
        ? "Não foi possível falar com a API agora. Verifique se o backend está online e tente novamente."
        : "Não foi possível concluir a solicitação agora."
    );
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message ?? "Não foi possível concluir a solicitação agora.");
  }

  return payload as T;
}
