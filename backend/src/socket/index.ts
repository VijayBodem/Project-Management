import { Server } from "socket.io";
import http from "http";
import jwt from "jsonwebtoken";
import { instrument } from "@socket.io/admin-ui";

let io: Server;

export const initSocket = (server: http.Server) => {
  console.log("process.env.CLIENT_URL", process.env.CLIENT_URL);
  io = new Server(server, {
    cors: {
      origin: [process.env.CLIENT_URL!, "https://admin.socket.io"],
      credentials: true,
    },
  });

  // Socket authentication middleware

  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers.authorization?.split(" ")[1];

      console.log("token********", token);

      if (!token) return next(new Error("Authentication error"));

      const decoded = jwt.verify(
        token,
        process.env.JWT_ACCESS_SECRET as string
      );

      // attach user info to socket
      socket.data.user = decoded;
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  // Instrument Admin UI
  instrument(io, {
    auth: {
      type: "basic",
      username: "admin",
      password: "$2b$10$Cgli1C7lHs7UVDsRUE5G7ejfWLtef0oFR5fk7MOVmEfJ9h7k7HbLS", // The Admin UI expects the password to be a bcrypt hash, not the raw value.
    },
    mode: "development",
  });

  io.on("connection", (socket) => {
    console.log("🔌 User connected:", socket.data.user);

    const user = socket.data.user;

    // 👤 User-specific room
    socket.join(`user:${user.userId}`);

    socket.on("socket:ready", () => {
      console.log("socket:readyyyyyyyyy");
      socket.emit("notification", {
        title: "Login Successful",
        message: "Welcome back to SkillForge 🚀",
      });
    });

    // 🌍 Global room
    socket.join("global");

    // 📋 Join project room
    socket.on("project:join", (projectId: string) => {
      socket.join(`project:${projectId}`);
      console.log(`👤 ${user.userId} joined project:${projectId}`);

      console.log('USERRRRRRR', user)

      // Notify others in the project
      socket.to(`project:${projectId}`).emit("project:user-joined", {
        userId: user.userId,
        userName: user.name || "User",
      });

      // Send current viewers to the new user
      io.in(`project:${projectId}`).fetchSockets().then((sockets) => {
        const viewers = sockets
          .filter((s) => s.id !== socket.id)
          .map((s) => ({
            userId: s.data.user.userId,
            userName: s.data.user.name || "User",
            socketId: s.id,
          }));

        socket.emit("project:current-viewers", viewers);
      });
    });

    // 📋 Leave project room
    socket.on("project:leave", (projectId: string) => {
      socket.leave(`project:${projectId}`);
      console.log(`👤 ${user.userId} left project:${projectId}`);

      // Notify others
      socket.to(`project:${projectId}`).emit("project:user-left", {
        userId: user.userId,
      });
    });

    // 🖱️ Cursor position updates
    socket.on("cursor:move", (data: { projectId: string; x: number; y: number }) => {
      socket.to(`project:${data.projectId}`).emit("cursor:update", {
        userId: user.userId,
        userName: user.name || "User",
        x: data.x,
        y: data.y,
      });
    });

    console.log(`🔌 ${user.userId} joined rooms`);

    socket.on("disconnect", () => {
      console.log("❌ User disconnected:", socket.data.user);

      // Notify all project rooms this user was in
      const rooms = Array.from(socket.rooms);
      rooms.forEach((room) => {
        if (room.startsWith("project:")) {
          socket.to(room).emit("project:user-left", {
            userId: user.userId,
          });
        }
      });
    });
  });
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};
