import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    patientName: { type: String, required: true, trim: true },
    patientEmail: { type: String, required: true, lowercase: true },
    patientPhone: { type: String, required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    date: { type: Date, required: true }, // scheduled time
    reason: { type: String, trim: true },
    status: { type: String, enum: ["pending", "confirmed", "cancelled", "completed"], default: "pending" }
  },
  { timestamps: true }
);

export default mongoose.model("Appointment", appointmentSchema);
