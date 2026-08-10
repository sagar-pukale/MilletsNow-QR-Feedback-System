import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';
export const errorHandler = (error, _request, response, _next) => {
    logger.error('Unhandled request error:', error);
    if (error instanceof ZodError || error?.name === 'ZodError') {
        return response.status(400).json({
            error: 'Validation failed',
            details: error.flatten?.()?.fieldErrors ?? error,
        });
    }
    const message = error instanceof Error ? error.message : 'Internal server error';
    response.status(500).json({ error: message });
};
