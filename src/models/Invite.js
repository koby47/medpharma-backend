import mongoose from "mongoose";

const inviteSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true },
  role: { type: String, enum: ["admin","doctor","patient"], required: true },
  token: { type: String, required: true, unique: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  used: { type: Boolean, default: false },
  usedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  expiresAt: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.model("Invite", inviteSchema);
