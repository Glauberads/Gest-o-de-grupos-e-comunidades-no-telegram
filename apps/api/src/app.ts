import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import Fastify from "fastify";

import { env } from "./config/env.js";
import { IntegrationError } from "./lib/errors.js";
import { logger } from "./lib/logger.js";
import { appRoutes } from "./routes/index.js";

export function buildApp() {
  const app = Fastify({
    loggerInstance: logger
  });

  app.register(cors, {
    origin: [env.APP_URL]
  });
  app.register(sensible);
  app.register(appRoutes);

  app.setErrorHandler((error, _request, reply) => {
    logger.error({ err: error }, "Unhandled API error");

    const message = error instanceof Error ? error.message : "Internal server error";
    const statusCode =
      error instanceof IntegrationError
        ? message.includes("Missing bearer token") || message.includes("Invalid Supabase access token")
          ? 401
          : 400
        : 500;

    return reply.code(statusCode).send({
      message
    });
  });

  return app;
}
