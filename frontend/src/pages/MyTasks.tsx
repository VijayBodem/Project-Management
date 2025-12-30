import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyTasks, updateTaskStatus, type Task } from "../services/task.service";
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
      setTasks((prev) =>
        prev.map((t) => (t._id === task._id ? task : t))
      );
      
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
      console.log('dataaaaa', data)
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

  const getStatusClass = (status: string) => {
    switch (status) {
      case "todo":
        return "bg-red-500";
      case "in-progress":
        return "bg-orange-500";
      case "done":
        return "bg-green-500";
      default:
        return "bg-gray-400";
    }
  };

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
      <div className="p-5 text-center">
        <p className="text-gray-600 dark:text-gray-400">Loading your tasks...</p>
      </div>
    );
  }

  return (
    <div className="p-5 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer text-sm mb-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            ← Back to Dashboard
          </button>
          <h1 className="m-0 mb-2 text-3xl font-bold text-gray-900 dark:text-white">My Tasks</h1>
          <p className="m-0 text-gray-600 dark:text-gray-400">
            Tasks assigned to you across all projects
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-5 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <label className="mr-3 text-sm text-gray-700 dark:text-gray-300">
          Filter by status:
        </label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </div>

      {/* Task Count */}
      <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        {tasks.length} {tasks.length === 1 ? "task" : "tasks"} assigned to you
      </div>

      {/* Tasks List */}
      {tasks.length === 0 ? (
        <div className="text-center py-15 px-5 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="m-0 mb-3 text-gray-600 dark:text-gray-400 text-lg">
            No tasks assigned
          </h3>
          <p className="m-0 text-gray-500 dark:text-gray-500">
            You don't have any tasks assigned to you yet
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {tasks.map((task) => (
            <div
              key={task._id}
              className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                const projectId =
                  typeof task.project === "string"
                    ? task.project
                    : task.project._id;
                navigate(`/projects/${projectId}`);
              }}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="m-0 mb-2 text-base font-semibold text-gray-900 dark:text-white">
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="m-0 mb-2 text-sm text-gray-600 dark:text-gray-400">
                      {task.description}
                    </p>
                  )}
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    Project:{" "}
                    {typeof task.project === "string"
                      ? task.project
                      : task.project.name}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div
                    className={`px-3 py-1 rounded-full text-white text-xs font-semibold text-center ${getStatusClass(
                      task.status
                    )}`}
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
                    className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
  );
};
