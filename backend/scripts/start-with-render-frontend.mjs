import { existsSync } from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const backendFrontendDistDir = path.join(backendDir, 'frontend-dist', 'index.html')
const buildScriptPath = path.join(backendDir, 'scripts', 'render-build-frontend.mjs')
const serverPath = path.join(backendDir, 'dist', 'server.js')

async function ensureFrontendBundle() {
  const shouldPrepare =
    process.env.RENDER === 'true' ||
    process.env.RENDER_SERVICE_ID ||
    process.env.FORCE_RENDER_FRONTEND_BUILD === '1'

  if (!shouldPrepare || existsSync(backendFrontendDistDir)) return

  const result = spawn(process.execPath, [buildScriptPath], {
    cwd: backendDir,
    stdio: 'inherit',
    shell: false,
    env: {
      ...process.env,
      FORCE_RENDER_FRONTEND_BUILD: '1',
    },
  })

  const exitCode = await new Promise((resolve, reject) => {
    result.on('error', reject)
    result.on('exit', resolve)
  })

  if (exitCode !== 0) {
    throw new Error(`Frontend bundle step failed with code ${exitCode}`)
  }
}

await ensureFrontendBundle()

const server = spawn(process.execPath, [serverPath], {
  cwd: backendDir,
  stdio: 'inherit',
  shell: false,
  env: process.env,
})

server.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }
  process.exit(code ?? 0)
})
