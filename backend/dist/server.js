import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
const server = app.listen(env.PORT, () => {
    logger.info(`MilletsNow backend listening on port ${env.PORT}`);
});
const shutdown = (signal) => {
    logger.info(`Received ${signal}; shutting down gracefully`);
    server.close(() => process.exit(0));
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
// Keep process active in non-interactive background runner
setInterval(() => { }, 60000);
