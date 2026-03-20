import { Router } from 'express'
import authRoutes        from './auth.js'
import attendanceRoutes  from './attendance.js'
import paymentRoutes     from './payments.js'
import maintenanceRoutes from './maintenance.js'

const router = Router()

router.use('/auth',        authRoutes)
router.use('/attendance',  attendanceRoutes)
router.use('/payments',    paymentRoutes)
router.use('/maintenance', maintenanceRoutes)

export default router
