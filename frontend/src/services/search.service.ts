import api from "./api";
import type { Task } from "./task.service";

export interface SearchResults {
  projects: Array<{
    _id: string;
    name: string;
    description?: string;
    createdBy: {
      _id: string;
      name: string;
      email: string;
    };
    createdAt: string;
  }>;
  tasks: Task[];
}

export const search = async (
  query: string,
  type: "all" | "projects" | "tasks" = "all"
): Promise<SearchResults> => {
  const response = await api.get(`/search?query=${encodeURIComponent(query)}&type=${type}`);
  return response.data;
};
