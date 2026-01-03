import { io, Socket } from "socket.io-client";
import { getAccessToken } from "../utils/token";

let socket: Socket | null = null;
let isConnecting = false;

export const connectSocket = () => {
  // If already connected, return existing socket
  if (socket?.connected) {
    console.log("🔌 Socket already connected, returning existing connection");
    return socket;
  }

  // If currently connecting, wait for connection to complete
  if (isConnecting && socket) {
    console.log("🔌 Socket connection in progress, returning existing instance");
    return socket;
  }

  const token = getAccessToken();

  console.log("🔌 Creating new socket connection", { token: !!token });

  isConnecting = true;

  socket = io(import.meta.env.VITE_API_SOCKET_URL || "http://localhost:5000", {
    auth: { token },
    autoConnect: true,
  });

  socket.on("connect", () => {
    console.log("🔌 Socket connected:", socket?.id);
    isConnecting = false;
    socket?.emit("socket:ready");
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected");
    isConnecting = false;
  });

  socket.on("connect_error", (error) => {
    console.error("❌ Socket connection error:", error);
    isConnecting = false;
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    console.log("🔌 Disconnecting socket");
    socket.disconnect();
    socket = null;
    isConnecting = false;
  }
};

export const getSocket = () => {
  if (!socket) {
    console.log("🔌 Creating socket instance (not connecting)");
    socket = io(import.meta.env.VITE_API_SOCKET_URL || "http://localhost:5000", {
      autoConnect: false,
    });
  }
  return socket;
};

export const isSocketConnected = () => {
  return socket?.connected || false;
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
