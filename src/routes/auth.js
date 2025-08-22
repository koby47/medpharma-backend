import express from "express";
import { register, login, me } from "../controllers/authController.js";
import { validate } from "../middleware/validate.js";
import { registerSchema, loginSchema } from "../validations/authValidation.js";
import { protect } from "../middleware/auth.js";
import { registerWithInvite } from "../controllers/authInviteController.js";


const router = express.Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.get("/me", protect, me);
router.post("/register/invite", registerWithInvite);
export default router;
