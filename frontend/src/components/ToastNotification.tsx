import { useEffect, useState } from "react";

export interface Toast {
  id: string;
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
}

interface Props {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export const ToastNotification = ({ toasts, onRemove }: Props) => {
  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-[400px]">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

const ToastItem = ({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onRemove(toast.id), 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const getToastClasses = () => {
    switch (toast.type) {
      case "success":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      case "warning":
        return "bg-orange-500";
      default:
        return "bg-blue-500";
    }
  };

  return (
    <div
      className={`${getToastClasses()} text-white p-4 rounded-lg shadow-lg flex justify-between items-start gap-3 min-w-[300px] ${
        isExiting ? "animate-[slideOut_0.3s_ease-out]" : "animate-[slideIn_0.3s_ease-out]"
      }`}
    >
      <div className="flex-1">
        <div className="font-semibold mb-1">{toast.title}</div>
        <div className="text-sm opacity-90">{toast.message}</div>
      </div>
      <button
        onClick={() => {
          setIsExiting(true);
          setTimeout(() => onRemove(toast.id), 300);
        }}
        className="bg-transparent border-none text-white cursor-pointer text-xl p-0 leading-none hover:opacity-80 transition-opacity"
      >
        ×
      </button>
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(400px);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          @keyframes slideOut {
            from {
              transform: translateX(0);
              opacity: 1;
            }
            to {
              transform: translateX(400px);
              opacity: 0;
            }
          }
        `}
      </style>
    </div>
  );
};
