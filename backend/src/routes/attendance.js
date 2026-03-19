import { Router } from 'express';
import { checkIn, getMyAttendance, getAllToday } from '../controllers/attendanceController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.post('/checkin',    authenticate,               checkIn);         // POST /api/attendance/checkin
router.get('/me',          authenticate,               getMyAttendance); // GET  /api/attendance/me
router.get('/today',       authenticate, requireAdmin, getAllToday);     // GET  /api/attendance/today

export default router;
