import { Request, Response, NextFunction } from 'express'

interface AppError extends Error {
  status?:     number
  statusCode?: number
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message)
  const status  = err.status || err.statusCode || 500
  const message = process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  res.status(status).json({ error: message })
}
