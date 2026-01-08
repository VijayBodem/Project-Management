import { Server } from "socket.io";
import http from "http";
import jwt from "jsonwebtoken";
import { instrument } from "@socket.io/admin-ui";
import { sessionService } from "../services/session.service";

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

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers.authorization?.split(" ")[1];

      const sessionToken = socket.handshake.auth?.sessionToken;

      console.log("🔐 Socket auth - token:", !!token, "sessionToken:", !!sessionToken);
      console.log("🔐 Socket auth details - sessionToken value:", sessionToken);

      if (!token) return next(new Error("Authentication error"));

      let decoded: any;

      try {
        // Try to verify as access token first
        decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET as string);
      } catch (error) {
        // If access token fails, check if it's a temp token for OTP verification
        try {
          decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET as string);
          if (!decoded.temp) {
            throw new Error("Invalid token type");
          }
        } catch (tempError) {
          return next(new Error("Authentication error"));
        }
      }

      // If session token is provided, validate it
      if (sessionToken) {
        console.log("🔐 Validating session token:", sessionToken);
        const sessionValidation = await sessionService.validateSession(sessionToken);
        console.log("🔐 Session validation result:", sessionValidation.isValid);

        if (!sessionValidation.isValid) {
          console.log("❌ Session validation failed for token:", sessionToken);
          return next(new Error("Invalid session"));
        }

        // Attach session info to socket
        socket.data.session = sessionValidation.session;
        socket.data.sessionToken = sessionToken;
        console.log("✅ Socket data set - sessionToken:", socket.data.sessionToken);
      } else {
        console.log("⚠️ No session token provided in socket auth");
      }

      // Attach user info to socket
      socket.data.user = decoded;
      next();
    } catch (error) {
      console.error("Socket authentication error:", error);
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
    console.log("🔌 User connected:", socket.data.user?.userId);
    console.log("🔌 Socket data - sessionToken:", socket.data.sessionToken);
    console.log("🔌 Total connected sockets:", io.sockets.sockets.size);

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
