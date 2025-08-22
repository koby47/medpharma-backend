import { Server } from "socket.io";

let io;

export const initIO = (server) => {
  io = new Server(server, {
    cors: { origin: process.env.CLIENT_ORIGIN, credentials: true }
  });
  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};
