import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getMyTasks,
  updateTaskStatus,
  type Task,
} from "../services/task.service";
import { useTaskRealtime } from "../hooks/useTaskRealtime";
import { getCurrentUser } from "../services/user.service";

export const MyTasks = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  // Fetch current user ID
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUserId(user.userId);
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };
    fetchUser();
  }, []);

  // Real-time task updates
  useTaskRealtime({
    userId: currentUserId,
    onTaskCreated: (task) => {
      console.log("✨ New task assigned to me:", task);
      // Add task to list if it matches current filter
      if (filterStatus === "all" || task.status === filterStatus) {
        setTasks((prev) => [task, ...prev]);
      }
    },
    onTaskUpdated: (task) => {
      console.log("📝 My task updated:", task);
      // Update task in list
      setTasks((prev) => prev.map((t) => (t._id === task._id ? task : t)));

      // Remove from list if status no longer matches filter
      if (filterStatus !== "all" && task.status !== filterStatus) {
        setTasks((prev) => prev.filter((t) => t._id !== task._id));
      }
    },
    onTaskDeleted: (taskId) => {
      console.log("🗑️ Task removed from my list:", taskId);
      // Remove task from list
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    },
  });

  useEffect(() => {
    fetchTasks();
  }, [filterStatus]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await getMyTasks(
        filterStatus !== "all" ? filterStatus : undefined
      );
      console.log("dataaaaa", data);
      setTasks(data?.tasks);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await updateTaskStatus(taskId, newStatus);
      setTasks((prev) =>
        prev.map((task) =>
          task._id === taskId
            ? { ...task, status: newStatus as Task["status"] }
            : task
        )
      );
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  // Status colors are now handled inline in the JSX for better consistency

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "todo":
        return "To Do";
      case "in-progress":
        return "In Progress";
      case "done":
        return "Done";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-block w-6 h-6 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin mx-auto" />
          <p className="text-slate-600">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8 pb-6 border-b border-slate-200">
          <div className="space-y-2">
            <button
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-all"
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-slate-900">My Tasks</h1>
            <p className="text-slate-600 text-lg">
              Tasks assigned to you across all projects
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-slate-700">
                Filter by status:
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 text-sm border border-slate-300 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="all">All Statuses</option>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>
        </div>

        {/* Task Count */}
        <div className="mb-6 text-sm text-slate-600 bg-slate-50 px-4 py-2 rounded-lg inline-block">
          {tasks.length} {tasks.length === 1 ? "task" : "tasks"} assigned to you
        </div>

        {/* Tasks List */}
        {tasks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 md:p-16 text-center shadow-sm">
            <div className="space-y-6">
              <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto">
                <svg
                  className="w-10 h-10 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-slate-900">
                  No tasks assigned
                </h3>
                <p className="text-slate-600 text-lg max-w-lg mx-auto leading-relaxed">
                  You don't have any tasks assigned to you yet. Tasks will
                  appear here when they're assigned to you.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task._id}
                className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
                onClick={() => {
                  const projectId =
                    typeof task.project === "string"
                      ? task.project
                      : task.project._id;
                  navigate(`/projects/${projectId}`);
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-blue-700 transition-colors">
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-slate-500">
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
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                      </svg>
                      <span>
                        {typeof task.project === "string"
                          ? task.project
                          : task?.project?.name}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3 flex-shrink-0">
                    <div
                      className={`px-3 py-1.5 rounded-full text-white text-xs font-semibold text-center ${
                        task.status === "todo"
                          ? "bg-red-500"
                          : task.status === "in-progress"
                          ? "bg-blue-500"
                          : task.status === "done"
                          ? "bg-green-500"
                          : "bg-slate-500"
                      }`}
                    >
                      {getStatusLabel(task.status)}
                    </div>

                    <select
                      value={task.status}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleStatusChange(task._id, e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="todo">To Do</option>
                      <option value="in-progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
