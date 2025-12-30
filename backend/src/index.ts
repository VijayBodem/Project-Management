import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { connectDB } from "./config/db";
import { initSocket } from "./socket";
import http from "http";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import { 
  helmetConfig, 
  sanitizeData, 
  xssProtection, 
  hppProtection,
  apiLimiter,
  authLimiter,
  passwordChangeLimiter,
} from "./middlewares/security.middleware";

// import dotenv from "dotenv";
// // Load environment variables
// dotenv.config();

// routes
import authRoutes from "./routes/auth.routes";
import protectedRoutes from "./routes/protected.routes";
import tokenRoutes from "./routes/token.routes";
import projectRoutes from "./routes/project.routes";
import taskRoutes from "./routes/task.routes";
import commentRoutes from "./routes/comment.routes";
import activityRoutes from "./routes/activity.routes";
import notificationRoutes from "./routes/notification.routes";
import searchRoutes from "./routes/search.routes";
import userRoutes from "./routes/user.routes";

const app = express();
const server = http.createServer(app);

// Initialize WebSocket server
initSocket(server);

// Security Middlewares
app.use(helmetConfig); // Set security headers
app.use(cors({
  origin: env.frontendUrl,
  credentials: true,
}));
app.use(express.json({ limit: "10kb" })); // Body limit
// Temporarily disable these middlewares to test
// app.use(sanitizeData); // Sanitize MongoDB queries
// app.use(xssProtection); // XSS protection
// app.use(hppProtection); // HTTP Parameter Pollution protection

// Test route
app.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "SkillForge API is running 🚀" });
});

// Apply rate limiting to auth routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/token", tokenRoutes);

// Apply general rate limiting to API routes
app.use("/api", apiLimiter);

// routes
app.use("/api/protected", protectedRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/users", userRoutes);

// Apply strict rate limiting to password change
app.use("/api/users/change-password", passwordChangeLimiter);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// const PORT = process.env.PORT || 5000;

// Ensures DB is ready before serving requests
// Prevents runtime crashes
const startServer = async () => {
  await connectDB();
  server.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
};

startServer();
