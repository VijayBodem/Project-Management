import api from "./api";

export interface Notification {
  _id: string;
  user: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  task?: {
    _id: string;
    title: string;
  };
  project?: {
    _id: string;
    name: string;
  };
  actor?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

export const getNotifications = async (unreadOnly = false): Promise<Notification[]> => {
  const params = unreadOnly ? "?unreadOnly=true" : "";
  const response = await api.get(`/notifications${params}`);
  return response.data;
};

export const getUnreadCount = async (): Promise<number> => {
  const response = await api.get("/notifications/unread-count");
  return response.data.count;
};

export const markAsRead = async (notificationId: string): Promise<Notification> => {
  const response = await api.patch(`/notifications/${notificationId}/read`);
  return response.data;
};

export const markAllAsRead = async (): Promise<void> => {
  await api.patch("/notifications/mark-all-read");
};

export const deleteNotification = async (notificationId: string): Promise<void> => {
  await api.delete(`/notifications/${notificationId}`);
};

export const clearReadNotifications = async (): Promise<void> => {
  await api.delete("/notifications/clear-read");
};
