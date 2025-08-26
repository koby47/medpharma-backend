// src/controllers/authInviteController.js
import Invite from "../models/Invite.js";
import User from "../models/User.js";
import { signToken } from "../utils/jwt.js";

export const registerWithInvite = async (req, res) => {
  try {
    const { token, name, password } = req.body;
    if (!token) return res.status(400).json({ message: "Invite token required" });

    const invite = await Invite.findOne({ token });
    if (!invite) return res.status(400).json({ message: "Invite token invalid" });
    if (invite.used) return res.status(400).json({ message: "Invite token already used" });
    if (invite.expiresAt && invite.expiresAt < new Date()) return res.status(400).json({ message: "Invite token expired" });

    const email = invite.email;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User already exists with that email" });

    const user = await User.create({ name, email, password, role: invite.role });
    invite.used = true;
    invite.usedBy = user._id;
    await invite.save();

    const jwtToken = signToken({ id: user._id, role: user.role });
    res.status(201).json({ token: jwtToken, user: { id: user._id, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
