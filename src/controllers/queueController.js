import { getQueueForDoctor, estimateForAppointment } from "../utils/estimateWait.js";

export const getDoctorQueue = async (req, res) => {
  const { doctorId } = req.params;
  const queue = await getQueueForDoctor(doctorId);
  res.json(queue);
};

export const getAppointmentPosition = async (req, res) => {
  const { id } = req.params;
  const est = await estimateForAppointment(id);
  if (!est) return res.status(404).json({ message: "Appointment not found" });
  res.json(est);
};
