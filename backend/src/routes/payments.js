import { Router } from 'express';
import { submitPayment, getMyPayments, getPending, approvePayment, generateUPILink } from '../controllers/paymentController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/upi-link',    authenticate,               generateUPILink);  // GET  /api/payments/upi-link
router.post('/submit',     authenticate,               submitPayment);    // POST /api/payments/submit
router.get('/me',          authenticate,               getMyPayments);    // GET  /api/payments/me
router.get('/pending',     authenticate, requireAdmin, getPending);       // GET  /api/payments/pending
router.patch('/:id/approve', authenticate, requireAdmin, approvePayment);// PATCH /api/payments/:id/approve

export default router;
