import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import routes from './routes/index.js'
import { errorHandler } from './middleware/errorHandler.js'

const app  = express()
const PORT = process.env.PORT || 4000

// Security
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}))

// Rate limiting
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
}))

// Parsing
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true }))

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'))
}

// Health check — cron-job.org pings this to keep Render alive
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API routes
app.use('/api', routes)

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Global error handler
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`\n🏋️  Society Gym API running on port ${PORT}`)
  console.log(`   Environment : ${process.env.NODE_ENV}`)
  console.log(`   Health check: http://localhost:${PORT}/health\n`)
})

export default app
