import { Request, Response } from "express";
import { sessionService } from "../services/session.service";
import { otpService } from "../services/otp.service";
import { User } from "../models/User";
import { AppError } from "../middlewares/errorHandler";
import {
  emitToSession,
  emitToUserExceptSession,
  emitToUser,
} from "../socket/events";

export const getUserSessions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const sessions = await sessionService.getUserSessions(userId);

    res.status(200).json({
      success: true,
      sessions: sessions.map((session) => ({
        sessionToken: session.sessionToken,
        deviceInfo: session.deviceInfo,
        location: session.location,
        loginTime: session.loginTime,
        lastActivity: session.lastActivity,
        isActive: session.isActive,
        loginMethod: session.loginMethod,
        isSuspicious: session.isSuspicious,
        riskScore: session.riskScore,
      })),
    });
  } catch (error) {
    console.error("Get user sessions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve sessions",
    });
  }
};

export const logoutSession = async (req: Request, res: Response) => {
  try {
    const { sessionToken } = req.body;
    const userId = (req as any).user.userId;

    // Get user for email
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get client info for OTP
    const ip =
      req.ip ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      "unknown";
    const userAgent = req.get("User-Agent") || "unknown";

    // Create OTP for session logout verification
    await otpService.createAndSendOTP({
      userId: user._id,
      email: user.email,
      purpose: "session_logout",
      ip,
      userAgent,
      userName: user.name,
    });

    res.status(200).json({
      success: true,
      requiresOTP: true,
      message: "Please verify your identity with the code sent to your email",
      sessionToken, // Include for frontend to know which session to logout after OTP verification
    });
  } catch (error) {
    console.error("Logout session error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to initiate session logout",
    });
  }
};

export const logoutAllSessions = async (req: Request, res: Response) => {
  try {
    const { exceptCurrent, currentSessionToken } = req.body;
    const userId = (req as any).user.userId;

    // Get user for email
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get client info for OTP
    const ip =
      req.ip ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      "unknown";
    const userAgent = req.get("User-Agent") || "unknown";

    // Create OTP for logout all verification
    await otpService.createAndSendOTP({
      userId: user._id,
      email: user.email,
      purpose: "logout_all",
      ip,
      userAgent,
      userName: user.name,
    });

    res.status(200).json({
      success: true,
      requiresOTP: true,
      message: "Please verify your identity with the code sent to your email",
      exceptCurrent,
      currentSessionToken,
    });
  } catch (error) {
    console.error("Logout all sessions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to initiate logout all sessions",
    });
  }
};

// Internal function to actually perform session logout after OTP verification
export const performSessionLogout = async (
  userId: string,
  sessionToken: string,
  purpose: "session_logout" | "logout_all",
  exceptCurrentSession?: string
): Promise<{ success: boolean; message: string; loggedOutCount?: number }> => {
  try {
    if (purpose === "session_logout") {
      console.log(
        `🚪 Starting session logout for token: ${sessionToken}, user: ${userId}`
      );
      const success = await sessionService.deactivateSession(
        sessionToken,
        userId
      );
      console.log(`🚪 Session deactivation result: ${success}`);

      if (success) {
        console.log(`🚪 Emitting logout event to session: ${sessionToken}`);
        // Emit logout event to the specific session being logged out
        emitToSession(sessionToken, "auth:logout", {
          message: "Logged out from this device",
          logoutAll: false,
          sessionToken,
        });
      }
      return {
        success,
        message: success
          ? "Session logged out successfully"
          : "Session not found or already inactive",
      };
    } else if (purpose === "logout_all") {
      console.log(
        `🚪 Logout all: userId=${userId}, exceptCurrentSession=${exceptCurrentSession}`
      );
      const loggedOutCount = await sessionService.deactivateAllSessions(
        userId,
        exceptCurrentSession
      );
      console.log(`🚪 Deactivated ${loggedOutCount} sessions`);

      // Emit logout event to all user's sessions except the current one if specified
      console.log(
        `🚪 Checking exceptCurrentSession: "${exceptCurrentSession}" (type: ${typeof exceptCurrentSession}, truthy: ${!!exceptCurrentSession})`
      );

      if (exceptCurrentSession) {
        console.log(
          `🚪 Emitting to other devices (excluding session: ${exceptCurrentSession})`
        );
        emitToUserExceptSession(userId, exceptCurrentSession, "auth:logout", {
          message: "Logged out from all other devices",
          logoutAll: true,
          loggedOutCount,
          exceptCurrent: true,
        });
      } else {
        console.log(`🚪 Emitting to all devices (including current)`);
        // Logout from all sessions including current
        emitToUser(userId, "auth:logout", {
          message: "Logged out from all devices",
          logoutAll: true,
          loggedOutCount,
        });
      }

      return {
        success: true,
        message: `Logged out from ${loggedOutCount} sessions`,
        loggedOutCount,
      };
    }

    return {
      success: false,
      message: "Invalid logout purpose",
    };
  } catch (error) {
    console.error("Perform session logout error:", error);
    return {
      success: false,
      message: "Failed to logout sessions",
    };
  }
};
