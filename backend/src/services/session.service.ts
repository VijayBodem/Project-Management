import { Session, ISession } from "../models/Session.model";
import { User } from "../models/User";
import { geolocationService, GeolocationData } from "./geolocation.service";
import { AppError } from "../middlewares/errorHandler";
import mongoose from "mongoose";
import crypto from "crypto";

export interface DeviceInfo {
  fingerprint: string;
  userAgent: string;
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  device: "mobile" | "tablet" | "desktop";
  platform: string;
}

export interface CreateSessionParams {
  userId: mongoose.Types.ObjectId;
  refreshToken: string;
  deviceInfo: DeviceInfo;
  ip: string;
  userAgent?: string;
  loginMethod?: "normal" | "otp";
}

export interface SessionValidationResult {
  isValid: boolean;
  session?: ISession;
  error?: string;
}

class SessionService {
  /**
   * Create a new session
   */
  async createSession(params: CreateSessionParams): Promise<ISession> {
    try {
      // Generate unique session token
      const sessionToken = this.generateSessionToken();

      // Get geolocation data
      const location = await geolocationService.getLocation(params.ip);

      // Calculate expiration (30 days from now)
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      // Get user's previous sessions for risk assessment
      const previousSessions = await Session.find({
        userId: params.userId,
        isActive: true,
      })
        .sort({ loginTime: -1 })
        .limit(10);

      const previousLocations = previousSessions
        .map((s) => s.location)
        .filter((loc) => loc.country && loc.city) as GeolocationData[];

      // Assess risk score
      const riskScore = geolocationService.assessRiskScore(
        location,
        previousLocations
      );

      // Create session
      const session = await Session.create({
        userId: params.userId,
        sessionToken,
        refreshToken: params.refreshToken,
        deviceInfo: params.deviceInfo,
        location,
        loginTime: new Date(),
        lastActivity: new Date(),
        expiresAt,
        isActive: true,
        loginMethod: params.loginMethod || "normal",
        isSuspicious: riskScore > 70,
        riskScore,
      });

      console.log(`📱 Session created:`, {
        sessionId: session._id,
        userId: params.userId,
        device: params.deviceInfo.device,
        location: `${location.city}, ${location.country}`,
        riskScore,
      });

      return session;
    } catch (error) {
      console.error("❌ Failed to create session:", error);
      throw new AppError("Failed to create session", 500);
    }
  }

  /**
   * Validate session by token
   */
  async validateSession(
    sessionToken: string
  ): Promise<SessionValidationResult> {
    try {
      const session = await Session.findOne({
        sessionToken,
        isActive: true,
      });

      if (!session) {
        return { isValid: false, error: "Session not found" };
      }

      if ((session as any).isExpired()) {
        await (session as any).deactivate();
        return { isValid: false, error: "Session expired" };
      }

      // Update last activity
      await (session as any).updateActivity();

      return { isValid: true, session };
    } catch (error) {
      console.error("❌ Failed to validate session:", error);
      return { isValid: false, error: "Session validation failed" };
    }
  }

  /**
   * Get active sessions for a user
   */
  async getUserSessions(userId: string): Promise<ISession[]> {
    try {
      const sessions = await Session.find({
        userId: new mongoose.Types.ObjectId(userId),
        isActive: true,
      })
        .sort({ lastActivity: -1 })
        .select("-refreshToken"); // Don't expose refresh tokens

      return sessions;
    } catch (error) {
      console.error("❌ Failed to get user sessions:", error);
      throw new AppError("Failed to retrieve sessions", 500);
    }
  }

  /**
   * Deactivate a specific session
   */
  async deactivateSession(
    sessionToken: string,
    userId: string
  ): Promise<boolean> {
    try {
      const result = await Session.updateOne(
        {
          sessionToken,
          userId: new mongoose.Types.ObjectId(userId),
          isActive: true,
        },
        { isActive: false }
      );

      if (result.modifiedCount > 0) {
        console.log(`🚪 Session deactivated:`, { sessionToken, userId });
        return true;
      }

      return false;
    } catch (error) {
      console.error("❌ Failed to deactivate session:", error);
      throw new AppError("Failed to deactivate session", 500);
    }
  }

  /**
   * Deactivate all sessions for a user except current
   */
  async deactivateAllSessions(
    userId: string,
    exceptSessionToken?: string
  ): Promise<number> {
    try {
      const query: any = {
        userId: new mongoose.Types.ObjectId(userId),
        isActive: true,
      };

      if (exceptSessionToken) {
        query.sessionToken = { $ne: exceptSessionToken };
      }

      const result = await Session.updateMany(query, { isActive: false });

      console.log(
        `🚪 Deactivated ${result.modifiedCount} sessions for user ${userId}`
      );
      return result.modifiedCount;
    } catch (error) {
      console.error("❌ Failed to deactivate user sessions:", error);
      throw new AppError("Failed to deactivate sessions", 500);
    }
  }

  /**
   * Check if user has active sessions
   */
  async hasActiveSessions(userId: string): Promise<boolean> {
    try {
      const count = await Session.countDocuments({
        userId: new mongoose.Types.ObjectId(userId),
        isActive: true,
      });

      return count > 0;
    } catch (error) {
      console.error("❌ Failed to check active sessions:", error);
      return false;
    }
  }

  /**
   * Clean up expired sessions (can be called by a scheduled job)
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const result = await Session.updateMany(
        {
          isActive: true,
          expiresAt: { $lt: new Date() },
        },
        { isActive: false }
      );

      if (result.modifiedCount > 0) {
        console.log(`🧹 Cleaned up ${result.modifiedCount} expired sessions`);
      }

      return result.modifiedCount;
    } catch (error) {
      console.error("❌ Failed to cleanup expired sessions:", error);
      return 0;
    }
  }

  /**
   * Parse device info from user agent
   */
  parseDeviceInfo(userAgent: string, fingerprint: string): DeviceInfo {
    // Simple user agent parsing (in production, use a library like 'ua-parser-js')
    const ua = userAgent.toLowerCase();

    let browser = "Unknown";
    let browserVersion = "Unknown";
    let os = "Unknown";
    let osVersion = "Unknown";
    let device: "mobile" | "tablet" | "desktop" = "desktop";
    let platform = "Unknown";

    // Detect device type
    if (
      ua.includes("mobile") ||
      (ua.includes("android") && !ua.includes("tablet"))
    ) {
      device = "mobile";
    } else if (ua.includes("tablet") || ua.includes("ipad")) {
      device = "tablet";
    }

    // Detect OS
    if (ua.includes("windows")) {
      os = "Windows";
      platform = "Windows";
      const match = ua.match(/windows nt (\d+\.\d+)/);
      if (match) osVersion = match[1];
    } else if (ua.includes("mac os x") || ua.includes("macos")) {
      os = "macOS";
      platform = "macOS";
      const match = ua.match(/mac os x (\d+[_\d]+)/);
      if (match) osVersion = match[1].replace(/_/g, ".");
    } else if (ua.includes("linux")) {
      os = "Linux";
      platform = "Linux";
    } else if (ua.includes("android")) {
      os = "Android";
      platform = "Android";
      const match = ua.match(/android (\d+\.\d+)/);
      if (match) osVersion = match[1];
    } else if (
      ua.includes("ios") ||
      ua.includes("iphone") ||
      ua.includes("ipad")
    ) {
      os = "iOS";
      platform = "iOS";
      const match = ua.match(/os (\d+[_\d]+)/);
      if (match) osVersion = match[1].replace(/_/g, ".");
    }

    // Detect browser
    if (ua.includes("chrome") && !ua.includes("edg")) {
      browser = "Chrome";
      const match = ua.match(/chrome\/(\d+\.\d+)/);
      if (match) browserVersion = match[1];
    } else if (ua.includes("firefox")) {
      browser = "Firefox";
      const match = ua.match(/firefox\/(\d+\.\d+)/);
      if (match) browserVersion = match[1];
    } else if (ua.includes("safari") && !ua.includes("chrome")) {
      browser = "Safari";
      const match = ua.match(/version\/(\d+\.\d+)/);
      if (match) browserVersion = match[1];
    } else if (ua.includes("edg")) {
      browser = "Edge";
      const match = ua.match(/edg\/(\d+\.\d+)/);
      if (match) browserVersion = match[1];
    }

    return {
      fingerprint,
      userAgent,
      browser,
      browserVersion,
      os,
      osVersion,
      device,
      platform,
    };
  }

  /**
   * Generate unique session token
   */
  private generateSessionToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * Get session statistics for monitoring
   */
  async getSessionStats(): Promise<{
    total: number;
    active: number;
    expired: number;
    suspicious: number;
  }> {
    try {
      const now = new Date();

      const [total, active, expired, suspicious] = await Promise.all([
        Session.countDocuments({}),
        Session.countDocuments({ isActive: true }),
        Session.countDocuments({ isActive: false, expiresAt: { $lt: now } }),
        Session.countDocuments({ isSuspicious: true, isActive: true }),
      ]);

      return { total, active, expired, suspicious };
    } catch (error) {
      console.error("❌ Failed to get session stats:", error);
      return { total: 0, active: 0, expired: 0, suspicious: 0 };
    }
  }
}

// Export singleton instance
export const sessionService = new SessionService();
export default sessionService;
