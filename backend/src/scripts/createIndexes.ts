/**
 * Script to create database indexes
 * Run this script after deploying to ensure all indexes are created
 * 
 * Usage: npx ts-node src/scripts/createIndexes.ts
 */

import mongoose from "mongoose";
import { User } from "../models/User";
import { Project } from "../models/Project.model";
import { Task } from "../models/Task.model";
import { Comment } from "../models/Comment.model";
import { Activity } from "../models/Activity.model";
import { Notification } from "../models/Notification.model";
import { env } from "../config/env";

const createIndexes = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(env.mongoUri);
    console.log("Connected to MongoDB");

    console.log("\n📊 Creating indexes...\n");

    // User indexes
    console.log("Creating User indexes...");
    await User.createIndexes();
    console.log("✅ User indexes created");

    // Project indexes
    console.log("Creating Project indexes...");
    await Project.createIndexes();
    console.log("✅ Project indexes created");

    // Task indexes
    console.log("Creating Task indexes...");
    await Task.createIndexes();
    console.log("✅ Task indexes created");

    // Comment indexes
    console.log("Creating Comment indexes...");
    await Comment.createIndexes();
    console.log("✅ Comment indexes created");

    // Activity indexes
    console.log("Creating Activity indexes...");
    await Activity.createIndexes();
    console.log("✅ Activity indexes created");

    // Notification indexes
    console.log("Creating Notification indexes...");
    await Notification.createIndexes();
    console.log("✅ Notification indexes created");

    console.log("\n✨ All indexes created successfully!\n");

    // List all indexes
    console.log("📋 Index Summary:\n");

    const userIndexes = await User.collection.getIndexes();
    console.log("User indexes:", Object.keys(userIndexes).length);

    const projectIndexes = await Project.collection.getIndexes();
    console.log("Project indexes:", Object.keys(projectIndexes).length);

    const taskIndexes = await Task.collection.getIndexes();
    console.log("Task indexes:", Object.keys(taskIndexes).length);

    const commentIndexes = await Comment.collection.getIndexes();
    console.log("Comment indexes:", Object.keys(commentIndexes).length);

    const activityIndexes = await Activity.collection.getIndexes();
    console.log("Activity indexes:", Object.keys(activityIndexes).length);

    const notificationIndexes = await Notification.collection.getIndexes();
    console.log("Notification indexes:", Object.keys(notificationIndexes).length);

    console.log("\n✅ Done!");
  } catch (error) {
    console.error("❌ Error creating indexes:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    process.exit(0);
  }
};

createIndexes();
