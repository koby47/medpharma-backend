import express from "express";
import { createInvite } from "../controllers/inviteController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Admin only: create invite
router.post("/invites", protect, authorize("admin"), createInvite);

export default router;
 