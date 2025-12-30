/**
 * Migration Script: Convert Task assignedTo from single ObjectId to array
 * 
 * This script migrates existing tasks from single assignment to multiple assignments.
 * Run this ONCE after deploying the schema change.
 * 
 * Usage: npm run db:migrate:task-assignments
 */

import mongoose from "mongoose";
import { Task } from "../models/Task.model";
import { connectDB } from "../config/db";

const migrateTaskAssignments = async () => {
  try {
    console.log("🚀 Starting task assignment migration...");
    
    await connectDB();
    
    // Find all tasks where assignedTo is not an array
    const tasksToMigrate = await Task.find({
      assignedTo: { $exists: true, $not: { $type: "array" } }
    }).lean();
    
    console.log(`📊 Found ${tasksToMigrate.length} tasks to migrate`);
    
    if (tasksToMigrate.length === 0) {
      console.log("✅ No tasks to migrate. All tasks already use array format.");
      process.exit(0);
    }
    
    let migratedCount = 0;
    let errorCount = 0;
    
    // Migrate each task
    for (const task of tasksToMigrate) {
      try {
        const assignedTo = task.assignedTo;
        
        // Convert single ObjectId to array
        if (assignedTo && !Array.isArray(assignedTo)) {
          await Task.updateOne(
            { _id: task._id },
            { $set: { assignedTo: [assignedTo] } }
          );
          migratedCount++;
          
          if (migratedCount % 100 === 0) {
            console.log(`✓ Migrated ${migratedCount} tasks...`);
          }
        }
      } catch (error) {
        console.error(`❌ Error migrating task ${task._id}:`, error);
        errorCount++;
      }
    }
    
    console.log("\n📈 Migration Summary:");
    console.log(`✅ Successfully migrated: ${migratedCount} tasks`);
    console.log(`❌ Errors: ${errorCount} tasks`);
    
    // Also handle tasks with null assignedTo (convert to empty array)
    const nullAssignedTasks = await Task.updateMany(
      { assignedTo: null },
      { $set: { assignedTo: [] } }
    );
    
    console.log(`🔄 Converted ${nullAssignedTasks.modifiedCount} unassigned tasks to empty arrays`);
    
    console.log("\n✅ Migration completed successfully!");
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
    process.exit(0);
  }
};

// Run migration
migrateTaskAssignments();
