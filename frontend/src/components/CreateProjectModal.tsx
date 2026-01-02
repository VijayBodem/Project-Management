import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createProjectSchema, type CreateProjectInput } from "../schemas/validation";
import { ErrorMessage } from "./ErrorMessage";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description?: string }) => void;
  initialData?: { name: string; description?: string };
  title?: string;
  submitButtonText?: string;
}

export const CreateProjectModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title = "Create New Project",
  submitButtonText = "Create Project"
}: Props) => {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
  });

  // Reset form with initialData when modal opens or initialData changes
  useEffect(() => {
    if (isOpen && initialData) {
      reset(initialData);
    }
  }, [isOpen, initialData, reset]);

  if (!isOpen) return null;

  const handleFormSubmit = async (data: CreateProjectInput) => {
    setLoading(true);
    try {
      await onSubmit(data);
      reset();
      onClose();
    } catch (error) {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
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
          {title}
        </h2>

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="mb-4">
            <label className="block mb-1.5 text-sm font-medium text-gray-700">
              Project Name *
            </label>
            <input
              type="text"
              {...register("name")}
              placeholder="Enter project name"
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300"
            />
            <ErrorMessage message={errors.name?.message} />
          </div>

          <div className="mb-5">
            <label className="block mb-1.5 text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              {...register("description")}
              placeholder="Enter project description (optional)"
              rows={4}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300"
            />
            <ErrorMessage message={errors.description?.message} />
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
              {loading ? "Saving..." : submitButtonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
