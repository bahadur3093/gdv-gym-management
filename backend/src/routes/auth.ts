import { Router } from 'express'
import {
  register,
  login,
  getMe,
  approveUser,
  getMembers,
  saveFCMToken,
  forgotPassword,
} from '../controllers/authController.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const router = Router()

router.post('/register',         register)
router.post('/login',            login)
router.get('/me',                authenticate, getMe)
router.post('/fcm-token',        authenticate, saveFCMToken)
router.get('/members',           authenticate, requireAdmin, getMembers)
router.patch('/:id/approve',     authenticate, requireAdmin, approveUser)
router.post('/forgot-password',                             forgotPassword)

export default router