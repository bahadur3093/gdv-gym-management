import { Router } from 'express';
import { reportIssue, getIssues, updateIssueStatus } from '../controllers/maintenanceController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.post('/',           authenticate,               reportIssue);       // POST  /api/maintenance
router.get('/',            authenticate,               getIssues);         // GET   /api/maintenance
router.patch('/:id',       authenticate, requireAdmin, updateIssueStatus); // PATCH /api/maintenance/:id

export default router;
