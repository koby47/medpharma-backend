import Joi from "joi";

export const createDoctorSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  specialization: Joi.string().min(3).max(100).required(),
  email: Joi.string().email().lowercase().required(),
  available: Joi.boolean().default(true),
});
