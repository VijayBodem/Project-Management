import { OTP, IOTP, OTPPurpose, createOTP } from "../models/OTP.model";
import { User } from "../models/User";
import { emailService } from "./email.service";
import { AppError } from "../middlewares/errorHandler";
import mongoose from "mongoose";

export interface CreateOTPParams {
  userId: mongoose.Types.ObjectId;
  email: string;
  purpose: OTPPurpose;
  ip?: string;
  userAgent?: string;
  userName?: string;
  expiresInMinutes?: number;
}

export interface VerifyOTPParams {
  userId: string;
  otp: string;
  purpose: OTPPurpose;
}

export interface OTPVerificationResult {
  success: boolean;
  message: string;
  otpRecord?: IOTP;
}

class OTPService {
  /**
   * Create and send OTP for verification
   */
  async createAndSendOTP(params: CreateOTPParams): Promise<IOTP> {
    try {
      // Verify user exists and email matches
      const user = await User.findById(params.userId);
      if (!user) {
        throw new AppError("User not found", 404);
      }

      if (user.email !== params.email) {
        throw new AppError("Email does not match user account", 400);
      }

      console.log(
        `🔐 Creating OTP for ${params.purpose} - User: ${params.userId}, Email: ${params.email}`
      );

      // Create OTP record
      const otpRecord = await createOTP({
        userId: params.userId,
        email: params.email,
        purpose: params.purpose,
        ip: params.ip,
        userAgent: params.userAgent,
        expiresInMinutes: params.expiresInMinutes,
      });

      // Send email with OTP
      await emailService.sendOTPEmail({
        to: params.email,
        otp: otpRecord.otp,
        purpose: params.purpose,
        userName: params.userName || user.name,
      });

      console.log(`🔐 OTP created for ${params.purpose}:`, {
        userId: params.userId,
        email: params.email,
        purpose: params.purpose,
      });

      return otpRecord;
    } catch (error) {
      console.error("❌ Failed to create and send OTP:", error);
      throw error;
    }
  }

  /**
   * Verify OTP code
   */
  async verifyOTP(params: VerifyOTPParams): Promise<OTPVerificationResult> {
    try {
      const { userId, otp, purpose } = params;

      // Find active OTP for this user and purpose
      const otpRecord = await OTP.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        purpose,
        isUsed: false,
      }).sort({ createdAt: -1 }); // Get most recent

      if (!otpRecord) {
        return {
          success: false,
          message:
            "No active verification code found. Please request a new one.",
        };
      }

      // Check if OTP can be attempted
      if (!otpRecord.canAttempt()) {
        await otpRecord.markAsUsed(); // Mark as used to prevent further attempts
        return {
          success: false,
          message: "Too many verification attempts. Please request a new code.",
        };
      }

      // Check if OTP matches
      if (otpRecord.otp !== otp) {
        await otpRecord.incrementAttempts();
        const remainingAttempts =
          otpRecord.maxAttempts - otpRecord.attempts - 1;

        return {
          success: false,
          message: `Invalid verification code. ${remainingAttempts} attempts remaining.`,
        };
      }

      // Check if expired
      if (otpRecord.isExpired()) {
        return {
          success: false,
          message: "Verification code has expired. Please request a new one.",
        };
      }

      // Mark as used and return success
      await otpRecord.markAsUsed();

      console.log(`✅ OTP verified for ${purpose}:`, {
        userId,
        purpose,
        attempts: otpRecord.attempts + 1,
      });

      return {
        success: true,
        message: "Verification successful",
        otpRecord,
      };
    } catch (error) {
      console.error("❌ Failed to verify OTP:", error);
      return {
        success: false,
        message: "Verification failed. Please try again.",
      };
    }
  }

  /**
   * Invalidate all OTPs for a user and purpose
   */
  async invalidateUserOTPs(
    userId: string,
    purpose?: OTPPurpose
  ): Promise<void> {
    try {
      const query: any = {
        userId: new mongoose.Types.ObjectId(userId),
        isUsed: false,
      };
      if (purpose) {
        query.purpose = purpose;
      }

      const result = await OTP.updateMany(query, { isUsed: true });

      if (result.modifiedCount > 0) {
        console.log(
          `🗑️ Invalidated ${result.modifiedCount} OTPs for user ${userId}${
            purpose ? ` (${purpose})` : ""
          }`
        );
      }
    } catch (error) {
      console.error("❌ Failed to invalidate user OTPs:", error);
      throw error;
    }
  }

  /**
   * Clean up expired OTPs (can be called by a scheduled job)
   */
  async cleanupExpiredOTPs(): Promise<number> {
    try {
      const result = await OTP.deleteMany({
        isUsed: false,
        expiresAt: { $lt: new Date() },
      });

      if (result.deletedCount > 0) {
        console.log(`🧹 Cleaned up ${result.deletedCount} expired OTPs`);
      }

      return result.deletedCount;
    } catch (error) {
      console.error("❌ Failed to cleanup expired OTPs:", error);
      return 0;
    }
  }

  /**
   * Get OTP statistics for monitoring
   */
  async getOTPStats(): Promise<{
    total: number;
    active: number;
    expired: number;
    used: number;
  }> {
    try {
      const now = new Date();

      const [total, active, expired, used] = await Promise.all([
        OTP.countDocuments({}),
        OTP.countDocuments({ isUsed: false, expiresAt: { $gt: now } }),
        OTP.countDocuments({ isUsed: false, expiresAt: { $lt: now } }),
        OTP.countDocuments({ isUsed: true }),
      ]);

      return { total, active, expired, used };
    } catch (error) {
      console.error("❌ Failed to get OTP stats:", error);
      return { total: 0, active: 0, expired: 0, used: 0 };
    }
  }
}

// Export singleton instance
export const otpService = new OTPService();
export default otpService;
