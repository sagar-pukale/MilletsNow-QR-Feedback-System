import { existsSync } from 'node:fs'
import path from 'node:path'

import { env } from '../config/env.js'

function getWorkspaceRoot() {
  return existsSync(path.resolve(process.cwd(), 'frontend')) ? process.cwd() : path.resolve(process.cwd(), '..')
}

function getBackendRoot() {
  return existsSync(path.resolve(process.cwd(), 'src')) ? process.cwd() : path.resolve(getWorkspaceRoot(), 'backend')
}

export function getUploadRootDir() {
  if (process.env.VERCEL) {
    return path.join('/tmp', 'milletsnow-uploads')
  }

  return path.resolve(getBackendRoot(), env.UPLOAD_DIR)
}

export function getFrontendDistDir() {
  return path.resolve(getWorkspaceRoot(), 'frontend', 'dist')
}
