import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import { Project } from "../models/Project.model";
import { Task, TaskStatus } from "../models/Task.model";
import { User } from "../models/User";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../utils/validation";
import {
  createProjectSchema,
  addMemberSchema,
  transferOwnershipSchema,
  updateProjectSchema,
} from "../utils/validation";
import { asyncHandler } from "../middlewares/errorHandler";
import {
  checkProjectMembership,
  requirePermission,
} from "../middlewares/permission.middleware";
import { ProjectPermission, ProjectRole } from "../utils/projectRoles";
import { AppError } from "../middlewares/errorHandler";

const router = Router();

// Create project
router.post(
  "/",
  authenticate,
  validate(createProjectSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const project = await Project.create({
      ...req.body,
      createdBy: req.user!.userId,
      members: [
        {
          user: req.user!.userId,
          role: ProjectRole.OWNER,
          joinedAt: new Date(),
        },
      ],
    });

    res.status(201).json({ success: true, project });
  })
);

// Get my projects
router.get(
  "/",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const projects = await Project.find({
      "members.user": req.user!.userId,
    })
      .populate("createdBy", "name email")
      .populate("members.user", "name email");

    // Transform to include user's role in each project
    const projectsWithRole = projects.map((project: any) => {
      const isOwner = project.createdBy._id.toString() === req.user!.userId;
      const member = project.members.find(
        (m: any) => m.user._id.toString() === req.user!.userId
      );

      return {
        ...project.toObject(),
        userRole: isOwner
          ? ProjectRole.OWNER
          : member?.role || ProjectRole.MEMBER,
      };
    });

    res.json({ success: true, projects: projectsWithRole });
  })
);

// Get project with statistics
router.get(
  "/:projectId/stats",
  authenticate,
  checkProjectMembership,
  requirePermission(ProjectPermission.VIEW_PROJECT),
  asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.params;

    const project = await Project.findById(projectId)
      .populate("members.user", "name email avatar")
      .populate("createdBy", "name email avatar");

    if (!project) {
      throw new AppError("Project not found", 404);
    }

    // Get task statistics
    const tasks = await Task.find({ project: projectId });
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(
      (t) => t.status === TaskStatus.DONE
    ).length;
    const inProgressTasks = tasks.filter(
      (t) => t.status === TaskStatus.IN_PROGRESS
    ).length;
    const todoTasks = tasks.filter((t) => t.status === TaskStatus.TODO).length;

    const completionPercentage =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.json({
      success: true,
      project,
      stats: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        todoTasks,
        completionPercentage,
        memberCount: project.members.length,
      },
      userRole: req.projectMember!.role,
    });
  })
);

// Get dashboard data (all projects with stats) with pagination
router.get(
  "/dashboard/overview",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const {
      page = "1",
      limit = "20",
      sortBy = "updatedAt",
      sortOrder = "desc",
    } = req.query;

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100);
    const skip = (pageNum - 1) * limitNum;

    // Sort
    const sortObj: any = {};
    sortObj[sortBy as string] = sortOrder === "asc" ? 1 : -1;

    // Filter for user's projects
    const filter = { "members.user": req.user!.userId };

    // Execute count and find in parallel
    const [total, projects] = await Promise.all([
      Project.countDocuments(filter),
      Project.find(filter)
        .populate("createdBy", "name email avatar")
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    // Get stats for each project
    const projectsWithStats = await Promise.all(
      projects.map(async (project: any) => {
        const tasks = await Task.find({ project: project._id }).lean();
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(
          (t) => t.status === TaskStatus.DONE
        ).length;
        const completionPercentage =
          totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
          _id: project._id,
          name: project.name,
          description: project.description,
          createdBy: project.createdBy,
          memberCount: project.members.length,
          updatedAt: project.updatedAt,
          stats: {
            totalTasks,
            completedTasks,
            completionPercentage,
          },
        };
      })
    );

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      projects: projectsWithStats,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    });
  })
);

// Search users by email or name
router.get("/search/users", authenticate, async (req, res) => {
  const { query } = req.query;

  if (!query || typeof query !== "string") {
    return res.status(400).json({ message: "Search query is required" });
  }

  try {
    const users = await User.find({
      $or: [
        { email: { $regex: query, $options: "i" } },
        { name: { $regex: query, $options: "i" } },
      ],
    })
      .select("name email")
      .limit(10);

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to search users" });
  }
});

// Get project members
router.get("/:projectId/members", authenticate, async (req, res) => {
  const { projectId } = req.params;

  const project = await Project.findOne({
    _id: projectId,
    "members.user": req.user!.userId,
  })
    .populate("members.user", "name email")
    .populate("createdBy", "name email");

  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }

  res.json({
    members: project.members,
    createdBy: project.createdBy,
  });
});

// Add member to project
router.post(
  "/:projectId/members",
  authenticate,
  checkProjectMembership,
  requirePermission(ProjectPermission.MANAGE_MEMBERS),
  validate(addMemberSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const { userId, role = ProjectRole.MEMBER } = req.body;

    const project = await Project.findById(projectId);

    if (!project) {
      throw new AppError("Project not found", 404);
    }

    // Check if user exists
    const userToAdd = await User.findById(userId);
    if (!userToAdd) {
      throw new AppError("User not found", 404);
    }

    // Check if user is already a member
    if (project.members.some((m: any) => m.user.toString() === userId)) {
      throw new AppError("User is already a member", 400);
    }

    // Add member with role
    project.members.push({
      user: userId,
      role: role as ProjectRole,
      joinedAt: new Date(),
    } as any);

    await project.save();

    const updatedProject = await Project.findById(projectId).populate(
      "members.user",
      "name email avatar"
    );

    res.json({
      success: true,
      message: "Member added successfully",
      members: updatedProject!.members,
    });
  })
);

// Update member role
router.patch(
  "/:projectId/members/:userId/role",
  authenticate,
  checkProjectMembership,
  requirePermission(ProjectPermission.MANAGE_ROLES),
  asyncHandler(async (req: Request, res: Response) => {
    const { projectId, userId } = req.params;
    const { role } = req.body;

    if (!Object.values(ProjectRole).includes(role)) {
      throw new AppError("Invalid role", 400);
    }

    const project = await Project.findById(projectId);

    if (!project) {
      throw new AppError("Project not found", 404);
    }

    // Cannot change owner's role
    if (project.createdBy.toString() === userId) {
      throw new AppError("Cannot change project owner's role", 400);
    }

    // Find and update member role
    const memberIndex = project.members.findIndex(
      (m: any) => m.user.toString() === userId
    );

    if (memberIndex === -1) {
      throw new AppError("User is not a member", 404);
    }

    (project.members[memberIndex] as any).role = role;
    await project.save();

    const updatedProject = await Project.findById(projectId).populate(
      "members.user",
      "name email avatar"
    );

    res.json({
      success: true,
      message: "Member role updated successfully",
      members: updatedProject!.members,
    });
  })
);

// Remove member from project
router.delete(
  "/:projectId/members/:userId",
  authenticate,
  checkProjectMembership,
  requirePermission(ProjectPermission.MANAGE_MEMBERS),
  asyncHandler(async (req: Request, res: Response) => {
    const { projectId, userId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
      throw new AppError("Project not found", 404);
    }

    // Cannot remove the creator
    if (project.createdBy.toString() === userId) {
      throw new AppError("Cannot remove project owner", 400);
    }

    // Check if user is a member
    const memberIndex = project.members.findIndex(
      (m: any) => m.user.toString() === userId
    );

    if (memberIndex === -1) {
      throw new AppError("User is not a member", 404);
    }

    // Remove member
    project.members.splice(memberIndex, 1);
    await project.save();

    const updatedProject = await Project.findById(projectId).populate(
      "members.user",
      "name email avatar"
    );

    res.json({
      success: true,
      message: "Member removed successfully",
      members: updatedProject!.members,
    });
  })
);

// Transfer project ownership
router.patch(
  "/:projectId/transfer",
  authenticate,
  validate(transferOwnershipSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const { newOwnerId } = req.body;

    if (!newOwnerId) {
      return res.status(400).json({ message: "New owner ID is required" });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Only current creator can transfer ownership
    if (project.createdBy.toString() !== req.user!.userId) {
      return res
        .status(403)
        .json({ message: "Only project creator can transfer ownership" });
    }

    // Check if new owner is a member
    if (!project.members.some((m) => m.toString() === newOwnerId)) {
      return res
        .status(400)
        .json({ message: "New owner must be a project member" });
    }

    // Transfer ownership
    project.createdBy = newOwnerId;
    await project.save();

    const updatedProject = await Project.findById(projectId).populate(
      "createdBy members",
      "name email"
    );

    res.json({
      message: "Ownership transferred successfully",
      project: updatedProject,
    });
  })
);

// Update project
router.patch(
  "/:projectId",
  authenticate,
  checkProjectMembership,
  requirePermission(ProjectPermission.EDIT_PROJECT),
  validate(updateProjectSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const updates = req.body;

    const project = await Project.findById(projectId);

    if (!project) {
      throw new AppError("Project not found", 404);
    }

    // Update allowed fields
    if (updates.name !== undefined) {
      project.name = updates.name;
    }
    if (updates.description !== undefined) {
      project.description = updates.description;
    }

    await project.save();

    res.json({
      success: true,
      message: "Project updated successfully",
      project,
    });
  })
);

// Delete project (soft delete)
router.delete(
  "/:projectId",
  authenticate,
  checkProjectMembership,
  requirePermission(ProjectPermission.DELETE_PROJECT),
  asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
      throw new AppError("Project not found", 404);
    }

    // Check if user is the owner (only owners can delete projects)
    if (project.createdBy.toString() !== req.user!.userId) {
      throw new AppError("Only project owners can delete projects", 403);
    }

    // Soft delete
    project.isDeleted = true;
    project.deletedAt = new Date();
    project.deletedBy = new mongoose.Types.ObjectId(req.user!.userId);

    await project.save();

    res.json({
      success: true,
      message: "Project deleted successfully",
    });
  })
);

export default router;
