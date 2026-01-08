import { Router } from "express";
import { verifyOTP } from "../controllers/auth.controllers";
import { getUserSessions, logoutSession, logoutAllSessions } from "../controllers/session.controllers";
import { validate, verifyOTPSchema, logoutSessionSchema, logoutAllSchema } from "../utils/validation";
import { authenticate, authenticateTemp } from "../middlewares/auth.middleware";

const router = Router();

// OTP verification (requires temp token for login OTP, or full auth for logout OTP)
router.post("/verify-otp", authenticateTemp, validate(verifyOTPSchema), verifyOTP);

// Session management routes (require full authentication)
router.get("/sessions", authenticate, getUserSessions);
router.post("/sessions/logout", authenticate, validate(logoutSessionSchema), logoutSession);
router.post("/sessions/logout-all", authenticate, validate(logoutAllSchema), logoutAllSessions);

export default router;
