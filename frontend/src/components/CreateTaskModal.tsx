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

  console.log('membersssss', members)

  const handleFormSubmit = async (data: CreateTaskInput) => {
    setLoading(true);
    try {
      await onSubmit({
        ...data,
        assignedTo: selectedAssignees.length > 0 ? selectedAssignees : undefined,
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
    setSelectedAssignees(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
      onClick={handleClose}
    >
      <div
        className="bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-5 text-gray-900">
          Create New Task
        </h2>

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="mb-4">
            <label className="block mb-1.5 text-sm font-medium text-gray-700">
              Task Title *
            </label>
            <input
              type="text"
              {...register("title")}
              placeholder="Enter task title"
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300"
            />
            <ErrorMessage message={errors.title?.message} />
          </div>

          <div className="mb-4">
            <label className="block mb-1.5 text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              {...register("description")}
              placeholder="Enter task description (optional)"
              rows={3}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300"
            />
            <ErrorMessage message={errors.description?.message} />
          </div>

          <div className="mb-4">
            <label className="block mb-1.5 text-sm font-medium text-gray-700">
              Priority
            </label>
            <select
              {...register("priority")}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            <ErrorMessage message={errors.priority?.message} />
          </div>

          <div className="mb-4">
            <label className="block mb-1.5 text-sm font-medium text-gray-700">
              Due Date
            </label>
            <input
              type="date"
              {...register("dueDate")}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300"
            />
            <ErrorMessage message={errors.dueDate?.message} />
          </div>

          <div className="mb-5">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Assign To ({selectedAssignees.length} selected)
            </label>
            <div className="max-h-[200px] overflow-y-auto border border-gray-300">
              {members.length === 0 ? (
                <p className="text-sm text-gray-500">No members available</p>
              ) : (
                members.map((member) => (
                  <label
                    key={member.user._id}
                    className="flex items-center gap-2 p-2 hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAssignees.includes(member.user._id)}
                      onChange={() => toggleAssignee(member.user._id)}
                      disabled={loading}
                      className="w-4 h-4 text-blue-500 border-gray-300"
                    />
                    <span className="text-sm text-gray-900">
                      {member.user.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {member.user.email}
                    </span>
                  </label>
                ))
              )}
            </div>
            <p className="text-xs text-gray-500">
              Select one or more members to assign this task
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-5 py-2.5 border border-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 border-none rounded bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
