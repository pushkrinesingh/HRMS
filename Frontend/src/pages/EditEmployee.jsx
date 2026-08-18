import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getEmployeesApi, getEmployeeByIdApi, updateEmployeeApi } from "../api/employeeApi";
import "./EditEmployee.css";

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

const EditEmployee = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [formData, setFormData] = useState({
    department: "",
    designation: "",
    manager: "",
    joiningDate: "",
    salaryBasic: "",
    salaryHra: "",
  });

  const [managersList, setManagersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError("");
      try {
        const [empRes, allEmpsRes] = await Promise.all([
          getEmployeeByIdApi(id),
          getEmployeesApi(),
        ]);

        if (empRes.success && empRes.data) {
          const emp = empRes.data;
          setEmployee(emp);

          setFormData({
            department: emp.department || "",
            designation: emp.designation || "",
            manager: emp.manager?._id || emp.manager || "",
            joiningDate: emp.joiningDate ? emp.joiningDate.split("T")[0] : "",
            salaryBasic: emp.salary?.basic || "",
            salaryHra: emp.salary?.hra || "",
          });
        } else {
          setError("Employee profile not found");
        }

        if (allEmpsRes.success && Array.isArray(allEmpsRes.data)) {
          const filtered = allEmpsRes.data.filter(
            (e) => (e.user?.role === "admin" || e.user?.role === "manager") && e._id !== id
          );
          setManagersList(filtered);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load employee details");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const isRoleAdmin = employee?.user?.role === "admin";

    if (!isRoleAdmin && !formData.department) {
      setError("Department is required");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        department: isRoleAdmin ? null : formData.department,
        designation: formData.designation || undefined,
        manager: isRoleAdmin ? null : formData.manager || undefined,
        joiningDate: formData.joiningDate || undefined,
      };

      if (formData.salaryBasic || formData.salaryHra) {
        payload.salary = {
          basic: formData.salaryBasic ? Number(formData.salaryBasic) : 0,
          hra: formData.salaryHra ? Number(formData.salaryHra) : 0,
        };
      }

      const res = await updateEmployeeApi(id, payload);
      if (res.success) {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update employee profile");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="edit-employee-container">
        <div className="edit-employee-card">
          <div style={{ color: "var(--text-secondary)", padding: "20px 0" }}>
            Loading employee record...
          </div>
        </div>
      </div>
    );
  }

  const isRoleAdmin = employee?.user?.role === "admin";

  return (
    <div className="edit-employee-container">
      <div className="edit-employee-card">
        <h2 className="edit-employee-title">Edit Employee Profile</h2>
        <p className="edit-employee-subtitle">
          Editing record for <strong>{employee?.user?.name || "Employee"}</strong> ({employee?.user?.email}) — Role: {employee?.user?.role}
        </p>

        {error && <div className="login-error" style={{ marginBottom: "16px" }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
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
                placeholder="e.g. Senior Software Engineer"
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
                disabled={isRoleAdmin}
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
                placeholder="e.g. 50000"
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
                placeholder="e.g. 18000"
              />
            </div>
          </div>

          <div className="form-actions">
            <Link to="/dashboard" className="btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Updating..." : "Update Employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEmployee;
