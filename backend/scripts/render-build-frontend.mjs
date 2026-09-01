import { existsSync, cpSync, mkdirSync, rmSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const workspaceRoot = path.resolve(backendDir, '..')
const frontendDir = path.join(workspaceRoot, 'frontend')
const frontendPackageJson = path.join(frontendDir, 'package.json')
const workspaceNodeModules = path.join(workspaceRoot, 'node_modules')
const frontendDistDir = path.join(frontendDir, 'dist')
const backendFrontendDistDir = path.join(backendDir, 'frontend-dist')
const shouldBuild =
  process.env.RENDER === 'true' ||
  process.env.RENDER_SERVICE_ID ||
  process.env.FORCE_RENDER_FRONTEND_BUILD === '1'

function run(command, args, cwd = backendDir) {
  const executable = process.platform === 'win32' && command === 'npm' ? 'npm.cmd' : command
  const result = spawnSync(executable, args, {
    cwd,
    stdio: 'inherit',
    shell: false,
    env: process.env,
  })

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with status ${result.status ?? 'unknown'}`)
  }
}

if (!shouldBuild) {
  process.exit(0)
}

if (!existsSync(frontendPackageJson)) {
  console.warn('Frontend package not found; skipping Render frontend bundle step.')
  process.exit(0)
}

if (!existsSync(path.join(frontendDistDir, 'index.html'))) {
  if (!existsSync(workspaceNodeModules)) {
    run('npm', ['install', '--workspaces', '--include-workspace-root'], workspaceRoot)
  }

  run('npm', ['--workspace', 'frontend', 'run', 'build'], workspaceRoot)
}

rmSync(backendFrontendDistDir, { recursive: true, force: true })
mkdirSync(backendFrontendDistDir, { recursive: true })
cpSync(frontendDistDir, backendFrontendDistDir, { recursive: true })

console.log(`Bundled frontend into ${backendFrontendDistDir}`)
