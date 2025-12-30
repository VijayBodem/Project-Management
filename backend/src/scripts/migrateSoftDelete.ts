/**
 * Migration script to add soft delete fields to existing documents
 * Run this script once after deploying soft delete feature
 * 
 * Usage: npx ts-node src/scripts/migrateSoftDelete.ts
 */

import mongoose from "mongoose";
import { Project } from "../models/Project.model";
import { Task } from "../models/Task.model";
import { Comment } from "../models/Comment.model";
import { env } from "../config/env";

const migrateSoftDelete = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(env.mongoUri);
    console.log("Connected to MongoDB");

    console.log("\n🔄 Migrating to soft delete...\n");

    // Migrate Projects
    console.log("Migrating Projects...");
    const projectsUpdated = await Project.updateMany(
      { isDeleted: { $exists: false } },
      { $set: { isDeleted: false } }
    );
    console.log(`✅ Updated ${projectsUpdated.modifiedCount} projects`);

    // Migrate Tasks
    console.log("Migrating Tasks...");
    const tasksUpdated = await Task.updateMany(
      { isDeleted: { $exists: false } },
      { $set: { isDeleted: false } }
    );
    console.log(`✅ Updated ${tasksUpdated.modifiedCount} tasks`);

    // Migrate Comments
    console.log("Migrating Comments...");
    const commentsUpdated = await Comment.updateMany(
      { isDeleted: { $exists: false } },
      { $set: { isDeleted: false } }
    );
    console.log(`✅ Updated ${commentsUpdated.modifiedCount} comments`);

    console.log("\n✨ Migration completed successfully!\n");

    // Verify migration
    console.log("📊 Verification:\n");

    const totalProjects = await Project.countDocuments({});
    const activeProjects = await Project.countDocuments({ isDeleted: false });
    console.log(`Projects: ${activeProjects}/${totalProjects} active`);

    const totalTasks = await Task.countDocuments({});
    const activeTasks = await Task.countDocuments({ isDeleted: false });
    console.log(`Tasks: ${activeTasks}/${totalTasks} active`);

    const totalComments = await Comment.countDocuments({});
    const activeComments = await Comment.countDocuments({ isDeleted: false });
    console.log(`Comments: ${activeComments}/${totalComments} active`);

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

migrateSoftDelete();
