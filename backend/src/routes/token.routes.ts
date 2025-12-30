import { Router } from "express";
import { refreshAccessToken } from "../controllers/token.controller";

import { authenticate } from "../middlewares/auth.middleware";
import { logout, logoutAllDevices } from "../controllers/logout.controller";

const router = Router();

router.post("/refresh", refreshAccessToken);
router.post("/logout", authenticate, logout);
router.post("/logout-all", authenticate, logoutAllDevices);

export default router;
