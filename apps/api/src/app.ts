import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import Fastify from "fastify";
import { ZodError } from "zod";

import { allowedAppUrls, isProduction } from "./config/env.js";
import {
  IntegrationError,
  isAuthErrorMessage,
  isConfigErrorMessage,
  isForbiddenErrorMessage
} from "./lib/errors.js";
import { logger } from "./lib/logger.js";
import { appRoutes } from "./routes/index.js";

export function buildApp() {
  const app = Fastify({
    loggerInstance: logger
  });

  app.register(cors, {
    origin: allowedAppUrls
  });
  app.register(sensible);
  app.register(appRoutes);

  app.setErrorHandler((error, request, reply) => {
    logger.error(
      {
        err: error,
        path: request.url,
        method: request.method
      },
      "Unhandled API error"
    );

    if (error instanceof ZodError) {
      return reply.code(400).send({
        message: "Dados inválidos enviados para a API.",
        issues: error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message
        }))
      });
    }

    const message = error instanceof Error ? error.message : "Internal server error";

    let statusCode = 500;

    if (error instanceof IntegrationError) {
      if (isAuthErrorMessage(message)) {
        statusCode = 401;
      } else if (isForbiddenErrorMessage(message)) {
        statusCode = 403;
      } else if (isConfigErrorMessage(message)) {
        statusCode = 503;
      } else {
        statusCode = 400;
      }
    }

    const responseMessage =
      statusCode === 503
        ? "Serviço indisponível por configuração incompleta do servidor."
        : statusCode === 500 && isProduction()
          ? "Erro interno do servidor."
          : message;

    return reply.code(statusCode).send({
      message: responseMessage
    });
  });

  return app;
}
