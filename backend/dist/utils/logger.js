export const logger = {
    info(message, meta) {
        console.info(`[info] ${message}`, meta ?? '');
    },
    error(message, meta) {
        console.error(`[error] ${message}`, meta ?? '');
    },
};
