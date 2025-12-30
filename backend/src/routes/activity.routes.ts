import { Router } from "express";
import { Activity } from "../models/Activity.model";
import { Task } from "../models/Task.model";
import { Project } from "../models/Project.model";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// Get activity log for a task
router.get("/task/:taskId", authenticate, async (req, res) => {
  try {
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

    const activities = await Activity.find({ task: taskId })
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(50); // Limit to last 50 activities

    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch activity log" });
  }
});

export default router;
