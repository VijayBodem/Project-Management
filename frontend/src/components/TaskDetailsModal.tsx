import { useEffect, useState } from "react";
import type { Task } from "../services/task.service";
import type { Comment } from "../services/comment.service";
import type { Activity } from "../services/activity.service";
import { usePermissions } from "../hooks/usePermissions";
import { ProjectRole } from "../types/permissions";
import { ToastNotification, type Toast } from "./ToastNotification";
import { getTaskById, updateTask } from "../services/task.service";
import {
  getTaskComments,
  addComment,
  updateComment as updateCommentService,
  deleteComment as deleteCommentService,
} from "../services/comment.service";
import { getTaskActivities } from "../services/activity.service";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  currentUserId: string;
  userRole?: ProjectRole;
  members: Array<{
    user: {
      _id: string;
      name: string;
      email: string;
    };
    role: string;
  }>;
  onTaskUpdate: (task: Task) => void;
}

export const TaskDetailsModal = ({
  isOpen,
  onClose,
  taskId,
  currentUserId,
  userRole,
  members,
  onTaskUpdate,
}: Props) => {
  // Permissions
  const permissions = usePermissions({ userRole });

  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "details" | "comments" | "activity"
  >("details");

  // Edit states - batched editing approach
  const [pendingChanges, setPendingChanges] = useState<
    Partial<{
      title: string;
      description: string;
      priority: string;
      dueDate: string;
      assignedTo: string[];
    }>
  >({});
  const [originalValues, setOriginalValues] = useState<
    Partial<{
      title: string;
      description: string;
      priority: string;
      dueDate: string;
      assignedTo: string[];
    }>
  >({});

  // Check if there are unsaved changes
  const hasUnsavedChanges = Object.keys(pendingChanges).length > 0;

  // Legacy state for backward compatibility (remove when fully migrated)
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");

  // Toast notifications
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, "id">) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Comment state
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedCommentContent, setEditedCommentContent] = useState("");

  useEffect(() => {
    if (isOpen && taskId) {
      fetchTaskDetails();
    }
  }, [isOpen, taskId]);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      const [taskData, commentsData, activitiesData] = await Promise.all([
        getTaskById(taskId),
        getTaskComments(taskId),
        getTaskActivities(taskId),
      ]);

      setTask(taskData);
      setComments(commentsData);
      setActivities(activitiesData);

      // Initialize original values for change tracking
      setOriginalValues({
        title: taskData.title,
        description: taskData.description || "",
        priority: taskData.priority || "medium",
        dueDate: taskData.dueDate
          ? new Date(taskData.dueDate).toISOString().split("T")[0]
          : "",
        assignedTo: taskData.assignedTo?.map((a) => a._id) || [],
      });

      // Reset pending changes
      setPendingChanges({});
    } catch (error) {
      console.error("Failed to fetch task details:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle field changes (store in pending changes)
  const handleFieldChange = (
    field: keyof typeof pendingChanges,
    value: string
  ) => {
    setPendingChanges((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Get the current value for a field (pending change or original)
  const getCurrentValue = (field: keyof typeof originalValues) => {
    return pendingChanges[field] !== undefined
      ? pendingChanges[field]
      : originalValues[field];
  };

  // Save all pending changes
  const handleSaveChanges = async () => {
    if (!task || Object.keys(pendingChanges).length === 0) return;

    try {
      const updatedTask = await updateTask(taskId, pendingChanges);
      setTask(updatedTask);
      onTaskUpdate(updatedTask);

      // Update original values and clear pending changes
      setOriginalValues((prev) => ({
        ...prev,
        ...pendingChanges,
      }));
      setPendingChanges({});

      addToast({
        title: "Success",
        message: "Task updated successfully",
        type: "success",
      });
    } catch (error: any) {
      console.error("Failed to update task:", error);
      addToast({
        title: "Error",
        message: error.response?.data?.message || "Failed to update task",
        type: "error",
      });
    }
  };

  // Cancel pending changes
  const handleCancelChanges = () => {
    setPendingChanges({});
  };

  // Legacy function for backward compatibility (used by comments)
  const handleUpdateTask = async (updates: any) => {
    if (!task) return;

    try {
      const updatedTask = await updateTask(taskId, updates);
      setTask(updatedTask);
      onTaskUpdate(updatedTask);
    } catch (error: any) {
      console.error("Failed to update task:", error);
    }
  };

  const handleSaveTitle = async () => {
    if (editedTitle.trim() && editedTitle !== task?.title) {
      await handleUpdateTask({ title: editedTitle.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const comment = await addComment(taskId, newComment);
      setComments((prev) => [...prev, comment]);
      setNewComment("");
      await fetchTaskDetails(); // Refresh to get activity log
    } catch (error: any) {
      console.error("Failed to add comment:", error);
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editedCommentContent.trim()) return;

    try {
      const updated = await updateCommentService(
        commentId,
        editedCommentContent
      );
      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? updated : c))
      );
      setEditingCommentId(null);
      setEditedCommentContent("");
    } catch (error: any) {
      console.error("Failed to update comment:", error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Delete this comment?")) return;

    try {
      await deleteCommentService(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (error: any) {
      console.error("Failed to delete comment:", error);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatActivityMessage = (activity: Activity) => {
    const userName = activity.user.name;
    switch (activity.type) {
      case "task_created":
        return `${userName} created this task`;
      case "status_changed":
        return `${userName} changed status to ${activity.details.status}`;
      case "assigned":
        return `${userName} assigned this task`;
      case "unassigned":
        return `${userName} unassigned this task`;
      case "priority_changed":
        return `${userName} changed priority from ${activity.details.from} to ${activity.details.to}`;
      case "due_date_set":
        return `${userName} set due date`;
      case "due_date_changed":
        return `${userName} changed due date`;
      case "comment_added":
        return `${userName} added a comment`;
      case "task_updated":
        return `${userName} updated task details`;
      default:
        return `${userName} performed an action`;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[1000] animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden border border-slate-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="px-8 py-16">
            <div className="text-center space-y-4">
              <div className="inline-block w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-600">Loading task details...</p>
            </div>
          </div>
        ) : !task ? (
          <div className="px-8 py-16">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto">
                <svg
                  className="w-8 h-8 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                Task not found
              </h3>
              <p className="text-slate-600">
                The task you're looking for doesn't exist or has been deleted.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-200 bg-slate-50">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div
                    className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      task.status === "todo"
                        ? "bg-yellow-500"
                        : task.status === "in-progress"
                        ? "bg-blue-500"
                        : task.status === "done"
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    {isEditingTitle ? (
                      <input
                        type="text"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        onBlur={handleSaveTitle}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveTitle();
                          if (e.key === "Escape") {
                            setEditedTitle(task.title);
                            setIsEditingTitle(false);
                          }
                        }}
                        autoFocus
                        className="w-full text-2xl font-bold border-2 border-blue-500 rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : permissions.canEditTask ? (
                      <input
                        type="text"
                        value={getCurrentValue("title") || ""}
                        onChange={(e) =>
                          handleFieldChange("title", e.target.value)
                        }
                        className="w-full text-2xl font-bold border-2 border-blue-500 rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Task title"
                      />
                    ) : (
                      <h1 className="text-2xl font-bold text-slate-900 line-clamp-2">
                        {task.title}
                      </h1>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span
                    className={`badge ${
                      task.status === "todo"
                        ? "badge-todo"
                        : task.status === "in-progress"
                        ? "badge-in-progress"
                        : task.status === "done"
                        ? "badge-done"
                        : "badge-blocked"
                    }`}
                  >
                    {task.status === "todo"
                      ? "TO DO"
                      : task.status === "in-progress"
                      ? "IN PROGRESS"
                      : task.status === "done"
                      ? "DONE"
                      : "BLOCKED"}
                  </span>
                  <span
                    className={`badge ${
                      task.priority === "low"
                        ? "priority-low"
                        : task.priority === "medium"
                        ? "priority-medium"
                        : task.priority === "high"
                        ? "priority-high"
                        : "priority-urgent"
                    }`}
                  >
                    {task.priority?.toUpperCase()}
                  </span>

                  {/* Action buttons */}
                  {hasUnsavedChanges && permissions.canEditTask && (
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={handleCancelChanges}
                        className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveChanges}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-sm hover:shadow-md"
                      >
                        Save Changes
                      </button>
                    </div>
                  )}

                  <button
                    onClick={onClose}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
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
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50">
              {(["details", "comments", "activity"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-4 text-sm font-medium capitalize transition-all relative ${
                    activeTab === tab
                      ? "text-blue-700 bg-white border-b-2 border-blue-600"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  {tab}
                  {tab === "comments" && ` (${comments.length})`}
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-sm" />
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              {activeTab === "details" && (
                <TaskDetailsTab
                  task={task}
                  getCurrentValue={getCurrentValue}
                  handleFieldChange={handleFieldChange}
                  formatDate={formatDate}
                  permissions={permissions}
                  members={members}
                />
              )}

              {activeTab === "comments" && (
                <CommentsTab
                  comments={comments}
                  newComment={newComment}
                  setNewComment={setNewComment}
                  handleAddComment={handleAddComment}
                  editingCommentId={editingCommentId}
                  setEditingCommentId={setEditingCommentId}
                  editedCommentContent={editedCommentContent}
                  setEditedCommentContent={setEditedCommentContent}
                  handleUpdateComment={handleUpdateComment}
                  handleDeleteComment={handleDeleteComment}
                  currentUserId={currentUserId}
                  canDeleteAnyComment={permissions.canDeleteAnyComment}
                  permissions={permissions}
                />
              )}

              {activeTab === "activity" && (
                <ActivityTab
                  activities={activities}
                  formatActivityMessage={formatActivityMessage}
                />
              )}
            </div>
          </>
        )}
      </div>

      {/* Toast Notifications */}
      <ToastNotification toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

// Sub-components for each tab
const TaskDetailsTab = ({
  task,
  getCurrentValue,
  handleFieldChange,
  formatDate,
  permissions,
  members,
}: any) => (
  <div className="space-y-6">
    {/* Description */}
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-900">
        Description
      </label>
      {permissions.canEditTask ? (
        <textarea
          value={getCurrentValue("description") || ""}
          onChange={(e) => handleFieldChange("description", e.target.value)}
          rows={6}
          className="w-full px-4 py-3 text-sm border border-slate-300 rounded-xl bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
          placeholder="Add a description..."
        />
      ) : (
        <div className="px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 min-h-[120px]">
          <span
            className={task.description ? "text-slate-900" : "text-slate-500"}
          >
            {task.description || "No description"}
          </span>
        </div>
      )}
    </div>

    {/* Priority */}
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-900">
        Priority
      </label>
      {permissions.canEditTask ? (
        <select
          value={getCurrentValue("priority") || "medium"}
          onChange={(e) => handleFieldChange("priority", e.target.value)}
          className="px-4 py-3 text-sm border border-slate-300 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      ) : (
        <div className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-700">
          {(task.priority || "medium").toUpperCase()}
        </div>
      )}
    </div>

    {/* Due Date */}
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-900">
        Due Date
      </label>
      {permissions.canEditTask ? (
        <input
          type="date"
          value={getCurrentValue("dueDate") || ""}
          onChange={(e) => handleFieldChange("dueDate", e.target.value)}
          className="px-4 py-3 text-sm border border-slate-300 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
      ) : (
        <div className="px-4 py-3 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-xl">
          {task.dueDate ? formatDate(task.dueDate) : "No due date"}
        </div>
      )}
    </div>

    {/* Status */}
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-900">Status</label>
      <div className="px-4 py-3 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-xl">
        {task.status.replace("-", " ").toUpperCase()}
      </div>
    </div>

    {/* Assignee */}
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-900">
        Assigned To
      </label>
      {permissions.canEditTask ? (
        <div className="space-y-3">
          {/* Current assignees display */}
          <div className="space-y-2">
            {(() => {
              const current = (getCurrentValue("assignedTo") as string[]) || [];
              return current.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {current.map((assigneeId: string) => {
                    const assignee: any = members.find(
                      (m: any) => m.user._id === assigneeId
                    );
                    return assignee ? (
                      <div
                        key={assignee.user._id}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg"
                      >
                        <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-semibold">
                          {assignee.user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-slate-900 text-sm font-medium">
                          {assignee.user.name}
                        </span>
                        <button
                          onClick={() => {
                            handleFieldChange(
                              "assignedTo",
                              current.filter((id: string) => id !== assigneeId)
                            );
                          }}
                          className="ml-1 text-red-500 hover:text-red-700 transition-colors"
                        >
                          <svg
                            className="w-4 h-4"
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
                    ) : null;
                  })}
                </div>
              ) : (
                <div className="px-4 py-3 text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-xl">
                  Unassigned
                </div>
              );
            })()}
          </div>

          {/* Add assignee dropdown */}
          <div className="relative">
            <select
              onChange={(e) => {
                const userId = e.target.value;
                const current =
                  (getCurrentValue("assignedTo") as string[]) || [];
                if (userId && !current.includes(userId)) {
                  handleFieldChange("assignedTo", [...current, userId]);
                }
                e.target.value = ""; // Reset select
              }}
              className="w-full px-4 py-3 text-sm border border-slate-300 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none"
            >
              <option value="">Add assignee...</option>
              {(() => {
                const current =
                  (getCurrentValue("assignedTo") as string[]) || [];
                return members
                  .filter((member: any) => !current.includes(member.user._id))
                  .map((member: any) => (
                    <option key={member.user._id} value={member.user._id}>
                      {member.user.name}
                    </option>
                  ));
              })()}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg
                className="w-4 h-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {task.assignedTo && task.assignedTo.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {task.assignedTo.map((assignee: any) => (
                <div
                  key={assignee._id}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg"
                >
                  <div className="w-6 h-6 rounded-full bg-slate-500 text-white flex items-center justify-center text-xs font-semibold">
                    {assignee.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-slate-900 text-sm font-medium">
                    {assignee.name}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-3 text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-xl">
              Unassigned
            </div>
          )}
        </div>
      )}
    </div>

    {/* Created By */}
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-900">
        Created By
      </label>
      <div className="px-4 py-3 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-xl">
        {task.createdBy.name} on {formatDate(task.createdAt)}
      </div>
    </div>
  </div>
);

const CommentsTab = ({
  comments,
  newComment,
  setNewComment,
  handleAddComment,
  editingCommentId,
  setEditingCommentId,
  editedCommentContent,
  setEditedCommentContent,
  handleUpdateComment,
  handleDeleteComment,
  currentUserId,
  canDeleteAnyComment,
}: any) => (
  <div className="space-y-6">
    {/* Add Comment */}
    <div className="space-y-4">
      <textarea
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        placeholder="Add a comment..."
        rows={3}
        className="w-full px-4 py-3 text-sm border border-slate-300 rounded-xl bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
      />
      <button
        onClick={handleAddComment}
        disabled={!newComment.trim()}
        className={`inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          newComment.trim()
            ? "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg"
            : "bg-slate-200 text-slate-400 cursor-not-allowed"
        }`}
      >
        Add Comment
      </button>
    </div>

    {/* Comments List */}
    {comments.length === 0 ? (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          No comments yet
        </h3>
        <p className="text-slate-600">
          Be the first to add a comment to this task
        </p>
      </div>
    ) : (
      <div className="space-y-4">
        {comments.map((comment: any) => (
          <div
            key={comment._id}
            className="p-4 bg-slate-50 border border-slate-200 rounded-xl"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-700">
                    {comment.user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-sm text-slate-900">
                    {comment.user.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(comment.createdAt).toLocaleString()}
                    {comment.edited && " (edited)"}
                  </div>
                </div>
              </div>
              {(comment.user._id === currentUserId || canDeleteAnyComment) && (
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setEditingCommentId(comment._id);
                      setEditedCommentContent(comment.content);
                    }}
                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Edit comment"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteComment(comment._id)}
                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete comment"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            {editingCommentId === comment._id ? (
              <div className="space-y-3">
                <textarea
                  value={editedCommentContent}
                  onChange={(e) => setEditedCommentContent(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 text-sm border border-blue-500 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateComment(comment._id)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingCommentId(null);
                      setEditedCommentContent("");
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-sm leading-relaxed text-slate-900">
                {comment.content}
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
);

const ActivityTab = ({ activities, formatActivityMessage }: any) => (
  <div className="space-y-4">
    {activities.length === 0 ? (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          No activity yet
        </h3>
        <p className="text-slate-600">
          Task activity will appear here as changes are made
        </p>
      </div>
    ) : (
      <div className="space-y-3">
        {activities.map((activity: any) => (
          <div
            key={activity._id}
            className="p-4 border-l-4 border-blue-500 bg-slate-50 rounded-r-xl"
          >
            <div className="text-sm text-slate-900 mb-1">
              {formatActivityMessage(activity)}
            </div>
            <div className="text-xs text-slate-500">
              {new Date(activity.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);
