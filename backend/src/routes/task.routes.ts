import { Router, Request, Response } from "express";
import { Task } from "../models/Task.model";
import { Activity, ActivityType } from "../models/Activity.model";
import { Project } from "../models/Project.model";
import { authenticate } from "../middlewares/auth.middleware";
import { emitToProject, emitToUser } from "../socket/events";
import { NotificationType } from "../models/Notification.model";
import { validate } from "../utils/validation";
import {
  createTaskSchema,
  updateTaskSchema,
  assignTaskSchema,
} from "../utils/validation";
import { asyncHandler } from "../middlewares/errorHandler";
import {
  checkProjectMembership,
  requirePermission,
} from "../middlewares/permission.middleware";
import { ProjectPermission } from "../utils/projectRoles";
import { AppError } from "../middlewares/errorHandler";
import {
  notifyTaskCreation,
  notifyTaskAssignment,
  notifyTaskStatusChange,
  notifyTaskCompletion,
} from "../utils/notificationHelper";

const router = Router();

// Create task
router.post(
  "/",
  authenticate,
  validate(createTaskSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { project: projectId } = req.body;

    // Check membership and permission
    const project = await Project.findById(projectId);
    if (!project) {
      throw new AppError("Project not found", 404);
    }

    const isOwner = project.createdBy.toString() === req.user!.userId;
    const member = project.members.find(
      (m: any) => m.user.toString() === req.user!.userId
    );

    if (!isOwner && !member) {
      throw new AppError("You are not a member of this project", 403);
    }

    const userRole = isOwner ? "owner" : (member as any).role;

    // Check permission
    const { hasPermission } = await import("../utils/projectRoles");
    if (!hasPermission(userRole, ProjectPermission.CREATE_TASK)) {
      throw new AppError("You don't have permission to create tasks", 403);
    }
    const taskData = {
      ...req.body,
      createdBy: req.user!.userId,
    };

    // Get the highest position in the TODO column
    const highestPositionTask = await Task.findOne({
      project: taskData.project,
      status: "todo",
    }).sort({ position: -1 });

    const newPosition = highestPositionTask
      ? highestPositionTask.position + 1
      : 0;
    taskData.position = newPosition;

    const newTask: any = await Task.create(taskData);

    // Fetch and populate the task
    const populatedTask = await Task.findById(newTask._id)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");

    // Log activity
    await Activity.create({
      task: populatedTask!._id,
      user: req.user!.userId,
      type: ActivityType.TASK_CREATED,
      details: {},
    });

    // Emit real-time event to project members
    emitToProject(req.body.project, "task:created", {
      task: populatedTask,
      createdBy: req.user!.userId,
    });

    // Notify assigned users using helper
    if (populatedTask) {
      await notifyTaskCreation(populatedTask as any, req.user!.userId);
    }

    // Emit task:assigned events to assigned users for real-time MyTasks updates
    if (
      populatedTask &&
      populatedTask.assignedTo &&
      populatedTask.assignedTo.length > 0
    ) {
      const assignedUserIds = populatedTask.assignedTo.map((user: any) =>
        user._id.toString()
      );

      // Emit to individual assigned users (exclude creator to avoid duplicate events)
      for (const userId of assignedUserIds) {
        if (userId !== req.user!.userId) {
          emitToUser(userId, "task:assigned", {
            task: populatedTask,
            assignedBy: req.user!.userId,
            addedAssignees: assignedUserIds,
            removedAssignees: [],
          });
        }
      }
    }

    res.status(201).json(populatedTask);
  })
);

// Get tasks by project with filters and pagination
router.get(
  "/project/:projectId",
  authenticate,
  checkProjectMembership,
  requirePermission(ProjectPermission.VIEW_PROJECT),
  asyncHandler(async (req: Request, res: Response) => {
    const {
      assignedTo,
      status,
      unassigned,
      page = "1",
      limit = "20",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build filter query
    const filter: any = { project: req.params.projectId };

    if (assignedTo) {
      filter.assignedTo = assignedTo;
    }

    if (status) {
      filter.status = status;
    }

    if (unassigned === "true") {
      filter.assignedTo = null;
    }

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100); // Max 100 per page
    const skip = (pageNum - 1) * limitNum;

    // Sort
    const sortObj: any = {};
    sortObj[sortBy as string] = sortOrder === "asc" ? 1 : -1;

    // Execute count and find in parallel
    const [total, tasks] = await Promise.all([
      Task.countDocuments(filter),
      Task.find(filter)
        .populate("assignedTo", "name email avatar")
        .populate("createdBy", "name email avatar")
        .sort({ position: 1, createdAt: 1 }) // Sort by position first, then creation date
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      tasks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      userRole: req.projectMember!.role,
    });
  })
);

// Get my tasks (assigned to current user) with pagination
router.get(
  "/my-tasks",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const {
      status,
      page = "1",
      limit = "20",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const filter: any = { assignedTo: req.user!.userId };

    console.log("fileterrrr", filter);

    if (status) {
      filter.status = status;
    }

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100);
    const skip = (pageNum - 1) * limitNum;

    // Sort
    const sortObj: any = {};
    sortObj[sortBy as string] = sortOrder === "asc" ? 1 : -1;

    // Execute count and find in parallel
    const [total, tasks] = await Promise.all([
      Task.countDocuments(filter),
      Task.find(filter)
        .populate("project", "name")
        .populate("createdBy", "name email avatar")
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      tasks,
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

// Get task by ID with full details
router.get("/:taskId", authenticate, async (req, res) => {
  try {
    const { taskId } = req.params;

    console.log("taskiddddd", taskId);

    const task = await Task.findById(taskId)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .populate("project", "name");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Verify user has access
    const project = await Project.findOne({
      _id: task.project,
      "members.user": req.user!.userId,
    });

    if (!project) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch task" });
  }
});

// Assign/reassign task (supports multiple assignees)
router.patch(
  "/:taskId/assign",
  authenticate,
  validate(assignTaskSchema),
  async (req, res) => {
    const { taskId } = req.params;
    const { assignedTo } = req.body; // Now expects an array of user IDs

    // Verify user is a member of the project
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await Project.findOne({
      _id: task.project,
      members: req.user!.userId,
    });

    if (!project) {
      return res
        .status(403)
        .json({ message: "You are not a member of this project" });
    }

    // assignedTo is already validated as an array by the schema
    const newAssignees = assignedTo || [];

    // Validate all assignees are project members
    if (newAssignees.length > 0) {
      const projectMemberIds = project.members.map((m: any) =>
        m.user.toString()
      );
      const invalidAssignees = newAssignees.filter(
        (id: string) => !projectMemberIds.includes(id)
      );

      if (invalidAssignees.length > 0) {
        return res
          .status(400)
          .json({ message: "All assignees must be project members" });
      }
    }

    // Get previous assignees for comparison
    const previousAssignees = (task.assignedTo || []).map((id: any) =>
      id.toString()
    );

    // Update assignment
    task.assignedTo = newAssignees as any;
    await task.save();

    const updatedTask = await Task.findById(taskId)
      .populate("assignedTo", "name email avatar")
      .populate("createdBy", "name email");

    // Determine who was added and who was removed
    const addedAssignees = newAssignees.filter(
      (id: string) => !previousAssignees.includes(id)
    );
    const removedAssignees = previousAssignees.filter(
      (id: string) => !newAssignees.includes(id)
    );

    // Log activity for assignments
    if (addedAssignees.length > 0) {
      await Activity.create({
        task: taskId,
        user: req.user!.userId,
        type: ActivityType.ASSIGNED,
        details: { assignedTo: addedAssignees },
      });
    }

    // Log activity for unassignments
    if (removedAssignees.length > 0) {
      await Activity.create({
        task: taskId,
        user: req.user!.userId,
        type: ActivityType.UNASSIGNED,
        details: { unassignedFrom: removedAssignees },
      });
    }

    // Emit real-time event to project members
    emitToProject(task.project.toString(), "task:assigned", {
      task: updatedTask,
      assignedBy: req.user!.userId,
      addedAssignees,
      removedAssignees,
    });

    // Emit to individual users for My Tasks page updates
    for (const userId of addedAssignees) {
      emitToUser(userId, "task:assigned", {
        task: updatedTask,
        assignedBy: req.user!.userId,
        addedAssignees,
        removedAssignees,
      });
    }

    for (const userId of removedAssignees) {
      emitToUser(userId, "task:assigned", {
        task: updatedTask,
        assignedBy: req.user!.userId,
        addedAssignees,
        removedAssignees,
      });
    }

    // Notify using helper
    await notifyTaskAssignment(
      updatedTask as any,
      req.user!.userId,
      addedAssignees,
      removedAssignees
    );

    res.json(updatedTask);
  }
);

// Update task status (for drag & drop)
router.patch(
  "/:taskId/status",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { status, position } = req.body;
    const { taskId } = req.params;

    const task = await Task.findById(taskId);

    if (!task) {
      throw new AppError("Task not found", 404);
    }

    // Check permission
    const project = await Project.findById(task.project);
    if (!project) {
      throw new AppError("Project not found", 404);
    }

    const isOwner = project.createdBy.toString() === req.user!.userId;
    const member = project.members.find(
      (m: any) => m.user.toString() === req.user!.userId
    );

    if (!isOwner && !member) {
      throw new AppError("You are not a member of this project", 403);
    }

    const userRole = isOwner ? "owner" : (member as any).role;
    const { hasPermission } = await import("../utils/projectRoles");

    if (!hasPermission(userRole, ProjectPermission.CHANGE_TASK_STATUS)) {
      throw new AppError(
        "You don't have permission to change task status",
        403
      );
    }

    const oldStatus = task.status;
    const newStatus = status;

    // If status changed, reorder tasks
    if (oldStatus !== newStatus) {
      // Get tasks in the new status column
      const tasksInNewColumn = await Task.find({
        project: task.project,
        status: newStatus,
        _id: { $ne: taskId },
      }).sort({ position: 1 });

      // Insert at specified position
      const newPosition =
        position !== undefined ? position : tasksInNewColumn.length;

      // Update positions of tasks after the insertion point
      const bulkOps = tasksInNewColumn
        .filter((_, index) => index >= newPosition)
        .map((t, index) => ({
          updateOne: {
            filter: { _id: t._id },
            update: { $set: { position: newPosition + index + 1 } },
          },
        }));

      if (bulkOps.length > 0) {
        await Task.bulkWrite(bulkOps);
      }

      // Update the moved task
      task.status = newStatus;
      task.position = newPosition;
      await task.save();
    } else if (position !== undefined && position !== task.position) {
      // Reordering within the same column
      const tasksInColumn = await Task.find({
        project: task.project,
        status: task.status,
        _id: { $ne: taskId },
      }).sort({ position: 1 });

      const oldPosition = task.position;
      const newPosition = position;

      // Reorder tasks
      const bulkOps = tasksInColumn.map((t, index) => {
        let newPos = index;

        if (oldPosition < newPosition) {
          // Moving down: shift tasks up
          if (index >= oldPosition && index < newPosition) {
            newPos = index;
          } else if (index >= newPosition) {
            newPos = index + 1;
          }
        } else {
          // Moving up: shift tasks down
          if (index >= newPosition && index < oldPosition) {
            newPos = index + 1;
          } else {
            newPos = index;
          }
        }

        return {
          updateOne: {
            filter: { _id: t._id },
            update: { $set: { position: newPos } },
          },
        };
      });

      if (bulkOps.length > 0) {
        await Task.bulkWrite(bulkOps);
      }

      task.position = newPosition;
      await task.save();
    }

    const updatedTask = await Task.findById(taskId)
      .populate("assignedTo", "name email avatar")
      .populate("createdBy", "name email avatar");

    // Log activity
    if (oldStatus !== newStatus) {
      await Activity.create({
        task: taskId,
        user: req.user!.userId,
        type: ActivityType.STATUS_CHANGED,
        details: { status: newStatus, oldStatus },
      });

      //    if(updatedTask){

      //   await createNotification({
      //      userId: req.user!.userId,
      //      type: NotificationType.TASK_COMPLETED,
      //      title: "Task Updated",
      //      message: `Task Updated: ${updatedTask.title}`,
      //      taskId: updatedTask._id.toString(),
      //      projectId: updatedTask.project.toString(),
      //      actorId: req.user!.userId,
      //    });
      // }
    }

    // Emit real-time event to project members
    emitToProject(task.project.toString(), "task:updated", {
      task: updatedTask,
      updatedBy: req.user!.userId,
      field: "status",
      oldStatus,
      newStatus,
    });

    // Emit to assigned users for My Tasks page updates
    if (
      updatedTask &&
      updatedTask.assignedTo &&
      Array.isArray(updatedTask.assignedTo)
    ) {
      for (const assignee of updatedTask.assignedTo) {
        const assigneeId = (assignee as any)._id.toString();
        emitToUser(assigneeId, "task:updated", {
          task: updatedTask,
          updatedBy: req.user!.userId,
          field: "status",
          oldStatus,
          newStatus,
        });
      }
    }

    // Smart notification based on who made the change
    if (oldStatus !== newStatus && updatedTask) {
      if (newStatus === "done") {
        // Task completed - use completion notification
        await notifyTaskCompletion(updatedTask as any, req.user!.userId);
      } else {
        // Status changed - use smart notification logic
        await notifyTaskStatusChange({
          task: updatedTask as any,
          actorId: req.user!.userId,
          type: NotificationType.TASK_COMPLETED, // Reusing for status changes
          title: "Task Status Changed",
          message: `Task status changed from ${oldStatus} to ${newStatus}: ${updatedTask.title}`,
          oldStatus,
          newStatus,
        });
      }
    }

    res.json({ success: true, task: updatedTask });
  })
);

// Update task details
router.patch(
  "/:taskId",
  authenticate,
  validate(updateTaskSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { taskId } = req.params;
    const { title, description, priority, dueDate, assignedTo } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check project membership and permissions
    const project = await Project.findById(task.project);
    if (!project) {
      throw new AppError("Project not found", 404);
    }

    const isOwner = project.createdBy.toString() === req.user!.userId;
    const member = project.members.find(
      (m: any) => m.user.toString() === req.user!.userId
    );

    if (!isOwner && !member) {
      throw new AppError("You are not a member of this project", 403);
    }

    const userRole = isOwner ? "owner" : (member as any).role;
    const { hasPermission } = await import("../utils/projectRoles");
    if (!hasPermission(userRole, ProjectPermission.EDIT_TASK)) {
      throw new AppError("You don't have permission to edit tasks", 403);
    }

    // Track changes for activity log
    const changes: any = {};

    // Declare assignee tracking variables in outer scope
    let addedAssignees: string[] = [];
    let removedAssignees: string[] = [];

    if (title && title !== task.title) {
      changes.title = { from: task.title, to: title };
      task.title = title;
    }

    if (description !== undefined && description !== task.description) {
      changes.description = { from: task.description, to: description };
      task.description = description;
    }

    if (priority && priority !== task.priority) {
      changes.priority = { from: task.priority, to: priority };
      task.priority = priority;

      // Log priority change
      await Activity.create({
        task: taskId,
        user: req.user!.userId,
        type: ActivityType.PRIORITY_CHANGED,
        details: { from: task.priority, to: priority },
      });
    }

    if (dueDate !== undefined) {
      const newDueDate = dueDate ? new Date(dueDate) : null;
      if (task.dueDate && newDueDate) {
        // Due date changed
        await Activity.create({
          task: taskId,
          user: req.user!.userId,
          type: ActivityType.DUE_DATE_CHANGED,
          details: { from: task.dueDate, to: newDueDate },
        });
      } else if (!task.dueDate && newDueDate) {
        // Due date set
        await Activity.create({
          task: taskId,
          user: req.user!.userId,
          type: ActivityType.DUE_DATE_SET,
          details: { dueDate: newDueDate },
        });
      }
      changes.dueDate = { from: task.dueDate, to: newDueDate };
      task.dueDate = newDueDate as any;
    }

    if (assignedTo !== undefined) {
      // Validate that all assigned users are project members
      for (const userId of assignedTo) {
        const isMember =
          project.members.some((m: any) => m.user.toString() === userId) ||
          project.createdBy.toString() === userId;
        if (!isMember) {
          throw new AppError(
            `User ${userId} is not a member of this project`,
            400
          );
        }
      }

      const previousAssignees = (task.assignedTo || []).map((id: any) =>
        id.toString()
      );
      addedAssignees = assignedTo.filter(
        (id: string) => !previousAssignees.includes(id)
      );
      removedAssignees = previousAssignees.filter(
        (id: string) => !assignedTo.includes(id)
      );

      if (addedAssignees.length > 0 || removedAssignees.length > 0) {
        changes.assignedTo = { from: previousAssignees, to: assignedTo };

        // Update task assignees
        task.assignedTo = assignedTo as any;

        // Log assignee changes
        for (const assigneeId of addedAssignees) {
          await Activity.create({
            task: taskId,
            user: req.user!.userId,
            type: ActivityType.ASSIGNED,
            details: { assignedTo: assigneeId },
          });
        }

        for (const assigneeId of removedAssignees) {
          await Activity.create({
            task: taskId,
            user: req.user!.userId,
            type: ActivityType.UNASSIGNED,
            details: { assignedTo: assigneeId },
          });
        }
      }
    }

    await task.save();

    const updatedTask = await Task.findById(taskId)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");

    // Log general update if there were changes
    if (Object.keys(changes).length > 0) {
      await Activity.create({
        task: taskId,
        user: req.user!.userId,
        type: ActivityType.TASK_UPDATED,
        details: { changes },
      });
    }

    // Emit real-time event to project members
    emitToProject(task.project.toString(), "task:updated", {
      task: updatedTask,
      updatedBy: req.user!.userId,
      field: "details",
    });

    // If assignees were changed, emit task:assigned events to individual users for MyTasks updates
    if (
      assignedTo !== undefined &&
      (addedAssignees.length > 0 || removedAssignees.length > 0)
    ) {
      // Emit to added assignees
      for (const userId of addedAssignees) {
        emitToUser(userId, "task:assigned", {
          task: updatedTask,
          assignedBy: req.user!.userId,
          addedAssignees,
          removedAssignees,
        });
      }

      // Emit to removed assignees
      for (const userId of removedAssignees) {
        emitToUser(userId, "task:assigned", {
          task: updatedTask,
          assignedBy: req.user!.userId,
          addedAssignees,
          removedAssignees,
        });
      }

      // Notify about assignment changes
      await notifyTaskAssignment(
        updatedTask as any,
        req.user!.userId,
        addedAssignees,
        removedAssignees
      );
    }

    res.json(updatedTask);
  })
);

// Delete task (soft delete)
router.delete(
  "/:taskId",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);

    if (!task) {
      throw new AppError("Task not found", 404);
    }

    // Check permission
    const project = await Project.findById(task.project);
    if (!project) {
      throw new AppError("Project not found", 404);
    }

    const isOwner = project.createdBy.toString() === req.user!.userId;
    const member = project.members.find(
      (m: any) => m.user.toString() === req.user!.userId
    );

    if (!isOwner && !member) {
      throw new AppError("You are not a member of this project", 403);
    }

    const userRole = isOwner ? "owner" : (member as any).role;
    const { hasPermission } = await import("../utils/projectRoles");

    if (!hasPermission(userRole, ProjectPermission.DELETE_TASK)) {
      // Only creator or project owner can delete
      if (task.createdBy.toString() !== req.user!.userId && !isOwner) {
        throw new AppError(
          "Only task creator or project owner can delete",
          403
        );
      }
    }

    // Soft delete
    await Task.findByIdAndUpdate(taskId, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: req.user!.userId,
    });

    // Emit real-time event to project members
    emitToProject(task.project.toString(), "task:deleted", {
      taskId,
      deletedBy: req.user!.userId,
    });

    // Emit to assigned users for MyTasks page updates
    if (task.assignedTo && task.assignedTo.length > 0) {
      for (const assignee of task.assignedTo) {
        const assigneeId = assignee.toString();
        if (assigneeId !== req.user!.userId) {
          // Don't emit to the deleter
          emitToUser(assigneeId, "task:deleted", {
            taskId,
            deletedBy: req.user!.userId,
          });
        }
      }
    }

    // Notify assigned users about task deletion
    const populatedTask = await Task.findById(taskId)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");

    if (
      populatedTask &&
      populatedTask.assignedTo &&
      populatedTask.assignedTo.length > 0
    ) {
      await notifyTaskStatusChange({
        task: populatedTask as any,
        actorId: req.user!.userId,
        type: NotificationType.TASK_COMPLETED, // Reusing for deletions
        title: "Task Deleted",
        message: `Task deleted: ${populatedTask.title}`,
      });
    }

    res.json({ success: true, message: "Task deleted successfully" });
  })
);

export default router;
