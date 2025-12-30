import { Schema, model, Types } from "mongoose";

const commentSchema = new Schema(
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
    content: {
      type: String,
      required: true,
      trim: true,
    },
    edited: {
      type: Boolean,
      default: false,
    },
    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Indexes for performance
commentSchema.index({ task: 1, createdAt: -1 }); // Task comments (already exists)
commentSchema.index({ user: 1, createdAt: -1 }); // User's comments
commentSchema.index({ task: 1, isDeleted: 1 }); // Exclude deleted comments

// Default query to exclude soft-deleted comments
commentSchema.pre(/^find/, function (this: any) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
});

export const Comment = model("Comment", commentSchema);
