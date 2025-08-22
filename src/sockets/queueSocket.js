import { getQueueForDoctor, estimateForAppointment } from "../utils/estimateWait.js";

export default (io) => {
  io.on("connection", (socket) => {
    // client sends doctorId or appointmentId to subscribe
    socket.on("queue:subscribe", async ({ doctorId, appointmentId }) => {
      if (doctorId) {
        socket.join(`doctor:${doctorId}`);
        const list = await getQueueForDoctor(doctorId);
        socket.emit("queue:state", { doctorId, list });
      }
      if (appointmentId) {
        socket.join(`appointment:${appointmentId}`);
        const est = await estimateForAppointment(appointmentId);
        if (est) socket.emit("queue:update", { appointmentId, ...est });
      }
    });

    socket.on("queue:unsubscribe", ({ doctorId, appointmentId }) => {
      if (doctorId) socket.leave(`doctor:${doctorId}`);
      if (appointmentId) socket.leave(`appointment:${appointmentId}`);
    });
  });
};

// helpers to broadcast after DB changes
export const broadcastDoctorQueue = async (io, doctorId, payload) => {
  io.to(`doctor:${doctorId}`).emit("queue:state", { doctorId, ...payload });
};

export const broadcastAppointmentUpdate = (io, appointmentId, payload) => {
  io.to(`appointment:${appointmentId}`).emit("queue:update", { appointmentId, ...payload });
};

export const notifyTurnNow = (io, appointmentId, joinUrl) => {
  io.to(`appointment:${appointmentId}`).emit("turn:now", { appointmentId, joinUrl });
};
