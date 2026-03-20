import { Router } from 'express'
import { checkIn, getMyAttendance, getAllToday } from '../controllers/attendanceController.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const router = Router()

router.post('/checkin',  authenticate,               checkIn)
router.get('/me',        authenticate,               getMyAttendance)
router.get('/today',     authenticate, requireAdmin, getAllToday)

export default router
