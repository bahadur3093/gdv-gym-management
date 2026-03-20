import { Router } from 'express'
import {
  generateUPILink,
  submitPayment,
  getMyPayments,
  getPending,
  approvePayment,
} from '../controllers/paymentController.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const router = Router()

router.get('/upi-link',       authenticate,               generateUPILink)
router.post('/submit',        authenticate,               submitPayment)
router.get('/me',             authenticate,               getMyPayments)
router.get('/pending',        authenticate, requireAdmin, getPending)
router.patch('/:id/approve',  authenticate, requireAdmin, approvePayment)

export default router
