import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    specialization: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
    },
    availability: {
      type: [String], // e.g. ["Monday 9-5", "Tuesday 10-3"]
      default: [],
    },
    avgConsultMinutes: { type: Number, default: 12 },
    isRunningLate: { type: Boolean, default: false },
    lateByMinutes: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.model("Doctor", doctorSchema);
