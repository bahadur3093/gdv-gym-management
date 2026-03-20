import { Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AuthRequest, JwtPayload } from '../types/index.js'

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' })
    return
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' })
    return
  }
  next()
}
