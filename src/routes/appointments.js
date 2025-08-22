import express from "express";
import { createAppointment, getMyAppointments, getDoctorAppointments, getAppointments, updateAppointmentStatus } from "../controllers/appointmentController.js";
import { validate } from "../middleware/validate.js";
import { createAppointmentSchema } from "../validations/appointmentValidation.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.post("/", protect, validate(createAppointmentSchema), createAppointment);
router.get("/my", protect, getMyAppointments);
router.get("/doctor/:doctorId", protect, authorize("doctor", "admin"), getDoctorAppointments);
router.get("/", protect, authorize("admin"), getAppointments);
router.patch("/:id/status", protect, updateAppointmentStatus);

export default router;
