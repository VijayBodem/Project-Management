import { Request, Response, NextFunction } from "express";

import jwt from "jsonwebtoken";

import { env } from "../config/env";
import { UserRole } from "../utils/roles";

interface JwtPayload {
  userId: string;
  role: UserRole;
  temp?: boolean;
  purpose?: string;
  name?: string;
}

/**
 * Verify access token middleware
 */

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  // Expect Bearer token
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access token missing" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, env.jwtAccessSecret) as JwtPayload;
    // console.log("Decodedddd", decoded);

    // Attach user info to request
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

/**
 * Authenticate middleware that accepts both temp tokens and regular access tokens
 * Used for OTP verification where temp tokens are needed for login verification
 */
export const authenticateTemp = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  // Expect Bearer token
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication token missing" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, env.jwtAccessSecret) as JwtPayload;

    // Attach user info to request (includes temp flag and purpose for temp tokens)
    req.user = decoded;

    // For temp tokens, also attach sessionToken if present (for logout operations)
    if (decoded.temp) {
      (req as any).sessionToken = decoded.sessionToken;
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
