import { getIO } from "./index";

export const emitToUser = (userId: string, event: string, payload: any) => {
  const io = getIO();
  io.to(`user:${userId}`).emit(event, payload);
};

export const emitToUserExceptSession = (
  userId: string,
  exceptSessionToken: string,
  event: string,
  payload: any
) => {
  const io = getIO();

  console.log(
    `👥 emitToUserExceptSession: userId=${userId}, exceptSessionToken=${exceptSessionToken}`
  );
  console.log(`👥 Total connected sockets: ${io.sockets.sockets.size}`);

  // Get all sockets in the user's room
  const userRoom = io.sockets.adapter.rooms.get(`user:${userId}`);
  console.log(
    `👥 User room exists: ${!!userRoom}, room size: ${userRoom?.size || 0}`
  );

  if (!userRoom) return;

  let emittedCount = 0;
  let excludedCount = 0;

  // Emit to all sockets in user's room except those with the specified session token
  for (const socketId of userRoom) {
    const socket = io.sockets.sockets.get(socketId);
    console.log(
      `👥 Checking socket ${socketId}: sessionToken=${socket?.data?.sessionToken}`
    );

    if (socket && socket.data.sessionToken !== exceptSessionToken) {
      console.log(`✅ Emitting ${event} to socket ${socketId}`);
      socket.emit(event, payload);
      emittedCount++;
    } else {
      console.log(
        `❌ Excluding socket ${socketId} (matches exceptSessionToken)`
      );
      excludedCount++;
    }
  }

  console.log(
    `📤 Emitted ${event} to ${emittedCount} sockets, excluded ${excludedCount} sockets`
  );
};

export const emitToSession = (
  sessionToken: string,
  event: string,
  payload: any
) => {
  const io = getIO();

  console.log(`🔍 emitToSession: Looking for session token: ${sessionToken}`);
  console.log(`🔍 Total connected sockets: ${io.sockets.sockets.size}`);

  let foundSockets = 0;

  console.log("io.sockets.sockets", io.sockets.sockets);

  // Emit to ALL sockets with matching session token (handles multiple tabs)
  for (const [socketId, socket] of io.sockets.sockets) {
    console.log("socketId", socketId, "sockets", socket);
    if (socket.data.sessionToken === sessionToken) {
      console.log(
        `✅ Found matching socket ${socketId} for session ${sessionToken}`
      );
      socket.emit(event, payload);
      foundSockets++;
    }
  }

  console.log(
    `📤 Emitted ${event} to ${foundSockets} socket(s) for session ${sessionToken}`
  );
};

export const emitToGlobal = (event: string, payload: any) => {
  const io = getIO();
  io.to("global").emit(event, payload);
};

export const emitToProject = (
  projectId: string,
  event: string,
  payload: any
) => {
  const io = getIO();
  io.to(`project:${projectId}`).emit(event, payload);
};

export const emitToProjectExcept = (
  projectId: string,
  socketId: string,
  event: string,
  payload: any
) => {
  const io = getIO();
  io.to(`project:${projectId}`).except(socketId).emit(event, payload);
};
