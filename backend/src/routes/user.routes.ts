import { Router, Request, Response } from "express";
import { User } from "../models/User";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../utils/validation";
import { updateProfileSchema, changePasswordSchema, updatePreferencesSchema } from "../utils/validation";
import { asyncHandler } from "../middlewares/errorHandler";
import { AppError } from "../middlewares/errorHandler";
import { passwordChangeLimiter } from "../middlewares/security.middleware";

const router = Router();

// Get current user profile
router.get("/profile", authenticate, asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.userId).select("-password -refreshTokens");
  
  if (!user) {
    throw new AppError("User not found", 404);
  }

  res.json({
    success: true,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
      preferences: user.preferences,
      createdAt: (user as any).createdAt,
      updatedAt: (user as any).updatedAt,
    },
  });
}));

// Update user profile
router.patch("/profile", authenticate, validate(updateProfileSchema), asyncHandler(async (req: Request, res: Response) => {
  const { name, bio, avatar } = req.body;

  const user = await User.findById(req.user!.userId);
  
  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (name) user.name = name;
  if (bio !== undefined) user.bio = bio;
  if (avatar !== undefined) user.avatar = avatar || undefined;

  await user.save();

  res.json({
    success: true,
    message: "Profile updated successfully",
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
      preferences: user.preferences,
    },
  });
}));

// Change password (with rate limiting)
router.post("/change-password", authenticate, passwordChangeLimiter, validate(changePasswordSchema), asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user!.userId);
  
  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Verify current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new AppError("Current password is incorrect", 400);
  }

  // Check if new password is same as old password
  const isSamePassword = await user.comparePassword(newPassword);
  if (isSamePassword) {
    throw new AppError("New password must be different from current password", 400);
  }

  // Update password
  user.password = newPassword;
  
  // Invalidate all refresh tokens for security
  user.refreshTokens = [];
  
  await user.save();

  res.json({
    success: true,
    message: "Password changed successfully. Please login again on all devices.",
  });
}));

// Update user preferences
router.patch("/preferences", authenticate, validate(updatePreferencesSchema), asyncHandler(async (req: Request, res: Response) => {
  const { theme, emailNotifications, pushNotifications } = req.body;

  const user = await User.findById(req.user!.userId);
  
  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (theme) user.preferences.theme = theme;
  if (emailNotifications !== undefined) user.preferences.emailNotifications = emailNotifications;
  if (pushNotifications !== undefined) user.preferences.pushNotifications = pushNotifications;

  await user.save();

  res.json({
    success: true,
    message: "Preferences updated successfully",
    preferences: user.preferences,
  });
}));

// Get user by ID (for viewing other users' profiles)
router.get("/:userId", authenticate, asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.userId).select("-password -refreshToken -preferences");
  
  if (!user) {
    throw new AppError("User not found", 404);
  }

  res.json({
    success: true,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      role: user.role,
    },
  });
}));

export default router;
