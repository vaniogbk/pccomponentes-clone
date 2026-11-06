import { createApp } from './app.js';
import { readConfig } from './config/env.js';
import { disconnectPrisma } from './lib/prisma.js';

const config = readConfig();
const app = createApp(config);

const server = app.listen(config.port, '0.0.0.0', () => {
  console.info(`API listening on port ${config.port}`);
});

let stopping = false;

function shutdown(signal: string) {
  if (stopping) return;
  stopping = true;
  console.info(`${signal} reçu : arrêt de l'API.`);

  const forceExit = setTimeout(() => process.exit(1), 10_000);
  forceExit.unref();

  server.close(() => {
    disconnectPrisma()
      .catch(() => undefined)
      .finally(() => process.exit(0));
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
