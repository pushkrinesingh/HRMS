import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getEmployeesApi, getEmployeeByIdApi, deleteEmployeeApi } from "../api/employeeApi";
import { useAuth } from "../context/AuthContext";
import "./Dashboard.css";

const Dashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const fetchEmployees = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getEmployeesApi();
      if (res.success && Array.isArray(res.data)) {
        setEmployees(res.data);
      } else {
        setEmployees([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load employees list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleViewDetail = async (id) => {
    setLoadingDetail(true);
    try {
      const res = await getEmployeeByIdApi(id);
      if (res.success && res.data) {
        setSelectedEmployee(res.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to load employee details");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDelete = async (id, empName) => {
    const confirmed = window.confirm(`Are you sure you want to delete ${empName || "this employee"}?`);
    if (!confirmed) return;

    try {
      const res = await deleteEmployeeApi(id);
      if (res.success) {
        setEmployees((prev) =>
          prev.map((emp) => (emp._id === id ? { ...emp, isActive: false } : emp))
        );
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete employee record");
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Employee Directory</h1>
        {isAdmin && (
          <Link to="/employees/add" className="btn-primary">
            + Add Employee
          </Link>
        )}
      </div>

      {error && <div className="login-error">{error}</div>}

      {loading ? (
        <div style={{ color: "var(--text-secondary)", padding: "20px 0" }}>Loading employee records...</div>
      ) : employees.length === 0 ? (
        <div style={{ color: "var(--text-secondary)", padding: "20px 0" }}>No employee records found.</div>
      ) : (
        <div className="table-wrapper">
          <table className="employee-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Manager</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => {
                const userObj = emp.user || {};
                const managerUser = emp.manager?.user || {};
                const role = userObj.role || "employee";

                return (
                  <tr key={emp._id}>
                    <td>
                      <strong>{userObj.name || "N/A"}</strong>
                    </td>
                    <td>{userObj.email || "N/A"}</td>
                    <td>
                      <span className={`badge badge-role-${role}`}>{role}</span>
                    </td>
                    <td>{emp.department || "N/A"}</td>
                    <td>{emp.designation || "N/A"}</td>
                    <td>{managerUser.name ? managerUser.name : emp.manager?.designation || "None"}</td>
                    <td>
                      <span className={emp.isActive !== false ? "status-active" : "status-inactive"}>
                        {emp.isActive !== false ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button className="btn-action" onClick={() => handleViewDetail(emp._id)}>
                          View
                        </button>
                        {isAdmin && emp.isActive !== false && (
                          <>
                            <Link to={`/employees/${emp._id}/edit`} className="btn-action btn-action-edit">
                              Edit
                            </Link>
                            <button
                              className="btn-action btn-action-delete"
                              onClick={() => handleDelete(emp._id, userObj.name)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedEmployee && (
        <div className="detail-modal-overlay" onClick={() => setSelectedEmployee(null)}>
          <div className="detail-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Employee Information</h3>
              <button className="btn-close" onClick={() => setSelectedEmployee(null)}>
                ✕
              </button>
            </div>

            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Name</span>
                <span className="detail-value">{selectedEmployee.user?.name || "N/A"}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Email</span>
                <span className="detail-value">{selectedEmployee.user?.email || "N/A"}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Role</span>
                <span className="detail-value">{selectedEmployee.user?.role || "N/A"}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Department</span>
                <span className="detail-value">{selectedEmployee.department || "N/A"}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Designation</span>
                <span className="detail-value">{selectedEmployee.designation || "N/A"}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Manager</span>
                <span className="detail-value">
                  {selectedEmployee.manager?.user?.name || selectedEmployee.manager?.designation || "None"}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Joining Date</span>
                <span className="detail-value">
                  {selectedEmployee.joiningDate
                    ? new Date(selectedEmployee.joiningDate).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Basic Salary</span>
                <span className="detail-value">
                  {selectedEmployee.salary?.basic ? `₹${selectedEmployee.salary.basic}` : "N/A"}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">HRA</span>
                <span className="detail-value">
                  {selectedEmployee.salary?.hra ? `₹${selectedEmployee.salary.hra}` : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
