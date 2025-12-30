import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import { UserRole } from "../utils/roles";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  preferences: {
    theme: "light" | "dark" | "system";
    emailNotifications: boolean;
    pushNotifications: boolean;
  };
  refreshTokens: string[]; // Array to support multiple devices
  passwordChangedAt?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  isLocked(): boolean;
  incLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
      minLength: 6,
    },

    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.MEMBER,
    },

    avatar: {
      type: String,
    },

    bio: {
      type: String,
      maxLength: 500,
    },

    preferences: {
      theme: {
        type: String,
        enum: ["light", "dark", "system"],
        default: "system",
      },
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      pushNotifications: {
        type: Boolean,
        default: true,
      },
    },

    refreshTokens: {
      type: [String],
      default: [],
    },

    passwordChangedAt: {
      type: Date,
    },

    loginAttempts: {
      type: Number,
      default: 0,
    },

    lockUntil: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Indexes for performance
UserSchema.index({ email: 1 }, { unique: true }); // Email lookup (login)
UserSchema.index({ refreshTokens: 1 }); // Token validation
UserSchema.index({ createdAt: -1 }); // Sorting by registration date
UserSchema.index({ lockUntil: 1 }, { sparse: true }); // Account locking queries

// Constants for account locking
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours

/**
 * Hash password before saving user
 */

// I hash passwords using bcrypt before saving and only re-hash when the password changes

UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  
  // Set passwordChangedAt when password is changed
  if (!this.isNew) {
    this.passwordChangedAt = new Date();
  }
});

/**
 * Compare entered password with hashed password
 */

UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Check if account is locked
 */
UserSchema.methods.isLocked = function (): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

/**
 * Increment login attempts
 */
UserSchema.methods.incLoginAttempts = async function (): Promise<void> {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < new Date()) {
    await this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
    return;
  }

  const updates: any = { $inc: { loginAttempts: 1 } };

  // Lock the account if we've reached max attempts
  const needsLock = this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS;
  if (needsLock) {
    updates.$set = { lockUntil: new Date(Date.now() + LOCK_TIME) };
  }

  await this.updateOne(updates);
};

/**
 * Reset login attempts
 */
UserSchema.methods.resetLoginAttempts = async function (): Promise<void> {
  await this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 },
  });
};

export const User = mongoose.model<IUser>("User", UserSchema);
