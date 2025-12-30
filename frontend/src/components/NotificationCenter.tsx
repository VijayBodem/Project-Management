import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearReadNotifications,
  type Notification,
} from "../services/notification.service";
import { getSocket } from "../services/socket";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNewNotification?: (notification: Notification) => void;
}

export const NotificationCenter = ({ isOpen, onClose, onNewNotification }: Props) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  // Listen for real-time notifications
  useEffect(() => {
    const socket = getSocket();
    
    const handleNewNotification = (data: { notification: Notification; task: any }) => {
      console.log("📬 New notification received:", data);
      
      // Add to notifications list
      setNotifications((prev) => [data.notification, ...prev]);
      
      // Call callback for toast notification
      if (onNewNotification) {
        onNewNotification(data.notification);
      }
    };
    
    socket.on("notification:new", handleNewNotification);
    
    return () => {
      socket.off("notification:new", handleNewNotification);
    };
  }, [onNewNotification]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await getNotifications(filter === "unread");
      setNotifications(data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const handleClearRead = async () => {
    if (!confirm("Clear all read notifications?")) return;

    try {
      await clearReadNotifications();
      setNotifications((prev) => prev.filter((n) => !n.read));
    } catch (error) {
      console.error("Failed to clear notifications:", error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification._id);
    }

    if (notification.task) {
      const projectId =
        typeof notification.project === "string"
          ? notification.project
          : notification.project?._id;
      if (projectId) {
        navigate(`/projects/${projectId}`);
        onClose();
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "task_assigned":
        return "📋";
      case "task_unassigned":
        return "❌";
      case "task_completed":
        return "✅";
      case "task_comment":
        return "💬";
      case "project_invite":
        return "👥";
      default:
        return "🔔";
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 right-0 bottom-0 w-[400px] bg-white dark:bg-gray-800 shadow-[-2px_0_8px_rgba(0,0,0,0.1)] dark:shadow-[-2px_0_8px_rgba(0,0,0,0.3)] z-[1002] flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h2 className="m-0 text-xl text-gray-900 dark:text-white">Notifications</h2>
        <button
          onClick={onClose}
          className="border-none bg-transparent cursor-pointer text-2xl text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          ×
        </button>
      </div>

      {/* Filter and Actions */}
      <div className="py-3 px-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`py-1.5 px-3 border-none rounded text-xs cursor-pointer transition-colors ${
              filter === "all"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`py-1.5 px-3 border-none rounded text-xs cursor-pointer transition-colors ${
              filter === "unread"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            Unread
          </button>
        </div>

        <div className="flex gap-2">
          {notifications.some((n) => !n.read) && (
            <button
              onClick={handleMarkAllAsRead}
              className="py-1.5 px-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 cursor-pointer text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Mark all read
            </button>
          )}
          {notifications.some((n) => n.read) && (
            <button
              onClick={handleClearRead}
              className="py-1.5 px-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 cursor-pointer text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Clear read
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="py-10 text-center text-gray-500 dark:text-gray-400">
            Loading...
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-10 text-center text-gray-500 dark:text-gray-400">
            {filter === "unread"
              ? "No unread notifications"
              : "No notifications yet"}
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification._id}
              onClick={() => handleNotificationClick(notification)}
              className={`py-4 px-5 border-b border-gray-100 dark:border-gray-700 cursor-pointer relative transition-colors ${
                notification.read
                  ? "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                  : "bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30"
              }`}
            >
              <div className="flex gap-3">
                <div className="text-2xl">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <div className={`text-sm mb-1 ${notification.read ? "font-normal" : "font-semibold"} text-gray-900 dark:text-white`}>
                    {notification.title}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {notification.message}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 flex justify-between items-center">
                    <span>{formatTime(notification.createdAt)}</span>
                    {notification.actor && (
                      <span>by {notification.actor.name}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(notification._id);
                  }}
                  className="border-none bg-transparent cursor-pointer text-gray-500 dark:text-gray-400 text-base p-0 px-1 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  title="Delete"
                >
                  ×
                </button>
              </div>
              {!notification.read && (
                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
