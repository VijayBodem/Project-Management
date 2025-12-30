import jwt from "jsonwebtoken";

import { env } from "../config/env";

interface TokenPayload {
  userId: string;
  role: string;
  name: string
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
