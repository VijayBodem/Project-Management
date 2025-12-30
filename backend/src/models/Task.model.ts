import { Schema, model, Types } from "mongoose";

export enum TaskStatus {
  TODO = "todo",
  IN_PROGRESS = "in-progress",
  DONE = "done",
}

export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

const taskSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: String,
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.TODO,
    },
    priority: {
      type: String,
      enum: Object.values(TaskPriority),
      default: TaskPriority.MEDIUM,
    },
    dueDate: {
      type: Date,
    },
    project: {
      type: Types.ObjectId,
      ref: "Project",
      required: true,
    },
    assignedTo: [{
      type: Types.ObjectId,
      ref: "User",
    }],
    createdBy: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Position within status column for drag-and-drop ordering
    position: {
      type: Number,
      default: 0,
    },
    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    deletedBy: {
      type: Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Indexes for performance
taskSchema.index({ project: 1, status: 1 }); // Filter by project and status
taskSchema.index({ project: 1, assignedTo: 1 }); // Filter by project and assignee (array index)
taskSchema.index({ assignedTo: 1, status: 1 }); // My tasks queries (array index)
taskSchema.index({ project: 1, isDeleted: 1 }); // Exclude deleted tasks
taskSchema.index({ dueDate: 1 }, { sparse: true }); // Due date queries
taskSchema.index({ createdAt: -1 }); // Sorting by creation date
taskSchema.index({ priority: 1 }); // Filter by priority
taskSchema.index({ project: 1, status: 1, position: 1 }); // Ordering within columns

// Compound index for common query patterns
taskSchema.index({ project: 1, status: 1, assignedTo: 1 });

// Default query to exclude soft-deleted tasks
taskSchema.pre(/^find/, function (this: any) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
});

export const Task = model("Task", taskSchema);
