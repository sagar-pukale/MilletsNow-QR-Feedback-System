"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_js_1 = require("./app.js");
const env_js_1 = require("./config/env.js");
const logger_js_1 = require("./utils/logger.js");
const server = app_js_1.app.listen(env_js_1.env.PORT, () => {
    logger_js_1.logger.info(`MilletsNow backend listening on port ${env_js_1.env.PORT}`);
});
const shutdown = (signal) => {
    logger_js_1.logger.info(`Received ${signal}; shutting down gracefully`);
    server.close(() => process.exit(0));
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
// Keep process active in non-interactive background runner
setInterval(() => { }, 60000);
