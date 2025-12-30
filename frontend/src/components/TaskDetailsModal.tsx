import { useEffect, useState } from "react";
import type { Task } from "../services/task.service";
import type { Comment } from "../services/comment.service";
import type { Activity } from "../services/activity.service";
import {
  getTaskById,
  updateTask,
} from "../services/task.service";
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
  onTaskUpdate: (task: Task) => void;
}

export const TaskDetailsModal = ({
  isOpen,
  onClose,
  taskId,
  currentUserId,
  onTaskUpdate,
}: Props) => {
  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"details" | "comments" | "activity">(
    "details"
  );

  // Edit states
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState("");

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
      setEditedTitle(taskData.title);
      setEditedDescription(taskData.description || "");
    } catch (error) {
      console.error("Failed to fetch task details:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleSaveDescription = async () => {
    if (editedDescription !== task?.description) {
      await handleUpdateTask({ description: editedDescription });
    }
    setIsEditingDescription(false);
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
      const updated = await updateCommentService(commentId, editedCommentContent);
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
      className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-[1001] p-5"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-[900px] max-h-[90vh] flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="py-10 text-center text-gray-600 dark:text-gray-400">
            Loading task details...
          </div>
        ) : !task ? (
          <div className="py-10 text-center text-gray-600 dark:text-gray-400">
            Task not found
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="py-5 px-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-start">
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
                    className="w-full text-xl font-semibold border border-blue-500 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <h2
                    onClick={() => setIsEditingTitle(true)}
                    className="m-0 text-xl cursor-pointer p-2 rounded text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    {task.title}
                  </h2>
                )}
              </div>
              <button
                onClick={onClose}
                className="border-none bg-transparent cursor-pointer text-2xl text-gray-500 dark:text-gray-400 p-0 px-2 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                ×
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
              {(["details", "comments", "activity"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 px-4 border-none bg-transparent cursor-pointer text-sm capitalize transition-colors ${
                    activeTab === tab
                      ? "font-semibold border-b-2 border-blue-500 text-blue-500"
                      : "font-normal text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
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
                  isEditingDescription={isEditingDescription}
                  editedDescription={editedDescription}
                  setEditedDescription={setEditedDescription}
                  setIsEditingDescription={setIsEditingDescription}
                  handleSaveDescription={handleSaveDescription}
                  handleUpdateTask={handleUpdateTask}
                  getPriorityColor={getPriorityColor}
                  formatDate={formatDate}
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
    </div>
  );
};

// Sub-components for each tab
const TaskDetailsTab = ({ task, isEditingDescription, editedDescription, setEditedDescription, setIsEditingDescription, handleSaveDescription, handleUpdateTask, getPriorityColor, formatDate }: any) => (
  <div className="flex flex-col gap-6">
    {/* Description */}
    <div>
      <label className="block mb-2 font-medium text-sm text-gray-700 dark:text-gray-300">
        Description
      </label>
      {isEditingDescription ? (
        <textarea
          value={editedDescription}
          onChange={(e) => setEditedDescription(e.target.value)}
          onBlur={handleSaveDescription}
          autoFocus
          rows={6}
          className="w-full p-2.5 border border-blue-500 rounded text-sm resize-y bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      ) : (
        <div
          onClick={() => setIsEditingDescription(true)}
          className="p-2.5 border border-gray-300 dark:border-gray-600 rounded min-h-[100px] cursor-pointer text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          style={{ color: task.description ? undefined : "#999" }}
        >
          <span className={task.description ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}>
            {task.description || "Click to add description..."}
          </span>
        </div>
      )}
    </div>

    {/* Priority */}
    <div>
      <label className="block mb-2 font-medium text-sm text-gray-700 dark:text-gray-300">
        Priority
      </label>
      <select
        value={task.priority || "medium"}
        onChange={(e) => handleUpdateTask({ priority: e.target.value })}
        className="py-2 px-3 border-none rounded text-sm text-white font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
        style={{ backgroundColor: getPriorityColor(task.priority) }}
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="urgent">Urgent</option>
      </select>
    </div>

    {/* Due Date */}
    <div>
      <label className="block mb-2 font-medium text-sm text-gray-700 dark:text-gray-300">
        Due Date
      </label>
      <input
        type="date"
        value={task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""}
        onChange={(e) => handleUpdateTask({ dueDate: e.target.value || null })}
        className="py-2 px-3 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {task.dueDate && (
        <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
          {formatDate(task.dueDate)}
        </div>
      )}
    </div>

    {/* Status */}
    <div>
      <label className="block mb-2 font-medium text-sm text-gray-700 dark:text-gray-300">
        Status
      </label>
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {task.status.replace("-", " ").toUpperCase()}
      </div>
    </div>

    {/* Assignee */}
    <div>
      <label className="block mb-2 font-medium text-sm text-gray-700 dark:text-gray-300">
        Assigned To
      </label>
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {task.assignedTo ? task.assignedTo.name : "Unassigned"}
      </div>
    </div>

    {/* Created By */}
    <div>
      <label className="block mb-2 font-medium text-sm text-gray-700 dark:text-gray-300">
        Created By
      </label>
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {task.createdBy.name} on {formatDate(task.createdAt)}
      </div>
    </div>
  </div>
);

const CommentsTab = ({ comments, newComment, setNewComment, handleAddComment, editingCommentId, setEditingCommentId, editedCommentContent, setEditedCommentContent, handleUpdateComment, handleDeleteComment, currentUserId }: any) => (
  <div className="flex flex-col gap-4">
    {/* Add Comment */}
    <div>
      <textarea
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        placeholder="Add a comment..."
        rows={3}
        className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded text-sm resize-y bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        onClick={handleAddComment}
        disabled={!newComment.trim()}
        className={`mt-2 py-2 px-4 border-none rounded text-sm transition-colors ${
          newComment.trim()
            ? "bg-blue-500 text-white cursor-pointer hover:bg-blue-600"
            : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
        }`}
      >
        Add Comment
      </button>
    </div>

    {/* Comments List */}
    {comments.length === 0 ? (
      <div className="text-center py-5 text-gray-500 dark:text-gray-400">
        No comments yet
      </div>
    ) : (
      comments.map((comment: any) => (
        <div
          key={comment._id}
          className="p-3 border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-700/50"
        >
          <div className="flex justify-between mb-2">
            <div>
              <span className="font-semibold text-sm text-gray-900 dark:text-white">
                {comment.user.name}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                {new Date(comment.createdAt).toLocaleString()}
                {comment.edited && " (edited)"}
              </span>
            </div>
            {comment.user._id === currentUserId && (
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
                className="w-full p-2 border border-blue-500 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="py-1.5 px-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 cursor-pointer text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm leading-relaxed text-gray-900 dark:text-white">
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
      <div className="text-center py-5 text-gray-500 dark:text-gray-400">
        No activity yet
      </div>
    ) : (
      activities.map((activity: any) => (
        <div
          key={activity._id}
          className="p-3 border-l-[3px] border-blue-500 bg-gray-100 dark:bg-gray-700"
        >
          <div className="text-sm mb-1 text-gray-900 dark:text-white">
            {formatActivityMessage(activity)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(activity.createdAt).toLocaleString()}
          </div>
        </div>
      ))
    )}
  </div>
);
