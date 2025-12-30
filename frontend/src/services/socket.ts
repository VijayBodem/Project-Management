import { io, Socket } from "socket.io-client";
import { getAccessToken } from "../utils/token";

let socket: Socket | null = null;

export const connectSocket = () => {
  const token = getAccessToken();

  console.log("token", token);

  socket = io(import.meta.env.VITE_API_SOCKET_URL, {
    auth: { token },
  });

  socket.on("connect", () => {
    console.log("🔌 Socket connected:", socket?.id);
    socket?.emit("socket:ready");
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected");
  });

  return socket;
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};

export const getSocket = () => {
  if (!socket) {
    socket = io(import.meta.env.VITE_API_SOCKET_URL || "http://localhost:5000", {
      autoConnect: false,
    });
  }
  return socket;
};

export const listenToNotifications = (callback: (data: any) => void) => {
  socket?.on("notification", callback);
};

// Project room management
export const joinProjectRoom = (projectId: string) => {
  socket?.emit("project:join", projectId);
};

export const leaveProjectRoom = (projectId: string) => {
  socket?.emit("project:leave", projectId);
};

// Task event listeners
export const onTaskCreated = (callback: (data: any) => void) => {
  socket?.on("task:created", callback);
};

export const onTaskUpdated = (callback: (data: any) => void) => {
  socket?.on("task:updated", callback);
};

export const onTaskAssigned = (callback: (data: any) => void) => {
  socket?.on("task:assigned", callback);
};

export const onTaskDeleted = (callback: (data: any) => void) => {
  socket?.on("task:deleted", callback);
};

// Presence listeners
export const onUserJoined = (callback: (data: any) => void) => {
  socket?.on("project:user-joined", callback);
};

export const onUserLeft = (callback: (data: any) => void) => {
  socket?.on("project:user-left", callback);
};

export const onCurrentViewers = (callback: (data: any) => void) => {
  socket?.on("project:current-viewers", callback);
};

// Cursor tracking
export const emitCursorMove = (projectId: string, x: number, y: number) => {
  socket?.emit("cursor:move", { projectId, x, y });
};

export const onCursorUpdate = (callback: (data: any) => void) => {
  socket?.on("cursor:update", callback);
};

// Cleanup listeners
export const removeAllListeners = () => {
  socket?.off("task:created");
  socket?.off("task:updated");
  socket?.off("task:assigned");
  socket?.off("task:deleted");
  socket?.off("project:user-joined");
  socket?.off("project:user-left");
  socket?.off("project:current-viewers");
  socket?.off("cursor:update");
};
