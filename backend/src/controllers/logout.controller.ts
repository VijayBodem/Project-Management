import { Request, Response } from "express";
import { User } from "../models/User";
import { emitToUser } from "../socket/events";

export const logout = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const { userId } = req.user;
  const { refreshToken } = req.body;

  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  // Remove the specific refresh token
  if (refreshToken) {
    user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
  } else {
    // If no token provided, remove all tokens (logout from all devices)
    user.refreshTokens = [];
  }

  await user.save();

  // Emit logout event to all user's devices via Socket.IO
  emitToUser(userId, "auth:logout", {
    message: refreshToken ? "Logged out from this device" : "Logged out from all devices",
    logoutAll: !refreshToken,
  });

  res.status(200).json({ 
    success: true, 
    message: refreshToken ? "Logged out successfully" : "Logged out from all devices" 
  });
};

export const logoutAllDevices = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const { userId } = req.user;

  await User.findByIdAndUpdate(userId, { refreshTokens: [] });

  // Emit logout event to all user's devices via Socket.IO
  emitToUser(userId, "auth:logout", {
    message: "Logged out from all devices",
    logoutAll: true,
  });

  res.status(200).json({ 
    success: true, 
    message: "Logged out from all devices successfully" 
  });
};
