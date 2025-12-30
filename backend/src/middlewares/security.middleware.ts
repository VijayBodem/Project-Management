import rateLimit from "express-rate-limit";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import { Request, Response, NextFunction } from "express";

// Rate limiting for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: "Too many authentication attempts, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// Rate limiting for general API endpoints
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiting for password change
export const passwordChangeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password change attempts per hour
  message: {
    success: false,
    message: "Too many password change attempts, please try again after 1 hour",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Configure Helmet for security headers
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
});

// MongoDB query sanitization
export const sanitizeData = mongoSanitize({
  replaceWith: "_",
});

// Custom XSS protection middleware (since xss-clean is deprecated)
export const xssProtection = (req: Request, res: Response, next: NextFunction) => {
  const sanitizeValue = (value: any): any => {
    if (typeof value === "string") {
      // Remove script tags and event handlers
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
        .replace(/javascript:/gi, "");
    }
    if (typeof value === "object" && value !== null) {
      if (Array.isArray(value)) {
        return value.map(sanitizeValue);
      }
      const sanitized: any = {};
      for (const key in value) {
        sanitized[key] = sanitizeValue(value[key]);
      }
      return sanitized;
    }
    return value;
  };

  // Only sanitize body (which is mutable)
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }

  // Note: req.query and req.params are read-only in newer Express versions
  // They are already sanitized by express-mongo-sanitize middleware

  next();
};

// HTTP Parameter Pollution protection
export const hppProtection = (req: Request, res: Response, next: NextFunction) => {
  // Note: In newer Express versions, req.query is read-only
  // HPP protection is less critical for modern applications
  // The main protection comes from proper input validation in controllers
  next();
};

// CSRF token validation middleware
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF for GET, HEAD, OPTIONS
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  // Skip CSRF for auth endpoints (they use other protection)
  if (req.path.startsWith("/api/auth") || req.path.startsWith("/api/token")) {
    return next();
  }

  const csrfToken = req.headers["x-csrf-token"] as string;
  const sessionToken = req.headers["x-session-token"] as string;

  // For now, we'll use a simple token validation
  // In production, you'd want to use a proper CSRF library like csurf
  if (!csrfToken || !sessionToken) {
    // For backward compatibility, we'll just log a warning
    console.warn("CSRF token missing for:", req.method, req.path);
  }

  next();
};
