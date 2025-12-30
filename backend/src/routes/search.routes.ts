import { Router } from "express";
import { Task } from "../models/Task.model";
import { Project } from "../models/Project.model";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();


// Get all projects the user belongs to → extract their IDs → find tasks inside those projects that match the search query


// Global search
router.get("/", authenticate, async (req, res) => {
  try {
    const { query, type = "all" } = req.query;

    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return res.status(400).json({ message: "Query must be at least 2 characters" });
    }

    const searchRegex = new RegExp(query, "i");
    const results: any = {
      projects: [],
      tasks: [],
    };

    // Search projects
    if (type === "all" || type === "projects") {
      results.projects = await Project.find({
        members: req.user!.userId,
        $or: [
          { name: searchRegex },
          { description: searchRegex },
        ],
      })
        .populate("createdBy", "name email")
        .limit(10)
        .select("name description createdBy createdAt");
    }

    // Search tasks
    if (type === "all" || type === "tasks") {
      // First, get user's projects
      const userProjects = await Project.find({
        members: req.user!.userId,
      }).select("_id");

      const projectIds = userProjects.map((p) => p._id);

      results.tasks = await Task.find({
        project: { $in: projectIds },
        $or: [
          { title: searchRegex },
          { description: searchRegex },
        ],
      })
        .populate("project", "name")
        .populate("assignedTo", "name email")
        .populate("createdBy", "name email")
        .limit(20)
        .sort({ updatedAt: -1 });
    }

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: "Search failed" });
  }
});

export default router;
