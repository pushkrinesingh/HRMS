import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { applyLeaveApi } from "../api/leaveApi";
import "./ApplyLeave.css";

const ApplyLeave = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    leaveType: "Casual",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.startDate || !formData.endDate || !formData.reason.trim()) {
      setError("Please fill out all required fields: Start Date, End Date, and Reason.");
      return;
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setError("End date cannot be earlier than start date.");
      return;
    }

    setLoading(true);
    try {
      const res = await applyLeaveApi(formData);
      if (res.success) {
        navigate("/leave");
      } else {
        setError(res.message || "Failed to submit leave application.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit leave application.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="apply-leave-container">
      <div className="apply-leave-card">
        <h1 className="apply-leave-title">Apply for Leave</h1>

        {error && <div className="apply-leave-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="leaveType">
              Leave Type *
            </label>
            <select
              id="leaveType"
              name="leaveType"
              className="form-select"
              value={formData.leaveType}
              onChange={handleChange}
              required
            >
              <option value="Casual">Casual Leave</option>
              <option value="Sick">Sick Leave</option>
              <option value="Earned">Earned Leave</option>
              <option value="LWP">Leave Without Pay (LWP)</option>
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="form-group">
              <label className="form-label" htmlFor="startDate">
                Start Date *
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                className="form-input"
                value={formData.startDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="endDate">
                End Date *
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                className="form-input"
                value={formData.endDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reason">
              Reason *
            </label>
            <textarea
              id="reason"
              name="reason"
              className="form-textarea"
              placeholder="State the reason for your leave request..."
              value={formData.reason}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-actions">
            <Link to="/leave" className="btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplyLeave;
