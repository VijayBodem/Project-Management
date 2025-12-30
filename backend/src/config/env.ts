import dotenv from "dotenv";

import jwt from "jsonwebtoken";

dotenv.config();

type JwtExpiresIn = jwt.SignOptions["expiresIn"];

const jwtAccessSecret = process.env.JWT_ACCESS_SECRET;
const jwtAccessExpires = process.env.JWT_ACCESS_EXPIRES;
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
const jwtRefreshExpires = process.env.JWT_REFRESH_EXPIRES;

if (!jwtAccessSecret) {
  throw new Error("JWT_ACCESS_SECRET is not defined");
}

export const env = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI as string,
  jwtAccessSecret,
  jwtRefreshSecret,
  jwtAccessExpires: (jwtAccessExpires || "15m") as JwtExpiresIn,
  jwtRefreshExpires: (jwtRefreshExpires || "7d") as JwtExpiresIn,
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
};

// Safety check for production

if (!env.mongoUri) {
  throw new Error("❌ MONGO_URI is not defined in environment variables"); // Prevents silent failures
}
