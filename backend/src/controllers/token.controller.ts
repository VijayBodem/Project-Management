import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { env } from "../config/env";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";

interface RefreshPayload {
  userId: string;
  role: string;
  name: string;
}

export const refreshAccessToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ success: false, message: "Refresh token required" });
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      env.jwtRefreshSecret as string
    ) as RefreshPayload;

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(403).json({ success: false, message: "User not found" });
    }

    // Check if refresh token exists in user's token array
    if (!user.refreshTokens.includes(refreshToken)) {
      // Possible token reuse attack - invalidate all tokens
      user.refreshTokens = [];
      await user.save();
      return res.status(403).json({ 
        success: false, 
        message: "Invalid refresh token. All sessions have been terminated for security." 
      });
    }

    // Generate new tokens (refresh token rotation)
    const newAccessToken = generateAccessToken({
      userId: user._id.toString(),
      role: user.role,
      name: user.name
    });

    const newRefreshToken = generateRefreshToken({
      userId: user._id.toString(),
      role: user.role,
      name: user.name
    });

    // Replace old refresh token with new one
    user.refreshTokens = user.refreshTokens
      .filter(token => token !== refreshToken)
      .concat(newRefreshToken)
      .slice(-5); // Keep only last 5 tokens

    await user.save();

    res.status(200).json({ 
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    res.status(403).json({ success: false, message: "Refresh token expired or invalid" });
  }
};
