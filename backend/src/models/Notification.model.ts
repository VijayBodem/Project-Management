import { Schema, model, Types } from "mongoose";

export enum NotificationType {
  TASK_ASSIGNED = "task_assigned",
  TASK_UNASSIGNED = "task_unassigned",
  TASK_COMPLETED = "task_completed",
  TASK_COMMENT = "task_comment",
  TASK_MENTION = "task_mention",
  PROJECT_INVITE = "project_invite",
  PROJECT_REMOVED = "project_removed",
}

const notificationSchema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    // Related entities
    task: {
      type: Types.ObjectId,
      ref: "Task",
    },
    project: {
      type: Types.ObjectId,
      ref: "Project",
    },
    comment: {
      type: Types.ObjectId,
      ref: "Comment",
    },
    // Actor who triggered the notification
    actor: {
      type: Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Indexes for performance
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });
notificationSchema.index({ user: 1, createdAt: -1 });

export const Notification = model("Notification", notificationSchema);
