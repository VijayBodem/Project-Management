import { Router, Request, Response } from "express";
import { Comment } from "../models/Comment.model";
import { Task } from "../models/Task.model";
import { Activity, ActivityType } from "../models/Activity.model";
import { Project } from "../models/Project.model";
import { authenticate } from "../middlewares/auth.middleware";
import { emitToProject } from "../socket/events";
import { createNotification } from "../utils/notifications";
import { NotificationType } from "../models/Notification.model";
import { validate } from "../utils/validation";
import { createCommentSchema, updateCommentSchema } from "../utils/validation";
import { asyncHandler } from "../middlewares/errorHandler";

const router = Router();

// Get comments for a task
router.get("/task/:taskId", authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;

  // Verify user has access to the task's project
  const task = await Task.findById(taskId);
  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  const project = await Project.findOne({
    _id: task.project,
    "members.user": req.user!.userId,
  });

  if (!project) {
    return res.status(403).json({ message: "Access denied" });
  }

  const comments = await Comment.find({ task: taskId })
    .populate("user", "name email")
    .sort({ createdAt: 1 });

  res.json(comments);
}));

// Add comment to task
router.post("/", authenticate, validate(createCommentSchema), asyncHandler(async (req: Request, res: Response) => {
  const { taskId, content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ message: "Comment content is required" });
  }

  // Verify user has access to the task's project
  const task = await Task.findById(taskId);
  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  const project = await Project.findOne({
    _id: task.project,
    members: req.user!.userId,
  });

  if (!project) {
    return res.status(403).json({ message: "Access denied" });
  }

  // Create comment
  const comment = await Comment.create({
    task: taskId,
    user: req.user!.userId,
    content: content.trim(),
  });

  const populatedComment = await Comment.findById(comment._id).populate(
    "user",
    "name email"
  );

  // Log activity
  await Activity.create({
    task: taskId,
    user: req.user!.userId,
    type: ActivityType.COMMENT_ADDED,
    details: { commentId: comment._id },
  });

  // Emit real-time event
  emitToProject(task.project.toString(), "comment:added", {
    comment: populatedComment,
    taskId,
  });

  // Notify all task assignees if different from commenter
  if (task.assignedTo && Array.isArray(task.assignedTo)) {
    for (const assignee of task.assignedTo) {
      const assigneeId = (assignee as any).toString();
      if (assigneeId !== req.user!.userId) {
        await createNotification({
          userId: assigneeId,
          type: NotificationType.TASK_COMMENT,
          title: "New Comment",
          message: `New comment on: ${task.title}`,
          taskId: task._id.toString(),
          projectId: task.project.toString(),
          commentId: comment._id.toString(),
          actorId: req.user!.userId,
        });
      }
    }
  }

  res.status(201).json(populatedComment);
}));

// Update comment
router.patch("/:commentId", authenticate, validate(updateCommentSchema), asyncHandler(async (req: Request, res: Response) => {
  const { commentId } = req.params;
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ message: "Comment content is required" });
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    return res.status(404).json({ message: "Comment not found" });
  }

  // Only comment author can edit
  if (comment.user.toString() !== req.user!.userId) {
    return res.status(403).json({ message: "Access denied" });
  }

  comment.content = content.trim();
  comment.edited = true;
  await comment.save();

  const populatedComment = await Comment.findById(commentId).populate(
    "user",
    "name email"
  );

  // Get task for real-time event
  const task = await Task.findById(comment.task);
  if (task) {
    emitToProject(task.project.toString(), "comment:updated", {
      comment: populatedComment,
      taskId: task._id,
    });
  }

  res.json(populatedComment);
}));

// Delete comment
router.delete("/:commentId", authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { commentId } = req.params;

  const comment = await Comment.findById(commentId);
  if (!comment) {
    return res.status(404).json({ message: "Comment not found" });
  }

  // Only comment author can delete
  if (comment.user.toString() !== req.user!.userId) {
    return res.status(403).json({ message: "Access denied" });
  }

  const taskId = comment.task;
  const task = await Task.findById(taskId);

  await Comment.findByIdAndDelete(commentId);

  // Emit real-time event
  if (task) {
    emitToProject(task.project.toString(), "comment:deleted", {
      commentId,
      taskId,
    });
  }

  res.json({ message: "Comment deleted successfully" });
}));

export default router;
