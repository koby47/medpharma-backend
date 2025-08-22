import express from "express";
import { getDoctorQueue, getAppointmentPosition } from "../controllers/queueController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/doctor/:doctorId", protect, getDoctorQueue);
router.get("/appointment/:id/position", protect, getAppointmentPosition);

export default router;
