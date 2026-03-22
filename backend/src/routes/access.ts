import { Router } from 'express'
import { unlockDoor } from '../controllers/accessController.js'
import { authenticate, requireMember } from '../middleware/auth.js'

const router = Router()

router.post('/unlock', authenticate, requireMember, unlockDoor)

export default router