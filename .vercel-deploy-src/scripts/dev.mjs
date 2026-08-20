import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const children = []

function run(name, command, args, cwd) {
  const child = spawn(command, args, {
    cwd,
    stdio: 'inherit',
    shell: true,
  })

  child.on('exit', (code) => {
    if (code && code !== 0) {
      shutdown(code)
    }
  })

  children.push(child)
  return child
}

function shutdown(code = 0) {
  for (const child of children) {
    if (!child.killed) {
      child.kill()
    }
  }

  process.exit(code)
}

run('backend', 'npm', ['run', 'dev'], path.join(rootDir, 'backend'))
run('frontend', 'npm', ['run', 'dev'], path.join(rootDir, 'frontend'))

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))
