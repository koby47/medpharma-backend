import Joi from "joi";

export const createAppointmentSchema = Joi.object({
  patientName: Joi.string().min(2).max(100).required(),
  patientEmail: Joi.string().email().lowercase().required(),
  patientPhone: Joi.string().min(7).max(20).required(),
  doctor: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  date: Joi.date().greater("now").required(),
  reason: Joi.string().max(500).allow("", null),
  status: Joi.string().valid("pending", "confirmed", "cancelled", "completed").optional()
});
