import { getIO } from "./index";

export const emitToUser = (userId: string, event: string, payload: any) => {
  const io = getIO();
  io.to(`user:${userId}`).emit(event, payload);
};

export const emitToGlobal = (event: string, payload: any) => {
  const io = getIO();
  io.to("global").emit(event, payload);
};

export const emitToProject = (projectId: string, event: string, payload: any) => {
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
