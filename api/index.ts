import type { VercelRequest, VercelResponse } from '@vercel/node'

type AppHandler = (req: VercelRequest, res: VercelResponse) => unknown

let appPromise: Promise<AppHandler> | undefined

function loadApp() {
  appPromise ??= import('../backend/src/app.js').then(({ app }) => app as AppHandler)
  return appPromise
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const app = await loadApp()
  return app(req, res)
}
