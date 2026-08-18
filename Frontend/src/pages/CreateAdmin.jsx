import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createEmployeeApi } from "../api/employeeApi";
import "./CreateAdmin.css";

const CreateAdmin = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password) {
      setError("Please fill out all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const res = await createEmployeeApi({
        name,
        email,
        password,
        role: "admin",
      });

      if (res.success) {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create Admin account");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="create-admin-container">
      <div className="create-admin-card">
        <h2 className="create-admin-title">Create System Administrator</h2>
        <p className="create-admin-subtitle">
          Provision a new Administrator account with full system management privileges.
        </p>

        {error && <div className="login-error" style={{ marginBottom: "16px" }}>{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="adminName">Full Name *</label>
            <input
              id="adminName"
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. System Admin"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="adminEmail">Email Address *</label>
            <input
              id="adminEmail"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. admin2@hrms.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="adminPassword">Password *</label>
            <input
              id="adminPassword"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="form-actions" style={{ marginTop: "16px" }}>
            <Link to="/dashboard" className="btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Creating..." : "Create Admin"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAdmin;
