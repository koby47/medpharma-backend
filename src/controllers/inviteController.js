import crypto from "crypto";
import Invite from "../models/Invite.js";

export const createInvite = async (req, res) => {
  try {
    const { email, role, expiresInHours = 72 } = req.body;

    if (!["admin","doctor","patient"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Optionally: prevent duplicate active invites
    const existing = await Invite.findOne({ email, role, used: false, expiresAt: { $gt: new Date() } });
    if (existing) return res.status(409).json({ message: "Active invite already exists for this email/role" });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = expiresInHours ? new Date(Date.now() + expiresInHours * 3600 * 1000) : null;

    const invite = await Invite.create({
      email,
      role,
      token,
      createdBy: req.user._id,
      expiresAt
    });

    // TODO: send email with invite link (CLIENT_URL + token)
    // For now return token for manual delivery
    return res.status(201).json({ inviteId: invite._id, token: invite.token, expiresAt: invite.expiresAt });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};
