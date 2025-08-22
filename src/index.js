import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";

import connectDB from "./config/db.js";
import doctorRoutes from "./routes/doctors.js";
import appointmentRoutes from "./routes/appointments.js";
import authRoutes from "./routes/auth.js";
import queueRoutes from "./routes/queue.js";

import { initIO } from "./sockets/io.js";
import queueSocket from "./sockets/queueSocket.js";

dotenv.config();
await connectDB();

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json());

// routes
app.use("/api/auth", authRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/queue", queueRoutes);

app.get("/", (_req, res) => res.json({ message: "MedPharma API is running..." }));

const PORT = process.env.PORT || 5000;

// http + socket
const server = http.createServer(app);
const io = initIO(server);
queueSocket(io);

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
