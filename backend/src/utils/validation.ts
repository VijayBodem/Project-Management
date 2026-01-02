import { z } from "zod";
import { Request, Response, NextFunction } from "express";

// Validation schemas
export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters"),
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password too long"),
});

export const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, "Password is required"),
});

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name too long"),
  description: z.string().max(500, "Description too long").optional(),
});

export const updateProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name too long")
    .optional(),
  description: z.string().max(500, "Description too long").optional(),
});

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Task title is required")
    .max(200, "Task title too long"),
  description: z.string().max(1000, "Description too long").optional(),
  project: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid project ID"),
  assignedTo: z
    .array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID"))
    .optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  dueDate: z.string().optional().or(z.literal("")),
});

export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Task title is required")
    .max(200, "Task title too long")
    .optional(),
  description: z.string().max(1000, "Description too long").optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  dueDate: z.string().optional().or(z.literal("")).or(z.null()),
  assignedTo: z
    .array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID"))
    .optional(),
});

export const createCommentSchema = z.object({
  taskId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid task ID"),
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(2000, "Comment too long"),
});

export const updateCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(2000, "Comment too long"),
});

export const addMemberSchema = z.object({
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID"),
  role: z.enum(["owner", "admin", "member", "viewer"]).optional(),
});

export const transferOwnershipSchema = z.object({
  newOwnerId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID"),
});

export const searchSchema = z.object({
  query: z.string().min(2, "Search query must be at least 2 characters"),
  type: z.enum(["all", "projects", "tasks"]).optional(),
});

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters")
    .optional(),
  bio: z.string().max(500, "Bio too long").optional(),
  avatar: z.string().url("Invalid avatar URL").optional().or(z.literal("")),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters")
      .max(100, "Password too long"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const updatePreferencesSchema = z.object({
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
});

export const assignTaskSchema = z.object({
  assignedTo: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID")),
});

// Validation middleware factory
export const validate = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};

// Query validation middleware factory
export const validateQuery = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};
