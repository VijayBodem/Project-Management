import { useEffect, useState } from "react";
import AppRoutes from "./routes/AppRoutes";
import { getSocket } from "./services/socket";
import { ToastNotification, type Toast } from "./components/ToastNotification";
import type { Notification } from "./services/notification.service";

function App() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const getToastType = (notificationType: string): Toast["type"] => {
    switch (notificationType) {
      case "task_completed":
        return "success";
      case "task_unassigned":
        return "warning";
      case "task_assigned":
        return "info";
      default:
        return "info";
    }
  };

  useEffect(() => {
    // Listen for real-time notifications using the centralized socket connection
    const socket = getSocket();

    const handleNewNotification = (data: { notification: Notification; task: any }) => {
      console.log("📬 New notification received in App:", data);

      // Show toast notification
      const toast: Toast = {
        id: data.notification._id,
        title: data.notification.title,
        message: data.notification.message,
        type: getToastType(data.notification.type),
      };

      setToasts((prev) => [...prev, toast]);
    };

    socket.on("notification:new", handleNewNotification);

    return () => {
      socket.off("notification:new", handleNewNotification);
    };
  }, []);

  const handleRemoveToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <div className="page-container">
      <AppRoutes />
      <ToastNotification toasts={toasts} onRemove={handleRemoveToast} />
    </div>
  );
}

export default App;
