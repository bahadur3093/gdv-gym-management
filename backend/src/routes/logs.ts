import { Router } from 'express'
import { getMembers, getCheckins, getPaymentLogs, getMemberSummary } from '../controllers/logsController.js'
import { authenticate, requireAdmin, requireMember } from '../middleware/auth.js'

const router = Router()

router.get('/members',        authenticate, requireAdmin,  getMembers)
router.get('/checkins',       authenticate, requireAdmin,  getCheckins)
router.get('/payments',       authenticate, requireAdmin,  getPaymentLogs)
router.get('/member-summary', authenticate, requireMember, getMemberSummary)

export default router