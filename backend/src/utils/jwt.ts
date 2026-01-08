import jwt from "jsonwebtoken";

import { env } from "../config/env";

interface TokenPayload {
  userId: string;
  role: string;
  name: string;
  temp?: boolean; // For temporary tokens used in OTP verification
  purpose?: string; // Purpose of the token (for temp tokens)
}

export const generateAccessToken = (payload: TokenPayload) => {
  return jwt.sign(payload, env.jwtAccessSecret as string, {
    expiresIn: env.jwtAccessExpires,
  });
};

export const generateRefreshToken = (payload: TokenPayload) => {
  return jwt.sign(payload, env.jwtRefreshSecret as string, {
    expiresIn: env.jwtRefreshExpires,
  });
};
