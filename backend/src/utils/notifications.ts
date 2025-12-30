import { Notification, NotificationType } from "../models/Notification.model";
import { emitToUser } from "../socket/events";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  taskId?: string;
  projectId?: string;
  commentId?: string;
  actorId?: string;
}

export const createNotification = async (params: CreateNotificationParams) => {
  try {
    const notification = await Notification.create({
      user: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      task: params.taskId,
      project: params.projectId,
      comment: params.commentId,
      actor: params.actorId,
    });

    const populatedNotification = await Notification.findById(notification._id)
      .populate("actor", "name email")
      .populate("task", "title")
      .populate("project", "name");

    // Emit real-time notification
    emitToUser(params.userId, "notification", populatedNotification);

    return populatedNotification;
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
};
