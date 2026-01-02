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

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "urgent":
        return "#f44336";
      case "high":
        return "#ff9800";
      case "medium":
        return "#2196f3";
      case "low":
        return "#4caf50";
      default:
        return "#999";
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
      className="fixed inset-0 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="py-10 text-center text-gray-600">
            Loading task details...
          </div>
        ) : !task ? (
          <div className="py-10 text-center text-gray-600">
            Task not found
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="py-5 px-6 border-b border-gray-200">
              <div className="flex-1">
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
                    className="w-full text-xl font-semibold border border-blue-500 rounded p-2 bg-white"
                  />
                ) : permissions.canEditTask ? (
                  <input
                    type="text"
                    value={getCurrentValue("title") || ""}
                    onChange={(e) => handleFieldChange("title", e.target.value)}
                    className="w-full text-xl p-2 rounded border border-blue-500 bg-white"
                    placeholder="Task title"
                  />
                ) : (
                  <h2 className="m-0 text-xl p-2 rounded text-gray-900">
                    {task.title}
                  </h2>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                {hasUnsavedChanges && permissions.canEditTask && (
                  <>
                    <button
                      onClick={handleCancelChanges}
                      className="px-3 py-1.5 border border-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveChanges}
                      className="px-3 py-1.5 border-none rounded bg-blue-500 text-white cursor-pointer text-sm hover:bg-blue-600 transition-colors"
                    >
                      Save Changes
                    </button>
                  </>
                )}

                <button
                  onClick={onClose}
                  className="border-none bg-transparent cursor-pointer text-2xl text-gray-500"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              {(["details", "comments", "activity"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 px-4 border-none bg-transparent cursor-pointer text-sm capitalize transition-colors ${
                    activeTab === tab
                      ? "font-semibold border-b-2 border-blue-500 text-blue-500"
                      : "font-normal text-gray-600"
                  }`}
                >
                  {tab}
                  {tab === "comments" && ` (${comments.length})`}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === "details" && (
                <TaskDetailsTab
                  task={task}
                  getCurrentValue={getCurrentValue}
                  handleFieldChange={handleFieldChange}
                  getPriorityColor={getPriorityColor}
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
  getPriorityColor,
  formatDate,
  permissions,
  members,
}: any) => (
  <div className="flex flex-col gap-6">
    {/* Description */}
    <div>
      <label className="block mb-2 font-medium text-sm text-gray-700">
        Description
      </label>
      {permissions.canEditTask ? (
        <textarea
          value={getCurrentValue("description") || ""}
          onChange={(e) => handleFieldChange("description", e.target.value)}
          rows={6}
          className="w-full p-2.5 border border-gray-300"
          placeholder="Add a description..."
        />
      ) : (
        <div
          className="p-2.5 border border-gray-200"
          style={{ color: task.description ? undefined : "#999" }}
        >
          <span
            className={
              task.description
                ? "text-gray-900"
                : "text-gray-500"
            }
          >
            {task.description || "No description"}
          </span>
        </div>
      )}
    </div>

    {/* Priority */}
    <div>
      <label className="block mb-2 font-medium text-sm text-gray-700">
        Priority
      </label>
      {permissions.canEditTask ? (
        <select
          value={getCurrentValue("priority") || "medium"}
          onChange={(e) => handleFieldChange("priority", e.target.value)}
          className="py-2 px-3 border-none rounded text-sm text-white font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{
            backgroundColor: getPriorityColor(
              getCurrentValue("priority") || task.priority
            ),
          }}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      ) : (
        <span
          className="inline-block py-2 px-3 rounded text-sm text-white font-semibold"
          style={{ backgroundColor: getPriorityColor(task.priority) }}
        >
          {(task.priority || "medium").toUpperCase()}
        </span>
      )}
    </div>

    {/* Due Date */}
    <div>
      <label className="block mb-2 font-medium text-sm text-gray-700">
        Due Date
      </label>
      {permissions.canEditTask ? (
        <input
          type="date"
          value={getCurrentValue("dueDate") || ""}
          onChange={(e) => handleFieldChange("dueDate", e.target.value)}
          className="py-2 px-3 border border-gray-300"
        />
      ) : (
        <div className="py-2 px-3 text-sm text-gray-900">
          {task.dueDate ? formatDate(task.dueDate) : "No due date"}
        </div>
      )}
    </div>

    {/* Status */}
    <div>
      <label className="block mb-2 font-medium text-sm text-gray-700">
        Status
      </label>
      <div className="text-sm text-gray-600">
        {task.status.replace("-", " ").toUpperCase()}
      </div>
    </div>

    {/* Assignee */}
    <div>
      <label className="block mb-2 font-medium text-sm text-gray-700">
        Assigned To
      </label>
      {permissions.canEditTask ? (
        <div className="space-y-2">
          {/* Current assignees display */}
          <div className="flex flex-wrap gap-2">
            {(() => {
              const current = (getCurrentValue("assignedTo") as string[]) || [];
              return current.length > 0 ? (
                current.map((assigneeId: string) => {
                  const assignee: any = members.find(
                    (m: any) => m.user._id === assigneeId
                  );
                  return assignee ? (
                    <div
                      key={assignee.user._id}
                      className="flex items-center gap-2 px-2 py-1 bg-blue-100"
                    >
                      <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-semibold">
                        {assignee.user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-gray-900">
                        {assignee.user.name}
                      </span>
                      <button
                        onClick={() => {
                          handleFieldChange(
                            "assignedTo",
                            current.filter((id: string) => id !== assigneeId)
                          );
                        }}
                        className="text-red-500 hover:text-red-700 text-xs ml-1"
                      >
                        ×
                      </button>
                    </div>
                  ) : null;
                })
              ) : (
                <span className="text-sm text-gray-500">
                  Unassigned
                </span>
              );
            })()}
          </div>

          {/* Add assignee dropdown */}
          <select
            onChange={(e) => {
              const userId = e.target.value;
              const current = (getCurrentValue("assignedTo") as string[]) || [];
              if (userId && !current.includes(userId)) {
                handleFieldChange("assignedTo", [...current, userId]);
              }
              e.target.value = ""; // Reset select
            }}
            className="py-2 px-3 border border-gray-300"
          >
            <option value="">Add assignee...</option>
            {(() => {
              const current = (getCurrentValue("assignedTo") as string[]) || [];
              return members
                .filter((member: any) => !current.includes(member.user._id))
                .map((member: any) => (
                  <option key={member.user._id} value={member.user._id}>
                    {member.user.name}
                  </option>
                ));
            })()}
          </select>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {task.assignedTo && task.assignedTo.length > 0 ? (
            task.assignedTo.map((assignee: any) => (
              <div
                key={assignee._id}
                className="flex items-center gap-2 px-2 py-1 bg-blue-100"
              >
                <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-semibold">
                  {assignee.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-gray-900">
                  {assignee.name}
                </span>
              </div>
            ))
          ) : (
            <span className="text-sm text-gray-500">
              Unassigned
            </span>
          )}
        </div>
      )}
    </div>

    {/* Created By */}
    <div>
      <label className="block mb-2 font-medium text-sm text-gray-700">
        Created By
      </label>
      <div className="text-sm text-gray-600">
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
  <div className="flex flex-col gap-4">
    {/* Add Comment */}
    <div>
      <textarea
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        placeholder="Add a comment..."
        rows={3}
        className="w-full p-2.5 border border-gray-300"
      />
      <button
        onClick={handleAddComment}
        disabled={!newComment.trim()}
        className={`mt-2 py-2 px-4 border-none rounded text-sm transition-colors ${
          newComment.trim()
            ? "bg-blue-500 text-white cursor-pointer hover:bg-blue-600"
            : "bg-gray-300"
        }`}
      >
        Add Comment
      </button>
    </div>

    {/* Comments List */}
    {comments.length === 0 ? (
      <div className="text-center py-5 text-gray-500">
        No comments yet
      </div>
    ) : (
      comments.map((comment: any) => (
        <div
          key={comment._id}
          className="p-3 border border-gray-200"
        >
          <div className="flex justify-between mb-2">
            <div>
              <span className="font-semibold text-sm text-gray-900">
                {comment.user.name}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(comment.createdAt).toLocaleString()}
                {comment.edited && " (edited)"}
              </span>
            </div>
            {(comment.user._id === currentUserId || canDeleteAnyComment) && (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingCommentId(comment._id);
                    setEditedCommentContent(comment.content);
                  }}
                  className="border-none bg-transparent cursor-pointer text-blue-500 text-xs hover:text-blue-600 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteComment(comment._id)}
                  className="border-none bg-transparent cursor-pointer text-red-500 text-xs hover:text-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
          {editingCommentId === comment._id ? (
            <div>
              <textarea
                value={editedCommentContent}
                onChange={(e) => setEditedCommentContent(e.target.value)}
                rows={3}
                className="w-full p-2 border border-blue-500 rounded text-sm bg-white"
              />
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => handleUpdateComment(comment._id)}
                  className="py-1.5 px-3 border-none rounded bg-blue-500 text-white cursor-pointer text-xs hover:bg-blue-600 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditingCommentId(null);
                    setEditedCommentContent("");
                  }}
                  className="py-1.5 px-3 border border-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm leading-relaxed text-gray-900">
              {comment.content}
            </div>
          )}
        </div>
      ))
    )}
  </div>
);

const ActivityTab = ({ activities, formatActivityMessage }: any) => (
  <div className="flex flex-col gap-3">
    {activities.length === 0 ? (
      <div className="text-center py-5 text-gray-500">
        No activity yet
      </div>
    ) : (
      activities.map((activity: any) => (
        <div
          key={activity._id}
          className="p-3 border-l-[3px] border-blue-500 bg-gray-100"
        >
          <div className="text-sm mb-1 text-gray-900">
            {formatActivityMessage(activity)}
          </div>
          <div className="text-xs text-gray-500">
            {new Date(activity.createdAt).toLocaleString()}
          </div>
        </div>
      ))
    )}
  </div>
);
