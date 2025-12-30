import { Request, Response, NextFunction } from "express";
import { Project } from "../models/Project.model";
import { ProjectRole, ProjectPermission, hasPermission } from "../utils/projectRoles";
import { AppError } from "./errorHandler";

// Extend Request type to include project member info
declare global {
  namespace Express {
    interface Request {
      projectMember?: {
        role: ProjectRole;
        userId: string;
      };
    }
  }
}

/**
 * Middleware to check if user is a project member and attach their role
 */
export const checkProjectMembership = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectId = req.params.projectId || req.body.project;
    const userId = req.user?.userId;

    if (!projectId) {
      throw new AppError("Project ID is required", 400);
    }

    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    const project = await Project.findById(projectId);

    if (!project) {
      throw new AppError("Project not found", 404);
    }

    // Check if user is the creator (owner)
    if (project.createdBy.toString() === userId) {
      req.projectMember = {
        role: ProjectRole.OWNER,
        userId,
      };
      return next();
    }

    // Check if user is in members array
    const member = project.members.find(
      (m: any) => m.user.toString() === userId
    );

    if (!member) {
      throw new AppError("You are not a member of this project", 403);
    }

    req.projectMember = {
      role: member.role as ProjectRole,
      userId,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware factory to check if user has specific permission
 */
export const requirePermission = (permission: ProjectPermission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.projectMember) {
      return next(new AppError("Project membership not verified", 403));
    }

    const { role } = req.projectMember;

    if (!hasPermission(role, permission)) {
      return next(
        new AppError(
          `You don't have permission to perform this action. Required: ${permission}`,
          403
        )
      );
    }

    next();
  };
};

/**
 * Middleware factory to check if user has any of the specified permissions
 */
export const requireAnyPermission = (permissions: ProjectPermission[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.projectMember) {
      return next(new AppError("Project membership not verified", 403));
    }

    const { role } = req.projectMember;

    const hasAny = permissions.some((permission) =>
      hasPermission(role, permission)
    );

    if (!hasAny) {
      return next(
        new AppError(
          `You don't have permission to perform this action. Required one of: ${permissions.join(", ")}`,
          403
        )
      );
    }

    next();
  };
};

/**
 * Helper function to get user's role in a project
 */
export const getUserProjectRole = async (
  projectId: string,
  userId: string
): Promise<ProjectRole | null> => {
  const project = await Project.findById(projectId);

  if (!project) {
    return null;
  }

  // Check if user is the creator (owner)
  if (project.createdBy.toString() === userId) {
    return ProjectRole.OWNER;
  }

  // Check if user is in members array
  const member = project.members.find(
    (m: any) => m.user.toString() === userId
  );

  return member ? (member.role as ProjectRole) : null;
};

/**
 * Helper function to check if user can perform action on resource
 */
export const canPerformAction = async (
  projectId: string,
  userId: string,
  permission: ProjectPermission
): Promise<boolean> => {
  const role = await getUserProjectRole(projectId, userId);
  
  if (!role) {
    return false;
  }

  return hasPermission(role, permission);
};
