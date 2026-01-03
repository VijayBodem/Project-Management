import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ProjectMember } from "../services/member.service";
import { createTaskSchema, type CreateTaskInput } from "../schemas/validation";
import { ErrorMessage } from "./ErrorMessage";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description?: string;
    assignedTo?: string[];
    priority?: string;
    dueDate?: string;
  }) => void;
  members: ProjectMember[];
}

export const CreateTaskModal = ({
  isOpen,
  onClose,
  onSubmit,
  members,
}: Props) => {
  const [loading, setLoading] = useState(false);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      priority: "medium",
    },
  });

  if (!isOpen) return null;

  console.log("membersssss", members);

  const handleFormSubmit = async (data: CreateTaskInput) => {
    setLoading(true);
    try {
      await onSubmit({
        ...data,
        assignedTo:
          selectedAssignees.length > 0 ? selectedAssignees : undefined,
      });
      reset({ priority: "medium" });
      setSelectedAssignees([]);
      onClose();
    } catch (error) {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset({ priority: "medium" });
    setSelectedAssignees([]);
    onClose();
  };

  const toggleAssignee = (userId: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[1000] animate-fade-in"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-900">
              Create New Task
            </h2>
            <button
              onClick={handleClose}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="px-8 py-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-900">
                Task Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("title")}
                placeholder="Enter task title"
                disabled={loading}
                className="w-full px-4 py-3 text-sm border border-slate-300 rounded-xl bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <ErrorMessage message={errors.title?.message} />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-900">
                Description
              </label>
              <textarea
                {...register("description")}
                placeholder="Enter task description (optional)"
                rows={3}
                disabled={loading}
                className="w-full px-4 py-3 text-sm border border-slate-300 rounded-xl bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <ErrorMessage message={errors.description?.message} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-900">
                  Priority
                </label>
                <select
                  {...register("priority")}
                  disabled={loading}
                  className="w-full px-4 py-3 text-sm border border-slate-300 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
                <ErrorMessage message={errors.priority?.message} />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-900">
                  Due Date
                </label>
                <input
                  type="date"
                  {...register("dueDate")}
                  disabled={loading}
                  className="w-full px-4 py-3 text-sm border border-slate-300 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <ErrorMessage message={errors.dueDate?.message} />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-900">
                Assign To{" "}
                <span className="text-slate-500 font-normal">
                  ({selectedAssignees.length} selected)
                </span>
              </label>
              <div className="max-h-[240px] overflow-y-auto border border-slate-200 rounded-xl bg-slate-50/50">
                {members.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-sm text-slate-500">
                      No members available
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {members.map((member) => (
                      <label
                        key={member.user._id}
                        className="flex items-center gap-3 p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedAssignees.includes(member.user._id)}
                          onChange={() => toggleAssignee(member.user._id)}
                          disabled={loading}
                          className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-xs font-semibold text-blue-700">
                              {member.user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-slate-900 truncate">
                              {member.user.name}
                            </div>
                            <div className="text-xs text-slate-500 truncate">
                              {member.user.email}
                            </div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Select one or more members to assign this task
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-lg"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating Task...</span>
                </div>
              ) : (
                "Create Task"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
