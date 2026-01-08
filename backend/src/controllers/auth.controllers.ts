import { Request, Response } from "express";

import { User } from "../models/User";
import { Session } from "../models/Session.model";

import { generateAccessToken, generateRefreshToken } from "../utils/jwt";
import { AppError } from "../middlewares/errorHandler";
import { sessionService, DeviceInfo } from "../services/session.service";
import { otpService } from "../services/otp.service";
import { performSessionLogout } from "./session.controllers";

export const verifyOTP = async (req: Request, res: Response) => {
  const {
    otp,
    purpose,
    deviceFingerprint,
    deviceInfo,
    sessionToken,
    exceptCurrent,
    currentSessionToken,
  } = req.body;

  // Get client information
  const ip =
    req.ip ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    "unknown";
  const userAgent = req.get("User-Agent") || "unknown";

  try {
    // Get user from auth middleware (requires valid temp token for login OTP)
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify OTP
    const otpResult = await otpService.verifyOTP({
      userId: userId,
      otp,
      purpose,
    });

    if (!otpResult.success) {
      return res.status(400).json({
        success: false,
        message: otpResult.message,
      });
    }

    // OTP verified successfully - handle different purposes
    if (purpose === "login") {
      // Complete the login process and return tokens
      const loginResult = await performLogin(
        user,
        ip,
        userAgent,
        deviceFingerprint,
        deviceInfo,
        "otp"
      );
      return res.status(200).json(loginResult);
    } else if (purpose === "session_logout") {
      // Logout specific session
      if (!sessionToken) {
        return res.status(400).json({
          success: false,
          message: "Session token required for session logout",
        });
      }

      const result = await performSessionLogout(
        userId,
        sessionToken,
        "session_logout"
      );
      res.status(200).json(result);
    } else if (purpose === "logout_all") {
      // Logout all sessions
      const result = await performSessionLogout(
        userId,
        "",
        "logout_all",
        currentSessionToken
      );
      res.status(200).json(result);
    } else {
      res.status(200).json({
        success: true,
        message: "Verification successful",
      });
    }
  } catch (error) {
    console.error("OTP verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Verification failed. Please try again.",
    });
  }
};

export const register = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });

  if (existingUser)
    return res
      .status(400)
      .json({ success: false, message: "User already exists" });

  const user = await User.create({ name, email, password });

  const payload = {
    userId: user._id.toString(),
    role: user.role,
    name: user.name,
  };

  const refreshToken = generateRefreshToken(payload);

  // Store refresh token in array
  user.refreshTokens = [refreshToken];

  await user.save();

  res.status(201).json({
    success: true,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    accessToken: generateAccessToken(payload),
    refreshToken,
  });
};

export const login = async (req: Request, res: Response) => {
  const { email, password, deviceFingerprint, deviceInfo } = req.body;

  // Get client information
  const ip =
    req.ip ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    "unknown";
  const userAgent = req.get("User-Agent") || "unknown";

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    // Check if account is locked
    if (user.isLocked()) {
      const lockTimeRemaining = Math.ceil(
        (user.lockUntil!.getTime() - Date.now()) / 1000 / 60
      );
      return res.status(423).json({
        success: false,
        message: `Account is locked due to too many failed login attempts. Please try again in ${lockTimeRemaining} minutes.`,
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      // Increment login attempts
      await user.incLoginAttempts();

      // Check if account is now locked
      const updatedUser = await User.findById(user._id);
      if (updatedUser?.isLocked()) {
        return res.status(423).json({
          success: false,
          message:
            "Account locked due to too many failed login attempts. Please try again in 2 hours.",
        });
      }

      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // Check for concurrent sessions from DIFFERENT devices
    const activeSessions = await Session.find({
      userId: user._id,
      isActive: true,
    });

    // Check if any active session is from a different device
    const hasConcurrentLogin = activeSessions.some(
      (session) =>
        session.deviceInfo.fingerprint !== (deviceFingerprint || "unknown")
    );

    // If user has active sessions from different devices, require OTP
    if (hasConcurrentLogin) {
      console.log(
        `🔐 Concurrent login detected for user ${user._id} from different device, requiring OTP verification`
      );
      console.log(`📧 Sending OTP to email: ${user.email}`);

      // Parse device info
      const parsedDeviceInfo: DeviceInfo = sessionService.parseDeviceInfo(
        userAgent,
        deviceFingerprint || "unknown"
      );

      // Create OTP for login verification
      await otpService.createAndSendOTP({
        userId: user._id,
        email: user.email,
        purpose: "login",
        ip,
        userAgent,
        userName: user.name,
      });

      return res.status(200).json({
        success: true,
        requiresOTP: true,
        message: "Please verify your identity with the code sent to your email",
        tempToken: generateAccessToken({
          userId: user._id.toString(),
          role: "temp", // Temporary role for temp tokens
          name: "Temp User",
          temp: true,
          purpose: "otp_verification",
        }), // Temporary token for OTP verification
      });
    }

    // Normal login flow - no concurrent sessions
    const loginResult = await performLogin(user, ip, userAgent, deviceFingerprint, deviceInfo);
    return res.status(200).json(loginResult);
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
    });
  }
};

// Separate function for the actual login process
async function performLogin(
  user: any,
  ip: string,
  userAgent: string,
  deviceFingerprint: string,
  deviceInfo: any,
  loginMethod: "normal" | "otp" = "normal"
): Promise<{
  success: boolean;
  user: any;
  accessToken: string;
  refreshToken: string;
  sessionToken: string;
  loginMethod: string;
}> {
  const payload = {
    userId: user._id.toString(),
    role: user.role,
    name: user.name,
  };

  const refreshToken = generateRefreshToken(payload);

  // Parse device info
  const parsedDeviceInfo: DeviceInfo =
    deviceInfo ||
    sessionService.parseDeviceInfo(userAgent, deviceFingerprint || "unknown");

  // Create session
  const session = await sessionService.createSession({
    userId: user._id,
    refreshToken,
    deviceInfo: parsedDeviceInfo,
    ip,
    userAgent,
    loginMethod,
  });

  // Update user's refresh tokens (keep last 5)
  user.refreshTokens = [...user.refreshTokens, refreshToken].slice(-5);
  await user.save();

  return {
    success: true,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    accessToken: generateAccessToken(payload),
    refreshToken,
    sessionToken: session.sessionToken,
    loginMethod,
  };
}
