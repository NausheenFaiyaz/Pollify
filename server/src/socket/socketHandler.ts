import { Server } from "socket.io";

let io: Server | null = null;

export const registerSocket = (server: Server) => {
  io = server;
  io.on("connection", (socket) => {
    socket.on("poll:join", (slug: string) => {
      socket.join(`poll:${slug}`);
    });

    socket.on("poll:leave", (slug: string) => {
      socket.leave(`poll:${slug}`);
    });
  });
};

export const emitAnalyticsUpdate = (slug: string, payload: unknown) => {
  io?.to(`poll:${slug}`).emit("analytics:update", payload);
};
