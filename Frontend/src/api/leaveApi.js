import axiosInstance from "./axios";

export const getLeaveApi = async (params = {}) => {
  const response = await axiosInstance.get("/api/leave", { params });
  return response.data;
};

export const applyLeaveApi = async (data) => {
  const response = await axiosInstance.post("/api/leave/apply", data);
  return response.data;
};

export const decideLeaveApi = async (id, data) => {
  const response = await axiosInstance.post(`/api/leave/${id}/decision`, data);
  return response.data;
};
