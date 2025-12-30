import { useEffect, useState, useRef } from "react";
import { KanbanBoard } from "../components/KanbanBoard";
import { useParams, useNavigate } from "react-router-dom";
import { getProjectMembers, type ProjectMember } from "../services/member.service";
import { MemberManagementModal } from "../components/MemberManagementModal";
import { getCurrentUser } from "../services/user.service";
import {
  getProjectTasks,
  createTask,
  assignTask,
  updateTaskStatus,
  deleteTask,
  type Task,
} from "../services/task.service";
import { CreateTaskModal } from "../components/CreateTaskModal";
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
  const [projectCreatorId, setProjectCreatorId] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showTaskDetailsModal, setShowTaskDetailsModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  
  // Filters
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showUnassigned, setShowUnassigned] = useState(false);

  // Real-time collaboration
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [cursors, setCursors] = useState<Cursor[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const cursorThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      setTasks((prev) =>
        prev.map((t) => (t._id === task._id ? task : t))
      );
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
            c.userId === data.userId
              ? { ...c, x: data.x, y: data.y }
              : c
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
      console.log('mebersDtatatat', membersData)
      setMembers(membersData.members);
      setProjectCreatorId(membersData.createdBy._id);
      setCurrentUserId(userData.userId);

      const statsRes = await api.get(`/projects/${projectId}/stats`);
      setProjectName(statsRes.data.project.name);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };

  const applyFilters = () => {
    let filtered = [...tasks];

    if (showUnassigned) {
      filtered = filtered.filter((t) => !t.assignedTo || t.assignedTo.length === 0);
    } else if (filterAssignee !== "all") {
      filtered = filtered.filter((t) => 
        t.assignedTo?.some(assignee => assignee._id === filterAssignee)
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
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string, newPosition?: number) => {
    // Optimistic update
    const taskToMove = tasks.find(t => t._id === taskId);
    if (!taskToMove) return;

    const oldStatus = taskToMove.status;
    const oldPosition = taskToMove.position;

    // Update UI immediately (optimistic)
    setTasks((prev) => {
      const updated = prev.map((task) => {
        if (task._id === taskId) {
          return { ...task, status: newStatus as Task["status"], position: newPosition ?? task.position };
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
      const updatedTask = await updateTaskStatus(taskId, newStatus, newPosition);
      
      // Update with server response
      setTasks((prev) =>
        prev.map((task) => (task._id === taskId ? updatedTask : task))
      );
    } catch (error) {
      console.error("Failed to update status:", error);
      
      // Revert on error
      setTasks((prev) =>
        prev.map((task) =>
          task._id === taskId ? { ...task, status: oldStatus, position: oldPosition } : task
        )
      );
      
      addToast({
        title: "Error",
        message: "Failed to update task status",
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
    }
  };

  const clearFilters = () => {
    setFilterAssignee("all");
    setFilterStatus("all");
    setShowUnassigned(false);
  };

  const hasActiveFilters =
    filterAssignee !== "all" || filterStatus !== "all" || showUnassigned;

  return (
    <div className="p-5 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <button
            onClick={() => navigate("/dashboard")}
            className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 cursor-pointer text-sm mb-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            ← Back to Dashboard
          </button>
          <h1 className="m-0 mb-2 text-3xl text-gray-900 dark:text-white">
            {projectName || "Project Board"}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Presence Indicator */}
          <PresenceIndicator viewers={viewers} currentUserId={currentUserId} />

          {/* Member Avatars */}
          <div className="flex items-center gap-2">
            <div className="flex mr-2">
              {members.slice(0, 3).map((member, index) => (
                <div
                  key={member.user._id}
                  title={member.user.name}
                  className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-semibold border-2 border-white dark:border-gray-900 cursor-pointer"
                  style={{ marginLeft: index > 0 ? "-8px" : "0" }}
                >
                  {member.user.name.charAt(0).toUpperCase()}
                </div>
              ))}
              {members.length > 3 && (
                <div
                  className="w-8 h-8 rounded-full bg-gray-600 text-white flex items-center justify-center text-[11px] font-semibold border-2 border-white dark:border-gray-900"
                  style={{ marginLeft: "-8px" }}
                >
                  +{members.length - 3}
                </div>
              )}
            </div>
            <button
              onClick={() => setShowMemberModal(true)}
              className="py-2 px-4 border border-blue-500 rounded bg-white dark:bg-gray-800 text-blue-500 cursor-pointer text-sm font-medium hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
            >
              Manage Members
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="flex justify-between items-center mb-5 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700">
        <div className="flex gap-3 items-center">
          <select
            value={filterAssignee}
            onChange={(e) => {
              setFilterAssignee(e.target.value);
              setShowUnassigned(false);
            }}
            className="py-2 px-3 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Assignees</option>
            {members.map((member) => (
              <option key={member.user._id} value={member.user._id}>
                {member.user.name}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="py-2 px-3 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showUnassigned}
              onChange={(e) => {
                setShowUnassigned(e.target.checked);
                if (e.target.checked) setFilterAssignee("all");
              }}
              className="cursor-pointer"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Unassigned only</span>
          </label>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="py-2 px-3 border border-red-500 rounded bg-white dark:bg-gray-800 text-red-500 cursor-pointer text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>

        <button
          onClick={() => setShowTaskModal(true)}
          className="py-2.5 px-5 border-none rounded bg-blue-500 text-white cursor-pointer text-sm font-medium hover:bg-blue-600 transition-colors"
        >
          + Create Task
        </button>
      </div>

      {/* Task Count */}
      <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
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
      />

      {/* Modals */}
      <MemberManagementModal
        isOpen={showMemberModal}
        onClose={() => setShowMemberModal(false)}
        projectId={projectId!}
        projectCreatorId={projectCreatorId}
        currentUserId={currentUserId}
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
          onTaskUpdate={handleTaskUpdate}
        />
      )}

      {/* Real-time collaboration features */}
      <CollaborativeCursor cursors={cursors} />
      <ToastNotification toasts={toasts} onRemove={removeToast} />
    </div>
  );
};
