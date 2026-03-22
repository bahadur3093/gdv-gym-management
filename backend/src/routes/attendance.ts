import { Router } from "express";
import {
  checkIn,
  checkOut,
  getCurrentlyIn,
  getMyAttendance,
  getHistory,
  autoCheckout,
} from "../controllers/attendanceController.js";
import {
  authenticate,
  requireMember,
  requireAdmin,
} from "../middleware/auth.js";

const router = Router();

// Member only — admins and watchmen don't use gym
router.post("/checkin", authenticate, requireMember, checkIn);
router.post("/checkout", authenticate, requireMember, checkOut);
router.get("/me", authenticate, getMyAttendance);

// Anyone logged in can see who's in the gym
router.get("/current", authenticate, getCurrentlyIn);

// Admin full history
router.get("/history", authenticate, requireAdmin, getHistory);

// Cron endpoint — secured by x-cron-secret header, no JWT needed
router.post("/auto-checkout", autoCheckout);

export default router;
