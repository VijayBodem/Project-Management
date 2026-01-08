import mongoose, { Document, Schema } from "mongoose";

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  sessionToken: string; // Unique session identifier
  refreshToken: string; // Associated refresh token

  // Device Information
  deviceInfo: {
    fingerprint: string; // Browser fingerprint
    userAgent: string;
    browser: string;
    browserVersion: string;
    os: string;
    osVersion: string;
    device: string; // mobile, tablet, desktop
    platform: string; // Windows, macOS, Linux, iOS, Android
  };

  // Location Information
  location: {
    ip: string;
    country?: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    timezone?: string;
  };

  // Session Metadata
  loginTime: Date;
  lastActivity: Date;
  expiresAt: Date;
  isActive: boolean;
  loginMethod: "normal" | "otp"; // How the login was completed

  // Security flags
  isSuspicious?: boolean;
  riskScore?: number; // 0-100 risk assessment
}

const SessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    sessionToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    refreshToken: {
      type: String,
      required: true,
      index: true,
    },

    deviceInfo: {
      fingerprint: {
        type: String,
        required: true,
        index: true,
      },
      userAgent: {
        type: String,
        required: true,
      },
      browser: {
        type: String,
        required: true,
      },
      browserVersion: {
        type: String,
        required: true,
      },
      os: {
        type: String,
        required: true,
      },
      osVersion: {
        type: String,
        required: true,
      },
      device: {
        type: String,
        enum: ["mobile", "tablet", "desktop"],
        required: true,
      },
      platform: {
        type: String,
        required: true,
      },
    },

    location: {
      ip: {
        type: String,
        required: true,
        index: true,
      },
      country: String,
      region: String,
      city: String,
      latitude: Number,
      longitude: Number,
      timezone: String,
    },

    loginTime: {
      type: Date,
      default: Date.now,
      required: true,
    },

    lastActivity: {
      type: Date,
      default: Date.now,
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    loginMethod: {
      type: String,
      enum: ["normal", "otp"],
      default: "normal",
      required: true,
    },

    isSuspicious: {
      type: Boolean,
      default: false,
    },

    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  { timestamps: true }
);

// Indexes for performance and queries
SessionSchema.index({ userId: 1, isActive: 1 }); // Active sessions per user
SessionSchema.index({ sessionToken: 1 }); // Session lookup
SessionSchema.index({ refreshToken: 1 }); // Token validation
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-expiry
SessionSchema.index({ "deviceInfo.fingerprint": 1, userId: 1 }); // Device-based queries
SessionSchema.index({ "location.ip": 1 }); // IP-based queries

// Instance methods
SessionSchema.methods.updateActivity = function (this: ISession) {
  this.lastActivity = new Date();
  return this.save();
};

SessionSchema.methods.deactivate = function (this: ISession) {
  this.isActive = false;
  return this.save();
};

SessionSchema.methods.isExpired = function (this: ISession) {
  return new Date() > this.expiresAt;
};

export const Session = mongoose.model<ISession>("Session", SessionSchema);
