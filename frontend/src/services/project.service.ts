import api from "./api";

export interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  completionPercentage: number;
}

export interface DashboardProject {
  _id: string;
  name: string;
  description?: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  memberCount: number;
  updatedAt: string;
  stats: ProjectStats;
}

interface DashboardResponse {
  success: boolean;
  projects: DashboardProject[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}


export const getDashboardProjects = async (): Promise<DashboardResponse> => {
  const response = await api.get("/projects/dashboard/overview");
  return response.data;
};

export const createProject = async (data: {
  name: string;
  description?: string;
}) => {
  const response = await api.post("/projects", data);
  return response.data;
};

export const getProjectStats = async (projectId: string) => {
  const response = await api.get(`/projects/${projectId}/stats`);
  return response.data;
};

export const updateProject = async (
  projectId: string,
  data: {
    name?: string;
    description?: string;
  }
) => {
  const response = await api.patch(`/projects/${projectId}`, data);
  return response.data;
};

export const deleteProject = async (projectId: string) => {
  const response = await api.delete(`/projects/${projectId}`);
  return response.data;
};
