import mongoose, { Document, Schema } from "mongoose";

export type OTPPurpose = 'login' | 'logout' | 'logout_all' | 'session_logout';

export interface IOTP extends Document {
  userId: mongoose.Types.ObjectId;
  email: string;
  otp: string;
  purpose: OTPPurpose;
  expiresAt: Date;
  isUsed: boolean;
  attempts: number; // Number of verification attempts
  maxAttempts: number;

  // Metadata
  ip?: string;
  userAgent?: string;

  // Verification
  isVerified(): boolean;
  canAttempt(): boolean;
  incrementAttempts(): Promise<void>;
  markAsUsed(): Promise<void>;
  isExpired(): boolean;
}

const OTPSchema = new Schema<IOTP>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      index: true
    },

    otp: {
      type: String,
      required: true,
      length: 6
    },

    purpose: {
      type: String,
      enum: ['login', 'logout', 'logout_all', 'session_logout'],
      required: true,
      index: true
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true
    },

    isUsed: {
      type: Boolean,
      default: false,
      index: true
    },

    attempts: {
      type: Number,
      default: 0,
      min: 0
    },

    maxAttempts: {
      type: Number,
      default: 5,
      min: 1,
      max: 10
    },

    ip: String,
    userAgent: String
  },
  { timestamps: true }
);

// Indexes for performance
OTPSchema.index({ userId: 1, purpose: 1, isUsed: 1 }); // Active OTPs per user/purpose
OTPSchema.index({ email: 1, otp: 1, isUsed: 1 }); // OTP verification
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-expiry

// Instance methods
OTPSchema.methods.isVerified = function(): boolean {
  return this.isUsed && !this.isExpired();
};

OTPSchema.methods.canAttempt = function(): boolean {
  return !this.isUsed && !this.isExpired() && this.attempts < this.maxAttempts;
};

OTPSchema.methods.incrementAttempts = async function(): Promise<void> {
  if (!this.canAttempt()) {
    throw new Error('OTP verification attempts exceeded');
  }
  this.attempts += 1;
  await this.save();
};

OTPSchema.methods.markAsUsed = async function(): Promise<void> {
  if (this.isUsed) {
    throw new Error('OTP already used');
  }
  if (this.isExpired()) {
    throw new Error('OTP expired');
  }
  this.isUsed = true;
  await this.save();
};

OTPSchema.methods.isExpired = function(): boolean {
  return new Date() > this.expiresAt;
};

export const OTP = mongoose.model<IOTP>("OTP", OTPSchema);

// Utility functions for OTP operations
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const createOTP = async (params: {
  userId: mongoose.Types.ObjectId;
  email: string;
  purpose: OTPPurpose;
  ip?: string;
  userAgent?: string;
  expiresInMinutes?: number;
}): Promise<IOTP> => {
  // Invalidate previous OTPs for same user and purpose
  await OTP.updateMany(
    { userId: params.userId, purpose: params.purpose, isUsed: false },
    { isUsed: true }
  );

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + (params.expiresInMinutes || 10) * 60 * 1000);

  return OTP.create({
    userId: params.userId,
    email: params.email,
    otp,
    purpose: params.purpose,
    expiresAt,
    ip: params.ip,
    userAgent: params.userAgent
  });
};
