import api from "./api";

export interface Comment {
  _id: string;
  task: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  content: string;
  edited: boolean;
  createdAt: string;
  updatedAt: string;
}

export const getTaskComments = async (taskId: string): Promise<Comment[]> => {
  const response = await api.get(`/comments/task/${taskId}`);
  return response.data;
};

export const addComment = async (
  taskId: string,
  content: string
): Promise<Comment> => {
  const response = await api.post("/comments", { taskId, content });
  return response.data;
};

export const updateComment = async (
  commentId: string,
  content: string
): Promise<Comment> => {
  const response = await api.patch(`/comments/${commentId}`, { content });
  return response.data;
};

export const deleteComment = async (commentId: string): Promise<void> => {
  await api.delete(`/comments/${commentId}`);
};
