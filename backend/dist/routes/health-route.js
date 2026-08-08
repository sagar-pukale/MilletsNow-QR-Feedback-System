import { Router } from 'express';
export const healthRoute = Router();
healthRoute.get('/', (_request, response) => response.status(200).json({ status: 'ok' }));
