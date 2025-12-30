import api from "./api";

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: "todo" | "in-progress" | "done";
  priority?: "low" | "medium" | "high" | "urgent";
  dueDate?: string;
  position: number;
  project: string | { _id: string; name: string };
  assignedTo?: Array<{
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  }>;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface TaskResponse {
  success: boolean;
  tasks: Task[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateTaskData {
  title: string;
  description?: string;
  project: string;
  assignedTo?: string[]; // Changed to array
  priority?: string;
  dueDate?: string;
}

export const createTask = async (data: CreateTaskData): Promise<Task> => {
  const response = await api.post("/tasks", data);
  return response.data;
};

export const getProjectTasks = async (
  projectId: string,
  filters?: {
    assignedTo?: string;
    status?: string;
    unassigned?: boolean;
  }
): Promise<TaskResponse> => {
  const params = new URLSearchParams();
  if (filters?.assignedTo) params.append("assignedTo", filters.assignedTo);
  if (filters?.status) params.append("status", filters.status);
  if (filters?.unassigned) params.append("unassigned", "true");

  const response = await api.get(
    `/tasks/project/${projectId}?${params.toString()}`
  );
  return response.data;
};

export const getMyTasks = async (status?: string): Promise<TaskResponse> => {
  const params = status ? `?status=${status}` : "";
  const response = await api.get(`/tasks/my-tasks${params}`);
  return response.data;
};

export const assignTask = async (
  taskId: string,
  assignedTo: string[] // Changed to array
): Promise<Task> => {
  const response = await api.patch(`/tasks/${taskId}/assign`, { assignedTo });
  return response.data;
};

export const updateTaskStatus = async (
  taskId: string,
  status: string,
  position?: number
): Promise<Task> => {
  const response = await api.patch(`/tasks/${taskId}/status`, { status, position });
  return response.data.task;
};

export const updateTask = async (
  taskId: string,
  data: {
    title?: string;
    description?: string;
    priority?: string;
    dueDate?: string | null;
  }
): Promise<Task> => {
  const response = await api.patch(`/tasks/${taskId}`, data);
  return response.data;
};

export const getTaskById = async (taskId: string): Promise<Task> => {
  const response = await api.get(`/tasks/${taskId}`);
  return response.data;
};

export const deleteTask = async (taskId: string): Promise<void> => {
  await api.delete(`/tasks/${taskId}`);
};
