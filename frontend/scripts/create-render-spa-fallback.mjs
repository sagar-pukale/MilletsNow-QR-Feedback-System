import { copyFile, mkdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const frontendDir = path.resolve(scriptDir, '..')
const distDir = path.join(frontendDir, 'dist')
const indexPath = path.join(distDir, 'index.html')
const fallbackPath = path.join(distDir, '404.html')

await stat(indexPath)
await mkdir(distDir, { recursive: true })
await copyFile(indexPath, fallbackPath)

console.log('Created Render SPA fallback:', path.relative(frontendDir, fallbackPath))
