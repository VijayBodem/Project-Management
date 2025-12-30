import api from "./api";

export interface Activity {
  _id: string;
  task: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  type: string;
  details: any;
  createdAt: string;
}

export const getTaskActivities = async (taskId: string): Promise<Activity[]> => {
  const response = await api.get(`/activities/task/${taskId}`);
  return response.data;
};
