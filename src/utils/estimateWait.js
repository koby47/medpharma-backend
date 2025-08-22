import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";
import mongoose from "mongoose";

// Queue for a doctor (pending or confirmed, sorted by date)
export const getQueueForDoctor = async (doctorId) => {
  const queue = await Appointment.find({
    doctor: new mongoose.Types.ObjectId(doctorId),
    status: { $in: ["pending", "confirmed"] },
    date: { $gte: new Date("2000-01-01") }
  })
    .sort({ date: 1 })
    .select("_id patient patientName date");

  return queue;
};

export const estimateForAppointment = async (appointmentId) => {
  const appt = await Appointment.findById(appointmentId).populate("doctor");
  if (!appt) return null;

  const doc = appt.doctor;
  const avg = doc?.avgConsultMinutes ?? 12;
  const late = doc?.lateByMinutes ?? 0;

  const queue = await getQueueForDoctor(appt.doctor._id);
  const ids = queue.map(q => String(q._id));
  const index = ids.indexOf(String(appt._id)); // 0-based

  if (index === -1) {
    return { position: -1, etaMinutes: 0 };
  }

  const position = index; // people ahead
  const etaMinutes = position * avg + late;

  return { position, etaMinutes, avgConsultMinutes: avg, lateByMinutes: late };
};
