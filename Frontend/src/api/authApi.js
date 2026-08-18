import axiosInstance from "./axios";

export const loginApi = async (credentials) => {
  const response = await axiosInstance.post("/api/auth/login", credentials);
  return response.data;
};

export const logoutApi = async () => {
  const response = await axiosInstance.post("/api/auth/logout");
  return response.data;
};

export const getMeApi = async () => {
  const response = await axiosInstance.get("/api/auth/me");
  return response.data;
};
