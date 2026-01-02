/**
 * Main Express server configuration and setup
 * Handles HTTP server initialization, middleware configuration,
 * route setup, and database connection for the Project Management API
 */

import express from "express";
import cors from "cors";
import compression from "compression";
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

// Environment variables are loaded in config/env.ts using zod for validation
// No need to manually load dotenv here as it's handled in the env config
// import dotenv from "dotenv";
// dotenv.config();

// API route handlers
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

// Initialize Express application
const app = express();

// Create HTTP server instance to support both HTTP and WebSocket connections
const server = http.createServer(app);

// Initialize WebSocket server for real-time communication
// Enables features like live notifications, collaborative editing, etc.
initSocket(server);

// ===== COMPRESSION MIDDLEWARE =====

// Enable response compression to reduce bandwidth usage
// Automatically compresses responses over 1KB with gzip/deflate
app.use(
  compression({
    level: 6, // Balanced compression level (1-9, 6 is default)
    threshold: 1024, // Only compress responses larger than 1KB
    filter: (req: express.Request, res: express.Response) => {
      // Skip compression for already compressed content types
      const contentType = res.getHeader("Content-Type") as string;
      if (
        contentType &&
        (contentType.includes("image/") ||
          contentType.includes("video/") ||
          contentType.includes("audio/") ||
          req.headers["x-no-compression"])
      ) {
        return false;
      }
      return compression.filter(req, res);
    },
  })
);

// ===== SECURITY MIDDLEWARE CONFIGURATION =====

// Set comprehensive security headers (helmet)
// Protects against common web vulnerabilities like clickjacking, XSS, etc.
app.use(helmetConfig);

// Configure CORS (Cross-Origin Resource Sharing)
// Allows requests from the frontend application only
app.use(
  cors({
    origin: env.frontendUrl, // Only allow requests from the configured frontend URL
    credentials: true, // Allow cookies and authentication headers
  })
);

// Parse JSON request bodies with size limit
// Prevents abuse through oversized payloads
app.use(express.json({ limit: "10kb" }));

// NOTE: Additional security middlewares are temporarily disabled for testing
// These should be re-enabled in production for maximum security
// app.use(sanitizeData); // Sanitize MongoDB queries to prevent NoSQL injection
// app.use(xssProtection); // Sanitize user input to prevent XSS attacks
// app.use(hppProtection); // Prevent HTTP Parameter Pollution attacks

// ===== HEALTH CHECK ENDPOINT =====
// Simple health check route for monitoring and load balancer checks
app.get("/health", (req, res) => {
  res
    .status(200)
    .json({ success: true, message: "SkillForge API is running 🚀" });
});

// ===== RATE LIMITING CONFIGURATION =====

// Apply strict rate limiting to authentication routes
// Prevents brute force attacks and credential stuffing
app.use("/api/auth", authLimiter, authRoutes);

// Token routes (refresh, revoke) - moderate rate limiting
app.use("/api/token", tokenRoutes);

// Apply general API rate limiting to all other routes
// Prevents abuse and ensures fair resource usage
app.use("/api", apiLimiter);

// ===== API ROUTE CONFIGURATION =====

// Protected routes requiring authentication
app.use("/api/protected", protectedRoutes);

// Core business logic routes
app.use("/api/projects", projectRoutes); // Project CRUD operations
app.use("/api/tasks", taskRoutes); // Task management within projects
app.use("/api/comments", commentRoutes); // Comments on tasks/projects
app.use("/api/activities", activityRoutes); // User activity logging
app.use("/api/notifications", notificationRoutes); // User notifications
app.use("/api/search", searchRoutes); // Global search functionality
app.use("/api/users", userRoutes); // User profile and settings

// Apply additional strict rate limiting to sensitive operations
// app.use("/api/users/change-password", passwordChangeLimiter);

// ===== ERROR HANDLING MIDDLEWARE =====
// Must be placed after all routes to catch any unhandled errors

// Handle 404 Not Found errors for undefined routes
app.use(notFoundHandler);

// Global error handler - catches and formats all application errors
app.use(errorHandler);

// Port configuration is handled in config/env.ts with validation
// No need for fallback PORT here as env.port is guaranteed to be valid
// const PORT = process.env.PORT || 5000;

/**
 * Server initialization function
 * Ensures database connection is established before starting the HTTP server
 * This prevents runtime crashes and ensures data consistency
 */
const startServer = async (): Promise<void> => {
  try {
    // Establish database connection before accepting requests
    await connectDB();

    // Start the HTTP/WebSocket server
    server.listen(env.port, () => {
      console.log(`🚀 SkillForge API server running on port ${env.port}`);
      console.log(`📡 WebSocket server initialized for real-time features`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1); // Exit with error code if server fails to start
  }
};

// Initialize the server
startServer();
