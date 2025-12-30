import { getRefreshToken } from "../utils/token";
import api from "./api";

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export const loginUser = async (data: LoginData) => {
  const response = await api.post("/auth/login", data);
  return response.data;
};

export const registerUser = async (data: RegisterData) => {
  const response = await api.post("/auth/register", data);
  return response;
};

export const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  const response = await api.post("/token/refresh", { refreshToken });
  
  // Store new tokens from rotation
  if (response.data.refreshToken) {
    localStorage.setItem("refreshToken", response.data.refreshToken);
  }
  
  return response.data;
};

export const logoutUser = async () => {
  const refreshToken = getRefreshToken();
  await api.post("/token/logout", { refreshToken });
  
  // Clear tokens
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
};

export const logoutAllDevices = async () => {
  await api.post("/token/logout-all");
  
  // Clear tokens
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
};
