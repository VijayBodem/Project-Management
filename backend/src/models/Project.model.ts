import { Schema, model, Types } from "mongoose";
import { ProjectRole } from "../utils/projectRoles";

interface ProjectMember {
  user: Types.ObjectId;
  role: ProjectRole;
  joinedAt: Date;
}

const projectMemberSchema = new Schema<ProjectMember>({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  role: {
    type: String,
    enum: Object.values(ProjectRole),
    default: ProjectRole.MEMBER,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
});

const projectSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    createdBy: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [projectMemberSchema],
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
projectSchema.index({ "members.user": 1 }); // Member lookup (already exists)
projectSchema.index({ createdBy: 1 }); // Creator lookup
projectSchema.index({ isDeleted: 1 }); // Exclude deleted projects
projectSchema.index({ createdAt: -1 }); // Sorting by creation date
projectSchema.index({ name: "text" }); // Text search on project name

// Compound index for member queries
projectSchema.index({ "members.user": 1, isDeleted: 1 });

// Default query to exclude soft-deleted projects
projectSchema.pre(/^find/, function (this: any) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
});

export const Project = model("Project", projectSchema);
