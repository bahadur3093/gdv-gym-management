import { Router } from 'express'
import { reportIssue, getIssues, updateIssueStatus } from '../controllers/maintenanceController.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const router = Router()

router.post('/',        authenticate,               reportIssue)
router.get('/',         authenticate,               getIssues)
router.patch('/:id',    authenticate, requireAdmin, updateIssueStatus)

export default router
