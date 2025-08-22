import express from "express";
import { getDoctors, createDoctor,getDoctorById,updateDoctor,deleteDoctor ,updateDoctorStatus } from "../controllers/doctorController.js";
import { protect,authorize } from "../middleware/auth.js";

const router = express.Router();

// GET all doctors
router.get("/", getDoctors);

// POST create a new doctor
router.post("/", protect,authorize("admin"),createDoctor );
router.get("/:id", getDoctorById);
router.put("/:id", protect, authorize("admin"), updateDoctor);
router.delete("/:id", protect, authorize("admin"), deleteDoctor);

// Late/avg time updates
router.patch("/:id/status", protect, authorize("admin"), updateDoctorStatus);

export default router;
