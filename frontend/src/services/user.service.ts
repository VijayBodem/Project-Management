import api from "./api";

export interface CurrentUser {
  userId: string;
  role: string;
}

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  bio?: string;
  preferences: {
    theme: "light" | "dark" | "system";
    emailNotifications: boolean;
    pushNotifications: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileData {
  name?: string;
  bio?: string;
  avatar?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdatePreferencesData {
  theme?: "light" | "dark" | "system";
  emailNotifications?: boolean;
  pushNotifications?: boolean;
}

export const getCurrentUser = async (): Promise<CurrentUser> => {
  const response = await api.get("/protected/profile");
  return response.data.user;
};

export const getUserProfile = async (): Promise<UserProfile> => {
  const response = await api.get("/users/profile");
  return response.data.user;
};

export const updateUserProfile = async (data: UpdateProfileData): Promise<UserProfile> => {
  const response = await api.patch("/users/profile", data);
  return response.data.user;
};

export const changePassword = async (data: ChangePasswordData): Promise<void> => {
  await api.post("/users/change-password", data);
};

export const updateUserPreferences = async (data: UpdatePreferencesData): Promise<UserProfile["preferences"]> => {
  const response = await api.patch("/users/preferences", data);
  return response.data.preferences;
};

export const getUserById = async (userId: string): Promise<Partial<UserProfile>> => {
  const response = await api.get(`/users/${userId}`);
  return response.data.user;
};
