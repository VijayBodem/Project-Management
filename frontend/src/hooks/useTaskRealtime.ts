/**
 * useTaskRealtime Hook
 *
 * Listens to real-time task events via Socket.IO and updates task list accordingly.
 * Handles task creation, updates, assignments, and deletions.
 */

import { useEffect, useCallback } from "react";
import { getSocket } from "../services/socket";
import type { Task } from "../services/task.service";

interface UseTaskRealtimeOptions {
  onTaskCreated?: (task: Task) => void;
  onTaskUpdated?: (task: Task) => void;
  onTaskAssigned?: (data: {
    task: Task;
    addedAssignees: string[];
    removedAssignees: string[];
  }) => void;
  onTaskDeleted?: (taskId: string) => void;
  projectId?: string; // Optional: Only listen to specific project
  userId?: string; // Optional: Filter for user-specific tasks
}

export const useTaskRealtime = (options: UseTaskRealtimeOptions = {}) => {
  const {
    onTaskCreated,
    onTaskUpdated,
    onTaskAssigned,
    onTaskDeleted,
    projectId,
    userId,
  } = options;

  const handleTaskCreated = useCallback(
    (data: { task: Task; createdBy: string }) => {
      console.log(
        "🆕 Task created:",
        data,
        "suser",
        userId,
        "proje",
        projectId
      );

      // If filtering by project, check if task belongs to project
      if (projectId && data.task.project !== projectId) {
        return;
      }

      // If filtering by user, check if user is assigned
      if (userId) {
        const isAssigned = data.task.assignedTo?.some(
          (assignee) => assignee._id === userId
        );
        if (!isAssigned) {
          return;
        }
      }

      if (onTaskCreated) {
        onTaskCreated(data.task);
      }
    },
    [onTaskCreated, projectId, userId]
  );

  const handleTaskUpdated = useCallback(
    (data: { task: Task; updatedBy: string; field: string }) => {
      console.log("📝 Task updated:", data);

      // If filtering by project, check if task belongs to project
      if (projectId && data.task.project !== projectId) {
        return;
      }

      // If filtering by user, check if user is assigned
      if (userId) {
        const isAssigned = data.task.assignedTo?.some(
          (assignee) => assignee._id === userId
        );
        if (!isAssigned) {
          // Task might have been unassigned from user, trigger removal
          if (onTaskDeleted) {
            onTaskDeleted(data.task._id);
          }
          return;
        }
      }

      if (onTaskUpdated) {
        onTaskUpdated(data.task);
      }
    },
    [onTaskUpdated, onTaskDeleted, projectId, userId]
  );

  const handleTaskAssigned = useCallback(
    (data: {
      task: Task;
      assignedBy: string;
      addedAssignees: string[];
      removedAssignees: string[];
    }) => {
      console.log("👤 Task assigned:", data);

      // If filtering by project, check if task belongs to project
      if (projectId && data.task.project !== projectId) {
        return;
      }

      // If filtering by user, handle assignment changes
      if (userId) {
        const wasAdded = data.addedAssignees.includes(userId);
        const wasRemoved = data.removedAssignees.includes(userId);

        if (wasAdded) {
          // User was added to task - add to list
          if (onTaskCreated) {
            onTaskCreated(data.task);
          }
        } else if (wasRemoved) {
          // User was removed from task - remove from list
          if (onTaskDeleted) {
            onTaskDeleted(data.task._id);
          }
        } else {
          // Assignment changed but user still assigned - update task
          const isStillAssigned = data.task.assignedTo?.some(
            (assignee) => assignee._id === userId
          );
          if (isStillAssigned && onTaskUpdated) {
            onTaskUpdated(data.task);
          }
        }
        return;
      }

      if (onTaskAssigned) {
        onTaskAssigned(data);
      }
    },
    [
      onTaskCreated,
      onTaskUpdated,
      onTaskDeleted,
      onTaskAssigned,
      projectId,
      userId,
    ]
  );

  const handleTaskDeleted = useCallback(
    (data: { taskId: string; deletedBy: string }) => {
      console.log("🗑️ Task deleted:", data);

      if (onTaskDeleted) {
        onTaskDeleted(data.taskId);
      }
    },
    [onTaskDeleted]
  );

  useEffect(() => {
    const socket = getSocket();

    // Listen to task events
    socket.on("task:created", handleTaskCreated);
    socket.on("task:updated", handleTaskUpdated);
    socket.on("task:assigned", handleTaskAssigned);
    socket.on("task:deleted", handleTaskDeleted);

    return () => {
      // Cleanup listeners
      socket.off("task:created", handleTaskCreated);
      socket.off("task:updated", handleTaskUpdated);
      socket.off("task:assigned", handleTaskAssigned);
      socket.off("task:deleted", handleTaskDeleted);
    };
  }, [
    handleTaskCreated,
    handleTaskUpdated,
    handleTaskAssigned,
    handleTaskDeleted,
  ]);
};
