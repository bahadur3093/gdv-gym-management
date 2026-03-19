import { Router } from 'express';
import { register, login, getMe, approveUser, getMembers, saveFCMToken } from '../controllers/authController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.post('/register',                    register);           // POST /api/auth/register
router.post('/login',                       login);              // POST /api/auth/login
router.get('/me',          authenticate,    getMe);              // GET  /api/auth/me
router.post('/fcm-token',       authenticate,               saveFCMToken);       // POST /api/auth/fcm-token
router.get('/members',         authenticate, requireAdmin, getMembers);          // GET  /api/auth/members
router.patch('/:id/approve',  authenticate, requireAdmin, approveUser);          // PATCH /api/auth/:id/approve

export default router;