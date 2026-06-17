import { IntegrationError } from "./errors.js";

export function unwrapSupabase<T>(
  result: { data: T | null; error: { message: string } | null },
  message: string
) {
  if (result.error || result.data === null) {
    throw new IntegrationError(message, {
      error: result.error?.message
    });
  }

  return result.data;
}

