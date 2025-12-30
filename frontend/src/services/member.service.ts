import api from "./api";
import { ProjectRole } from "../types/permissions";

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface ProjectMember {
  user: User;
  role: ProjectRole;
  joinedAt: string;
}

export const searchUsers = async (query: string): Promise<User[]> => {
  const response = await api.get(`/projects/search/users?query=${query}`);
  return response.data;
};

export const getProjectMembers = async (projectId: string) => {
  const response = await api.get(`/projects/${projectId}/members`);
  return response.data;
};

export const addMemberToProject = async (
  projectId: string,
  userId: string,
  role: ProjectRole = ProjectRole.MEMBER
) => {
  const response = await api.post(`/projects/${projectId}/members`, { userId, role });
  return response.data;
};

export const updateMemberRole = async (
  projectId: string,
  userId: string,
  role: ProjectRole
) => {
  const response = await api.patch(`/projects/${projectId}/members/${userId}/role`, { role });
  return response.data;
};

export const removeMemberFromProject = async (
  projectId: string,
  userId: string
) => {
  const response = await api.delete(`/projects/${projectId}/members/${userId}`);
  return response.data;
};

export const transferProjectOwnership = async (
  projectId: string,
  newOwnerId: string
) => {
  const response = await api.patch(`/projects/${projectId}/transfer`, {
    newOwnerId,
  });
  return response.data;
};
