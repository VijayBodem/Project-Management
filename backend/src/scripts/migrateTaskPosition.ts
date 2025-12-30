/**
 * Migration script to add position field to existing tasks
 * Run this script once after deploying task position feature
 * 
 * Usage: npx ts-node src/scripts/migrateTaskPosition.ts
 */

import mongoose from "mongoose";
import { Task } from "../models/Task.model";
import { Project } from "../models/Project.model";
import { env } from "../config/env";

const migrateTaskPosition = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(env.mongoUri);
    console.log("Connected to MongoDB");

    console.log("\n🔄 Migrating task positions...\n");

    // Get all projects
    const projects = await Project.find({});
    console.log(`Found ${projects.length} projects`);

    let totalTasksUpdated = 0;

    // For each project, assign positions to tasks in each status column
    for (const project of projects) {
      console.log(`\nProcessing project: ${project.name}`);

      const statuses = ["todo", "in-progress", "done"];

      for (const status of statuses) {
        // Get tasks in this status for this project
        const tasks = await Task.find({
          project: project._id,
          status,
          position: { $exists: false },
        }).sort({ createdAt: 1 }); // Oldest first

        if (tasks.length === 0) continue;

        console.log(`  ${status}: ${tasks.length} tasks`);

        // Assign positions based on creation order
        const bulkOps = tasks.map((task, index) => ({
          updateOne: {
            filter: { _id: task._id },
            update: { $set: { position: index } },
          },
        }));

        if (bulkOps.length > 0) {
          const result = await Task.bulkWrite(bulkOps);
          totalTasksUpdated += result.modifiedCount;
        }
      }
    }

    console.log(`\n✅ Updated ${totalTasksUpdated} tasks with positions`);

    // Set position to 0 for any remaining tasks without position
    const remainingTasks = await Task.updateMany(
      { position: { $exists: false } },
      { $set: { position: 0 } }
    );

    if (remainingTasks.modifiedCount > 0) {
      console.log(`✅ Set default position for ${remainingTasks.modifiedCount} remaining tasks`);
    }

    console.log("\n✨ Migration completed successfully!\n");

    // Verify migration
    console.log("📊 Verification:\n");

    const totalTasks = await Task.countDocuments({});
    const tasksWithPosition = await Task.countDocuments({ position: { $exists: true } });
    console.log(`Tasks: ${tasksWithPosition}/${totalTasks} have position field`);

    // Show sample tasks
    const sampleTasks = await Task.find({})
      .limit(5)
      .select("title status position")
      .lean();

    console.log("\nSample tasks:");
    sampleTasks.forEach((task: any) => {
      console.log(`  - ${task.title} (${task.status}): position ${task.position}`);
    });

    console.log("\n✅ Done!");
  } catch (error) {
    console.error("❌ Error during migration:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    process.exit(0);
  }
};

migrateTaskPosition();
