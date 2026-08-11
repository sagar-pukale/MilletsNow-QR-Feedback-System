import type { VercelRequest, VercelResponse } from '@vercel/node'
import { app } from '../backend/vercel-dist/app.js'

export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req, res)
}
