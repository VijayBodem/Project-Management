import { Request, Response } from "express";
import { User } from "../models/User";
import {
  emitToSession,
  emitToUser,
  emitToUserExceptSession,
} from "../socket/events";
import { sessionService } from "../services/session.service";

export const logout = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const { userId } = req.user;
  const { sessionToken } = req.body;

  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  try {
    // Deactivate the specific session or all sessions
    if (sessionToken) {
      // Logout from specific session
      const success = await sessionService.deactivateSession(
        sessionToken,
        userId
      );
      if (!success) {
        return res.status(404).json({
          success: false,
          message: "Session not found or already inactive",
        });
      }

      // Emit logout event to the specific session only
      emitToSession(sessionToken, "auth:logout", {
        message: "Logged out from this device",
        logoutAll: false,
        sessionToken,
      });
    } else {
      // Logout from all sessions
      const loggedOutCount = await sessionService.deactivateAllSessions(userId);
      await User.findByIdAndUpdate(userId, { refreshTokens: [] });

      // Emit logout event to all user's sessions
      emitToUser(userId, "auth:logout", {
        message: "Logged out from all devices",
        logoutAll: true,
        loggedOutCount,
      });
    }

    res.status(200).json({
      success: true,
      message: sessionToken
        ? "Logged out successfully"
        : "Logged out from all devices",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};

export const logoutAllDevices = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const { userId } = req.user;

  try {
    // Deactivate all sessions and clear refresh tokens
    const loggedOutCount = await sessionService.deactivateAllSessions(userId);
    await User.findByIdAndUpdate(userId, { refreshTokens: [] });

    // Emit logout event to all user's sessions
    emitToUser(userId, "auth:logout", {
      message: "Logged out from all devices",
      logoutAll: true,
      loggedOutCount,
    });

    res.status(200).json({
      success: true,
      message: "Logged out from all devices successfully",
      loggedOutCount,
    });
  } catch (error) {
    console.error("Logout all devices error:", error);
    res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};
