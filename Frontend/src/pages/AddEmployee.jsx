import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getEmployeesApi, createEmployeeApi } from "../api/employeeApi";
import "./AddEmployee.css";

const DEPARTMENT_ENUM = [
  "Engineering",
  "HR",
  "Sales",
  "Finance",
  "Marketing",
  "Operations",
  "Legal",
  "IT",
  "Customer Support",
  "Admin",
];

const AddEmployee = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
    department: "",
    designation: "",
    manager: "",
    joiningDate: "",
    salaryBasic: "",
    salaryHra: "",
  });

  const [managersList, setManagersList] = useState([]);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchManagerCandidates = async () => {
      setLoadingManagers(true);
      try {
        const res = await getEmployeesApi();
        if (res.success && Array.isArray(res.data)) {
          const filtered = res.data.filter(
            (emp) => emp.user?.role === "admin" || emp.user?.role === "manager"
          );
          setManagersList(filtered);
        }
      } catch (err) {
        console.error("Failed to load managers list:", err);
      } finally {
        setLoadingManagers(false);
      }
    };

    fetchManagerCandidates();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "role" && value === "admin") {
        updated.department = "";
        updated.manager = "";
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const isAdminRole = formData.role === "admin";

    if (!isAdminRole) {
      if (!formData.department) {
        setError("Department is required for manager/employee role");
        return;
      }
      if (!formData.manager) {
        setError("Manager reference is required for manager/employee role");
        return;
      }
    }

    setSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        department: isAdminRole ? null : formData.department,
        designation: formData.designation || undefined,
        manager: isAdminRole ? null : formData.manager,
        joiningDate: formData.joiningDate || undefined,
      };

      if (formData.salaryBasic || formData.salaryHra) {
        payload.salary = {
          basic: formData.salaryBasic ? Number(formData.salaryBasic) : 0,
          hra: formData.salaryHra ? Number(formData.salaryHra) : 0,
        };
      }

      const res = await createEmployeeApi(payload);
      if (res.success) {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create employee profile");
    } finally {
      setSubmitting(false);
    }
  };

  const isRoleAdmin = formData.role === "admin";

  return (
    <div className="add-employee-container">
      <div className="add-employee-card">
        <h2 className="add-employee-title">Add New Employee Profile</h2>

        {error && <div className="login-error" style={{ marginBottom: "16px" }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                id="name"
                name="name"
                type="text"
                className="form-input"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Rahul Sharma"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. rahul@hrms.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                id="password"
                name="password"
                type="password"
                className="form-input"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="role">Role *</label>
              <select
                id="role"
                name="role"
                className="form-select"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="department">Department {!isRoleAdmin && "*"}</label>
              <select
                id="department"
                name="department"
                className="form-select"
                value={formData.department}
                onChange={handleChange}
                disabled={isRoleAdmin}
                required={!isRoleAdmin}
              >
                <option value="">-- Select Department --</option>
                {DEPARTMENT_ENUM.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="designation">Designation</label>
              <input
                id="designation"
                name="designation"
                type="text"
                className="form-input"
                value={formData.designation}
                onChange={handleChange}
                placeholder="e.g. Software Engineer"
              />
            </div>

            <div className="form-group">
              <label htmlFor="manager">Manager Reference {!isRoleAdmin && "*"}</label>
              <select
                id="manager"
                name="manager"
                className="form-select"
                value={formData.manager}
                onChange={handleChange}
                disabled={isRoleAdmin || loadingManagers}
                required={!isRoleAdmin}
              >
                <option value="">-- Select Manager --</option>
                {managersList.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.user?.name} ({m.user?.role} - {m.designation || "No Designation"})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="joiningDate">Joining Date</label>
              <input
                id="joiningDate"
                name="joiningDate"
                type="date"
                className="form-input"
                value={formData.joiningDate}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="salaryBasic">Basic Salary (₹)</label>
              <input
                id="salaryBasic"
                name="salaryBasic"
                type="number"
                min="0"
                className="form-input"
                value={formData.salaryBasic}
                onChange={handleChange}
                placeholder="e.g. 45000"
              />
            </div>

            <div className="form-group">
              <label htmlFor="salaryHra">HRA (₹)</label>
              <input
                id="salaryHra"
                name="salaryHra"
                type="number"
                min="0"
                className="form-input"
                value={formData.salaryHra}
                onChange={handleChange}
                placeholder="e.g. 15000"
              />
            </div>
          </div>

          <div className="form-actions">
            <Link to="/dashboard" className="btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Creating..." : "Save Employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployee;
