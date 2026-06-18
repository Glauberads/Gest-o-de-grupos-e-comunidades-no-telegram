export class IntegrationError extends Error {
  constructor(
    message: string,
    readonly metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = "IntegrationError";
  }
}

export function isConfigErrorMessage(message: string) {
  return message.toLowerCase().includes("not configured") || message.toLowerCase().includes("invalid environment configuration");
}

export function isAuthErrorMessage(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("missing bearer token") || normalized.includes("invalid supabase access token");
}

export function isForbiddenErrorMessage(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("not allowed") ||
    normalized.includes("must be active") ||
    normalized.includes("is not allowed")
  );
}
