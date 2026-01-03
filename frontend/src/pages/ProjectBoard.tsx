import { useEffect, useState, useRef } from "react";
import { KanbanBoard } from "../components/KanbanBoard";
import { useParams, useNavigate } from "react-router-dom";
import {
  getProjectMembers,
  type ProjectMember,
} from "../services/member.service";
import { MemberManagementModal } from "../components/MemberManagementModal";
import { getCurrentUser } from "../services/user.service";
import { usePermissions } from "../hooks/usePermissions";
import { ProjectRole } from "../types/permissions";
import {
  getProjectTasks,
  createTask,
  assignTask,
  updateTaskStatus,
  deleteTask,
  type Task,
} from "../services/task.service";
import { updateProject, deleteProject } from "../services/project.service";
import { CreateTaskModal } from "../components/CreateTaskModal";
import { CreateProjectModal } from "../components/CreateProjectModal";
import { TaskDetailsModal } from "../components/TaskDetailsModal";
import { PresenceIndicator } from "../components/PresenceIndicator";
import { CollaborativeCursor } from "../components/CollaborativeCursor";
import { ToastNotification, type Toast } from "../components/ToastNotification";
import { useTaskRealtime } from "../hooks/useTaskRealtime";
import {
  joinProjectRoom,
  leaveProjectRoom,
  onUserJoined,
  onUserLeft,
  onCurrentViewers,
  emitCursorMove,
  onCursorUpdate,
  removeAllListeners,
} from "../services/socket";
import api from "../services/api";

interface Viewer {
  userId: string;
  userName: string;
}

interface Cursor {
  userId: string;
  userName: string;
  x: number;
  y: number;
}

export const ProjectBoard = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [userRole, setUserRole] = useState<ProjectRole | undefined>(undefined);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showTaskDetailsModal, setShowTaskDetailsModal] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");

  // Filters
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showUnassigned, setShowUnassigned] = useState(false);

  // Real-time collaboration
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [cursors, setCursors] = useState<Cursor[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const cursorThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Permissions
  const permissions = usePermissions({ userRole });

  // Real-time task updates using hook
  useTaskRealtime({
    projectId,
    onTaskCreated: (task) => {
      console.log("✨ Task created:", task);
      setTasks((prev) => [task, ...prev]);
      addToast({
        title: "New Task",
        message: `Task created: ${task.title}`,
        type: "info",
      });
    },
    onTaskUpdated: (task) => {
      console.log("📝 Task updated:", task);
      setTasks((prev) => prev.map((t) => (t._id === task._id ? task : t)));
      addToast({
        title: "Task Updated",
        message: `Task updated: ${task.title}`,
        type: "info",
      });
    },
    onTaskAssigned: (data) => {
      console.log("👤 Task assigned:", data);
      setTasks((prev) =>
        prev.map((t) => (t._id === data.task._id ? data.task : t))
      );
    },
    onTaskDeleted: (taskId) => {
      console.log("🗑️ Task deleted:", taskId);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      addToast({
        title: "Task Deleted",
        message: "A task was deleted",
        type: "warning",
      });
    },
  });

  useEffect(() => {
    fetchData();
  }, [projectId]);

  useEffect(() => {
    applyFilters();
  }, [tasks, filterAssignee, filterStatus, showUnassigned]);

  // Setup real-time listeners
  useEffect(() => {
    if (!projectId) return;

    // Join project room
    joinProjectRoom(projectId);

    // Presence events
    onUserJoined((data) => {
      console.log("User joined:", data);
      setViewers((prev) => [...prev, data]);
      addToast({
        title: "User Joined",
        message: `${data.userName} is now viewing`,
        type: "success",
      });
    });

    onUserLeft((data) => {
      console.log("User left:", data);
      setViewers((prev) => prev.filter((v) => v.userId !== data.userId));
      setCursors((prev) => prev.filter((c) => c.userId !== data.userId));
    });

    onCurrentViewers((data) => {
      console.log("Current viewers:", data);
      setViewers(data);
    });

    // Cursor events
    onCursorUpdate((data) => {
      setCursors((prev) => {
        const existing = prev.find((c) => c.userId === data.userId);
        if (existing) {
          return prev.map((c) =>
            c.userId === data.userId ? { ...c, x: data.x, y: data.y } : c
          );
        }
        return [...prev, data];
      });
    });

    // Cleanup
    return () => {
      leaveProjectRoom(projectId);
      removeAllListeners();
    };
  }, [projectId, currentUserId]);

  // Track cursor movement
  useEffect(() => {
    if (!projectId) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (cursorThrottleRef.current) return;

      cursorThrottleRef.current = setTimeout(() => {
        emitCursorMove(projectId, e.clientX, e.clientY);
        cursorThrottleRef.current = null;
      }, 50); // Throttle to 20 updates per second
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (cursorThrottleRef.current) {
        clearTimeout(cursorThrottleRef.current);
      }
    };
  }, [projectId]);

  const addToast = (toast: Omit<Toast, "id">) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchData = async () => {
    try {
      const [tasksData, membersData, userData] = await Promise.all([
        getProjectTasks(projectId!),
        getProjectMembers(projectId!),
        getCurrentUser(),
      ]);

      setTasks(tasksData.tasks);
      console.log("mebersDtatatat", membersData);
      setMembers(membersData.members);
      setCurrentUserId(userData.userId);

      const statsRes = await api.get(`/projects/${projectId}/stats`);
      setProjectName(statsRes.data.project.name);
      setProjectDescription(statsRes.data.project.description || "");
      setUserRole(statsRes.data.userRole);
    } catch (error: any) {
      console.error("Failed to fetch data:", error);
      addToast({
        title: "Error",
        message: error.response?.data?.message || "Failed to load project data",
        type: "error",
      });
    }
  };

  const applyFilters = () => {
    let filtered = [...tasks];

    if (showUnassigned) {
      filtered = filtered.filter(
        (t) => !t.assignedTo || t.assignedTo.length === 0
      );
    } else if (filterAssignee !== "all") {
      filtered = filtered.filter((t) =>
        t.assignedTo?.some((assignee) => assignee._id === filterAssignee)
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((t) => t.status === filterStatus);
    }

    setFilteredTasks(filtered);
  };

  const handleCreateTask = async (data: {
    title: string;
    description?: string;
    assignedTo?: string[];
    priority?: string;
    dueDate?: string;
  }) => {
    try {
      await createTask({
        ...data,
        project: projectId!,
      });
      await fetchData();
    } catch (error: any) {
      console.error("Failed to create task:", error);
      addToast({
        title: "Error",
        message: error.response?.data?.message || "Failed to create task",
        type: "error",
      });
    }
  };

  const handleStatusChange = async (
    taskId: string,
    newStatus: string,
    newPosition?: number
  ) => {
    // Optimistic update
    const taskToMove = tasks.find((t) => t._id === taskId);
    if (!taskToMove) return;

    const oldStatus = taskToMove.status;
    const oldPosition = taskToMove.position;

    // Update UI immediately (optimistic)
    setTasks((prev) => {
      const updated = prev.map((task) => {
        if (task._id === taskId) {
          return {
            ...task,
            status: newStatus as Task["status"],
            position: newPosition ?? task.position,
          };
        }
        return task;
      });

      // Sort by position within each status
      return updated.sort((a, b) => {
        if (a.status !== b.status) return 0;
        return a.position - b.position;
      });
    });

    try {
      // Send to server
      const updatedTask = await updateTaskStatus(
        taskId,
        newStatus,
        newPosition
      );

      // Update with server response
      setTasks((prev) =>
        prev.map((task) => (task._id === taskId ? updatedTask : task))
      );
    } catch (error) {
      console.error("Failed to update status:", error);

      // Revert on error
      setTasks((prev) =>
        prev.map((task) =>
          task._id === taskId
            ? { ...task, status: oldStatus, position: oldPosition }
            : task
        )
      );

      addToast({
        title: "Error",
        message: "Failed to update task status. Changes have been reverted.",
        type: "error",
      });
    }
  };

  const handleAssign = async (taskId: string, userIds: string[]) => {
    try {
      const updatedTask = await assignTask(taskId, userIds);
      setTasks((prev) =>
        prev.map((task) => (task._id === taskId ? updatedTask : task))
      );
    } catch (error: any) {
      console.error("Failed to assign task:", error);
      addToast({
        title: "Error",
        message: error.response?.data?.message || "Failed to assign task",
        type: "error",
      });
    }
  };

  const handleOpenDetails = (taskId: string) => {
    setSelectedTaskId(taskId);
    setShowTaskDetailsModal(true);
  };

  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((task) => (task._id === updatedTask._id ? updatedTask : task))
    );
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    } catch (error: any) {
      console.error("Failed to delete task:", error);
      addToast({
        title: "Error",
        message: error.response?.data?.message || "Failed to delete task",
        type: "error",
      });
    }
  };

  const clearFilters = () => {
    setFilterAssignee("all");
    setFilterStatus("all");
    setShowUnassigned(false);
  };

  const handleEditProject = async (data: {
    name: string;
    description?: string;
  }) => {
    try {
      await updateProject(projectId!, data);
      setProjectName(data.name);
      setProjectDescription(data.description || "");
      addToast({
        title: "Success",
        message: "Project updated successfully",
        type: "success",
      });
    } catch (error: any) {
      console.error("Failed to update project:", error);
      addToast({
        title: "Error",
        message: error.response?.data?.message || "Failed to update project",
        type: "error",
      });
    }
  };

  const handleDeleteProject = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this project? This action cannot be undone."
      )
    )
      return;

    try {
      await deleteProject(projectId!);
      addToast({
        title: "Success",
        message: "Project deleted successfully",
        type: "success",
      });
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Failed to delete project:", error);
      addToast({
        title: "Error",
        message: error.response?.data?.message || "Failed to delete project",
        type: "error",
      });
    }
  };

  const hasActiveFilters =
    filterAssignee !== "all" || filterStatus !== "all" || showUnassigned;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6 mb-8">
          <div className="flex items-start gap-6">
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
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                {projectName || "Project Board"}
              </h1>
              {projectDescription && (
                <p className="text-slate-600 text-lg">{projectDescription}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {permissions.canEditProject && (
                <button
                  onClick={() => setShowEditProjectModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-all"
                  title="Edit project"
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
                  Edit
                </button>
              )}
              {permissions.canDeleteProject && (
                <button
                  onClick={handleDeleteProject}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all"
                  title="Delete project"
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
                  Delete
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Presence Indicator */}
            <PresenceIndicator
              viewers={viewers}
              currentUserId={currentUserId}
            />

            {/* Member Avatars and Management */}
            <div className="flex items-center gap-4">
              <div className="flex">
                {members.slice(0, 3).map((member, index) => (
                  <div
                    key={member.user._id}
                    title={member.user.name}
                    className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-semibold border-2 border-white shadow-sm"
                    style={{ marginLeft: index > 0 ? "-8px" : "0" }}
                  >
                    {member.user.name.charAt(0).toUpperCase()}
                  </div>
                ))}
                {members.length > 3 && (
                  <div
                    className="w-10 h-10 rounded-full bg-slate-500 text-white flex items-center justify-center text-sm font-semibold border-2 border-white shadow-sm"
                    style={{ marginLeft: "-8px" }}
                  >
                    +{members.length - 3}
                  </div>
                )}
              </div>
              {permissions.canManageMembers && (
                <button
                  onClick={() => setShowMemberModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
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
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                    />
                  </svg>
                  Manage Members
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-slate-700">
                  Assignee:
                </label>
                <select
                  value={filterAssignee}
                  onChange={(e) => {
                    setFilterAssignee(e.target.value);
                    setShowUnassigned(false);
                  }}
                  className="px-4 py-2 text-sm border border-slate-300 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="all">All Assignees</option>
                  {members.map((member) => (
                    <option key={member.user._id} value={member.user._id}>
                      {member.user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-slate-700">
                  Status:
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

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showUnassigned}
                  onChange={(e) => {
                    setShowUnassigned(e.target.checked);
                    if (e.target.checked) setFilterAssignee("all");
                  }}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-sm font-medium text-slate-700">
                  Unassigned only
                </span>
              </label>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all"
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
                  Clear Filters
                </button>
              )}
            </div>

            {permissions.canCreateTask && (
              <button
                onClick={() => setShowTaskModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-sm hover:shadow-md"
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
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Create Task
              </button>
            )}
          </div>
        </div>

        {/* Task Count */}
        <div className="mb-6 text-sm text-slate-600 bg-slate-50 px-4 py-2 rounded-lg inline-block">
          Showing {filteredTasks.length} of {tasks.length} tasks
        </div>

        {/* Kanban Board */}
        <KanbanBoard
          tasks={filteredTasks}
          members={members}
          onStatusChange={handleStatusChange}
          onAssign={handleAssign}
          onDelete={handleDelete}
          onOpenDetails={handleOpenDetails}
          canDeleteTask={permissions.canDeleteTask}
        />

        {/* Modals */}
        <MemberManagementModal
          isOpen={showMemberModal}
          onClose={() => setShowMemberModal(false)}
          projectId={projectId!}
          userRole={userRole}
        />

        <CreateTaskModal
          isOpen={showTaskModal}
          onClose={() => setShowTaskModal(false)}
          onSubmit={handleCreateTask}
          members={members}
        />

        {selectedTaskId && (
          <TaskDetailsModal
            isOpen={showTaskDetailsModal}
            onClose={() => {
              setShowTaskDetailsModal(false);
              setSelectedTaskId(null);
            }}
            taskId={selectedTaskId}
            currentUserId={currentUserId}
            userRole={userRole}
            members={members}
            onTaskUpdate={handleTaskUpdate}
          />
        )}

        <CreateProjectModal
          isOpen={showEditProjectModal}
          onClose={() => setShowEditProjectModal(false)}
          onSubmit={handleEditProject}
          initialData={{ name: projectName, description: projectDescription }}
          title="Edit Project"
          submitButtonText="Update Project"
        />

        {/* Real-time collaboration features */}
        <CollaborativeCursor cursors={cursors} />
        <ToastNotification toasts={toasts} onRemove={removeToast} />
      </div>
    </div>
  );
};
