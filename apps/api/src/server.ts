import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { buildApp } from "./app.js";

async function start() {
  const app = buildApp();

  try {
    await app.listen({
      port: env.PORT,
      host: "0.0.0.0"
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to start API");
    process.exit(1);
  }
}

void start();

