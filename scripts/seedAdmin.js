// scripts/seedAdmin.js (run once)
import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../src/config/db.js";
import User from "../src/models/User.js";

const run = async () => {
  await connectDB();

  const email = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
  const password = process.env.SEED_ADMIN_PASSWORD || "ChangeMeNow123!";
  const name = process.env.SEED_ADMIN_NAME || "Administrator";

  const exists = await User.findOne({ email });
  if (exists) {
    console.log("Admin already exists:", email);
    process.exit(0);
  }

  const user = await User.create({ name, email, password, role: "admin" });
  console.log("Admin created:", user.email);
  process.exit(0);
};

run().catch(err => {
  console.error(err);
  process.exit(1);
});
