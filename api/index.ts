import type { VercelRequest, VercelResponse } from '@vercel/node'

type AppHandler = (req: VercelRequest, res: VercelResponse) => unknown

let appPromise: Promise<AppHandler> | undefined

function loadApp() {
  appPromise ??= import('../backend/vercel-dist/app.js').then(({ app }) => app as AppHandler)
  return appPromise
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const app = await loadApp()
    return app(req, res)
  } catch (error) {
    console.error('Serverless bootstrap failed', error)
    const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : 'BOOTSTRAP_FAILED'
    const message = error instanceof Error ? error.message : 'Unknown bootstrap error'
    return res.status(500).json({ error: 'Server bootstrap failed', code, message })
  }
}
