import { Router } from "express";
import { login, register } from "../controllers/auth.controllers";
import { validate, loginSchema, registerSchema } from "../utils/validation";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);

export default router;
