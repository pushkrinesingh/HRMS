import axiosInstance from "./axios";

export const getAttendanceApi = async (params = {}) => {
  const response = await axiosInstance.get("/api/attendance", { params });
  return response.data;
};

export const toggleAttendanceApi = async () => {
  const response = await axiosInstance.post("/api/attendance/toggle");
  return response.data;
};
