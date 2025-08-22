import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";
import { getIO } from "../sockets/io.js";
import { getQueueForDoctor, estimateForAppointment } from "../utils/estimateWait.js";

export const createAppointment = async (req, res) => {
  const { doctor, date } = req.body;

  const doc = await Doctor.findById(doctor);
  if (!doc) return res.status(404).json({ message: "Doctor not found" });

  const appt = await Appointment.create({
    ...req.body,
    patient: req.user._id
  });

  // TODO: emit socket events (we hook in later)
  res.status(201).json(appt);
   try {
    const io = getIO();
    const queue = await getQueueForDoctor(appt.doctor);
    io.to(`doctor:${String(appt.doctor)}`).emit("queue:state", { doctorId: appt.doctor, list: queue });

    const est = await estimateForAppointment(appt._id);
    io.to(`appointment:${String(appt._id)}`).emit("queue:update", { appointmentId: appt._id, ...est });
  } catch (err) {
    console.error("broadcast error (createAppointment):", err.message);
  }
};

export const getMyAppointments = async (req, res) => {
  const appts = await Appointment.find({ patient: req.user._id }).populate("doctor");
  res.json(appts);
};

export const getDoctorAppointments = async (req, res) => {
  const { doctorId } = req.params;
  const appts = await Appointment.find({ doctor: doctorId, status: { $in: ["pending", "confirmed"] } }).sort({ date: 1 });
  res.json(appts);
};

export const getAppointments = async (_req, res) => {
  const appts = await Appointment.find().populate("doctor patient", "-password");
  res.json(appts);
};

export const updateAppointmentStatus = async (req, res) => {
  const { status } = req.body;
  const appt = await Appointment.findByIdAndUpdate(req.params.id, { status }, { new: true }).populate("doctor patient", "-password");
  if (!appt) return res.status(404).json({ message: "Appointment not found" });
  // TODO: emit socket events
  res.json(appt);
  try {
    const io = getIO();
    const queue = await getQueueForDoctor(appt.doctor);
    io.to(`doctor:${String(appt.doctor)}`).emit("queue:state", { doctorId: appt.doctor, list: queue });

    const est = await estimateForAppointment(appt._id);
    io.to(`appointment:${String(appt._id)}`).emit("queue:update", { appointmentId: appt._id, ...est });
  } catch (err) {
    console.error("broadcast error (updateAppointmentStatus):", err.message);
  }
};
