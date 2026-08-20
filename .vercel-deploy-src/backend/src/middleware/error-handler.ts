import type { ErrorRequestHandler } from 'express'
import { ZodError } from 'zod'
import { logger } from '../utils/logger.js'

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  logger.error('Unhandled request error:', error)
  if (error instanceof ZodError || error?.name === 'ZodError') {
    return response.status(400).json({
      error: 'Validation failed',
      details: error.flatten?.()?.fieldErrors ?? error,
    })
  }
  const statusCode = typeof error?.statusCode === 'number' ? error.statusCode : 500
  const message =
    typeof error?.message === 'string' && error.message.trim()
      ? error.message
      : 'Something went wrong. Please try again.'
  response.status(statusCode).json({ error: message })
}
