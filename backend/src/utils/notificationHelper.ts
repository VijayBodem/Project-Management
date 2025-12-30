/**
 * Notification Helper
 * 
 * Handles smart notification logic for task changes.
 * Determines who should be notified based on the actor and task ownership.
 */

import { Types } from "mongoose";
import { createNotification } from "./notifications";
import { NotificationType } from "../models/Notification.model";
import { emitToUser } from "../socket/events";

interface Task {
  _id: Types.ObjectId | string;
  title: string;
  status: string;
  project: Types.ObjectId | string;
  createdBy: Types.ObjectId | string;
  assignedTo?: Array<Types.ObjectId | { _id: Types.ObjectId | string }>;
}

interface NotificationOptions {
  task: Task;
  actorId: string;
  type: NotificationType;
  title: string;
  message: string;
  oldStatus?: string;
  newStatus?: string;
}

/**
 * Helper function to extract ID string from ObjectId or populated object
 */
const getIdString = (value: any): string => {
  if (typeof value === 'object' && value !== null && '_id' in value) {
    return value._id.toString();
  }
  return value.toString();
};

/**
 * Notify task owner and/or assigned users based on who made the change
 * 
 * Logic:
 * - If task owner makes change → notify all assigned users
 * - If assigned user makes change → notify task owner
 * - If someone else makes change → notify both owner and assigned users
 */
export const notifyTaskStatusChange = async (options: NotificationOptions) => {
  const { task, actorId, type, title, message } = options;
  
  const taskOwnerId = getIdString(task.createdBy);
  const assignedUserIds = (task.assignedTo || []).map(assignee => getIdString(assignee));
  
  const isOwner = actorId === taskOwnerId;
  const isAssignee = assignedUserIds.includes(actorId);
  
  const usersToNotify = new Set<string>();
  
  // Determine who to notify based on actor
  if (isOwner) {
    // Owner made the change → notify all assigned users
    assignedUserIds.forEach(userId => {
      if (userId !== actorId) { // Don't notify the actor
        usersToNotify.add(userId);
      }
    });
  } else if (isAssignee) {
    // Assigned user made the change → notify owner
    if (taskOwnerId !== actorId) { // Don't notify if owner is the actor
      usersToNotify.add(taskOwnerId);
    }
  } else {
    // Someone else made the change → notify both owner and assigned users
    if (taskOwnerId !== actorId) {
      usersToNotify.add(taskOwnerId);
    }
    assignedUserIds.forEach(userId => {
      if (userId !== actorId) {
        usersToNotify.add(userId);
      }
    });
  }
  
  // Send notifications to all relevant users
  for (const userId of usersToNotify) {
    const notification = await createNotification({
      userId,
      type,
      title,
      message,
      taskId: task._id.toString(),
      projectId: task.project.toString(),
      actorId,
    });
    
    // Emit real-time notification via Socket.IO
    emitToUser(userId, "notification:new", {
      notification,
      task: {
        _id: task._id,
        title: task.title,
        status: task.status,
      },
    });
  }
  
  return Array.from(usersToNotify);
};

/**
 * Notify about task assignment changes
 */
export const notifyTaskAssignment = async (
  task: Task,
  actorId: string,
  addedUserIds: string[],
  removedUserIds: string[]
) => {
  // Notify newly assigned users
  for (const userId of addedUserIds) {
    if (userId !== actorId) {
      const notification = await createNotification({
        userId,
        type: NotificationType.TASK_ASSIGNED,
        title: "Task Assigned",
        message: `You've been assigned to: ${task.title}`,
        taskId: task._id.toString(),
        projectId: task.project.toString(),
        actorId,
      });
      
      emitToUser(userId, "notification:new", {
        notification,
        task: {
          _id: task._id,
          title: task.title,
          status: task.status,
        },
      });
    }
  }
  
  // Notify removed users
  for (const userId of removedUserIds) {
    const notification = await createNotification({
      userId,
      type: NotificationType.TASK_UNASSIGNED,
      title: "Task Unassigned",
      message: `You've been unassigned from: ${task.title}`,
      taskId: task._id.toString(),
      projectId: task.project.toString(),
      actorId,
    });
    
    emitToUser(userId, "notification:new", {
      notification,
      task: {
        _id: task._id,
        title: task.title,
        status: task.status,
      },
    });
  }
};

/**
 * Notify about task creation
 */
export const notifyTaskCreation = async (
  task: Task,
  actorId: string
) => {
  const assignedUserIds = (task.assignedTo || []).map(assignee => getIdString(assignee));
  
  // Notify all assigned users (except the creator)
  for (const userId of assignedUserIds) {
    if (userId !== actorId) {
      const notification = await createNotification({
        userId,
        type: NotificationType.TASK_ASSIGNED,
        title: "Task Assigned",
        message: `You've been assigned to: ${task.title}`,
        taskId: task._id.toString(),
        projectId: task.project.toString(),
        actorId,
      });
      
      emitToUser(userId, "notification:new", {
        notification,
        task: {
          _id: task._id,
          title: task.title,
          status: task.status,
        },
      });
    }
  }
};

/**
 * Notify about task completion
 */
export const notifyTaskCompletion = async (
  task: Task,
  actorId: string
) => {
  await notifyTaskStatusChange({
    task,
    actorId,
    type: NotificationType.TASK_COMPLETED,
    title: "Task Completed",
    message: `Task marked as done: ${task.title}`,
    oldStatus: task.status,
    newStatus: "done",
  });
};

/**
 * Notify about task update (general)
 */
export const notifyTaskUpdate = async (
  task: Task,
  actorId: string,
  changeDescription: string
) => {
  await notifyTaskStatusChange({
    task,
    actorId,
    type: NotificationType.TASK_COMPLETED, // Reusing this type for general updates
    title: "Task Updated",
    message: `${changeDescription}: ${task.title}`,
  });
};
