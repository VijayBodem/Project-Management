import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import { UserRole } from "../utils/roles";

const router = Router();

/**
 * Only logged-in users
 */

router.get("/profile", authenticate, (req, res) => {
  res.json({ message: "Access Granted", user: req.user });
});

/**
 * Admin only route
 */

router.get("/admin", authenticate, authorize([UserRole.ADMIN]), (req, res) => {
  res.json({ message: "Admin Access Granted" });
});

export default router;
