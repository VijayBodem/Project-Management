import { Schema, model, Types } from "mongoose";

export enum ActivityType {
  TASK_CREATED = "task_created",
  TASK_UPDATED = "task_updated",
  STATUS_CHANGED = "status_changed",
  ASSIGNED = "assigned",
  UNASSIGNED = "unassigned",
  PRIORITY_CHANGED = "priority_changed",
  DUE_DATE_SET = "due_date_set",
  DUE_DATE_CHANGED = "due_date_changed",
  COMMENT_ADDED = "comment_added",
}

const activitySchema = new Schema(
  {
    task: {
      type: Types.ObjectId,
      ref: "Task",
      required: true,
    },
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(ActivityType),
      required: true,
    },
    details: {
      type: Schema.Types.Mixed, // Flexible field for activity-specific data
    },
  },
  { timestamps: true }
);

// Indexes for performance
activitySchema.index({ task: 1, createdAt: -1 }); // Task activity (already exists)
activitySchema.index({ user: 1, createdAt: -1 }); // User activity
activitySchema.index({ type: 1, createdAt: -1 }); // Activity type queries

export const Activity = model("Activity", activitySchema);
