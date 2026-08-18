import axiosInstance from "./axios";

export const getEmployeesApi = async (params = {}) => {
  const response = await axiosInstance.get("/api/employees", { params });
  return response.data;
};

export const getEmployeeByIdApi = async (id) => {
  const response = await axiosInstance.get("/api/employees", { params: { id } });
  return response.data;
};

export const createEmployeeApi = async (data) => {
  const response = await axiosInstance.post("/api/employees", data);
  return response.data;
};

export const updateEmployeeApi = async (id, data) => {
  const response = await axiosInstance.put(`/api/employees/${id}`, data);
  return response.data;
};

export const deleteEmployeeApi = async (id) => {
  const response = await axiosInstance.delete(`/api/employees/${id}`);
  return response.data;
};
