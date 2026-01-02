import { Request, Response } from "express";

import { User } from "../models/User";

import { generateAccessToken, generateRefreshToken } from "../utils/jwt";
import { AppError } from "../middlewares/errorHandler";

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
  const { email, password } = req.body;

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

  const payload = {
    userId: user._id.toString(),
    role: user.role,
    name: user.name,
  };

  const refreshToken = generateRefreshToken(payload);

  // Add new refresh token to array (support multiple devices)
  // Keep only last 5 tokens
  user.refreshTokens = [...user.refreshTokens, refreshToken].slice(-5);
  await user.save();

  res.status(200).json({
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
