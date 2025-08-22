import Doctor from "../models/Doctor.js";
import { getIO } from "../sockets/io.js";
import { getQueueForDoctor} from "../utils/estimateWait.js";

// Create new doctor
export const createDoctor = async (req, res) => {
  try {
    const doctor = new Doctor(req.body);
    await doctor.save();
    res.status(201).json(doctor);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get all doctors
export const getDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find();
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single doctor
export const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    res.json(doctor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update doctor
export const updateDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    res.json(doctor);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete doctor
export const deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    res.json({ message: "Doctor deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//Doctorstatus update 
export const updateDoctorStatus = async (req, res) => {
  const { isRunningLate, lateByMinutes, avgConsultMinutes } = req.body;
  const doctor = await Doctor.findByIdAndUpdate(
    req.params.id,
    { ...(isRunningLate !== undefined && { isRunningLate }),
      ...(lateByMinutes !== undefined && { lateByMinutes }),
      ...(avgConsultMinutes !== undefined && { avgConsultMinutes }) },
    { new: true }
  );
  if (!doctor) return res.status(404).json({ message: "Doctor not found" });
  res.json(doctor);
  try {
    const io = getIO();
    const queue = await getQueueForDoctor(doctor._id);
    io.to(`doctor:${String(doctor._id)}`).emit("doctor:status", { doctorId: doctor._id, isRunningLate: doctor.isRunningLate, lateByMinutes: doctor.lateByMinutes });
    io.to(`doctor:${String(doctor._id)}`).emit("queue:state", { doctorId: doctor._id, list: queue });
  } catch (err) {
    console.error("broadcast error (updateDoctorStatus):", err.message);
  }
};