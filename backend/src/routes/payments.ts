import { Router } from "express";
import {
  getDues,
  generateUPILink,
  submitPayment,
  getMyPayments,
  getPending,
  approvePayment,
} from "../controllers/paymentController.js";
import {
  authenticate,
  requireAdmin,
  requireMember,
} from "../middleware/auth.js";

const router = Router();

router.get("/dues", authenticate, requireMember, getDues);
router.get("/upi-link", authenticate, requireMember, generateUPILink);
router.post("/submit", authenticate, requireMember, submitPayment);
router.get("/me", authenticate, getMyPayments);
router.get("/pending", authenticate, requireAdmin, getPending);
router.patch("/:id/approve", authenticate, requireAdmin, approvePayment);

export default router;
