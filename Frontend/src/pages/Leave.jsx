import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getLeaveApi, decideLeaveApi } from "../api/leaveApi";
import { useAuth } from "../context/AuthContext";
import "./Leave.css";

const Leave = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager";
  const canApprove = isAdmin || isManager;

  const [balance, setBalance] = useState(null);
  const [myHistory, setMyHistory] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [comments, setComments] = useState({});
  const [loading, setLoading] = useState(true);
  const [decidingId, setDecidingId] = useState(null);
  const [error, setError] = useState("");

  const loadLeaveData = async () => {
    setLoading(true);
    setError("");
    try {
      // Fetch balance
      const balanceRes = await getLeaveApi({ balance: "true" });
      if (balanceRes.success) {
        setBalance(balanceRes.data);
      }

      // Fetch personal history
      const historyRes = await getLeaveApi();
      if (historyRes.success && Array.isArray(historyRes.data)) {
        setMyHistory(historyRes.data);
      }

      // Fetch pending approvals for admin/manager
      if (canApprove) {
        const pendingRes = await getLeaveApi({ team: "true", pending: "true" });
        if (pendingRes.success && Array.isArray(pendingRes.data)) {
          setPendingApprovals(pendingRes.data);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load leave details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaveData();
  }, []);

  const handleCommentChange = (id, text) => {
    setComments((prev) => ({ ...prev, [id]: text }));
  };

  const handleDecision = async (id, action) => {
    setDecidingId(id);
    try {
      const commentText = comments[id] || "";
      const res = await decideLeaveApi(id, { action, comment: commentText });
      if (res.success) {
        setComments((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        await loadLeaveData();
      }
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${action} leave request`);
    } finally {
      setDecidingId(null);
    }
  };

  return (
    <div className="leave-container">
      {/* Header & Apply button */}
      <div className="leave-header">
        <h1 className="leave-title">Leave Management</h1>
        <Link to="/leave/apply" className="btn-primary-link">
          + Apply for Leave
        </Link>
      </div>

      {error && <div className="leave-error">{error}</div>}

      {/* Section A: My Leave */}
      <div>
        <h2 className="section-title">My Leave Balance</h2>
        {balance ? (
          <div className="balance-grid">
            <div className="balance-card">
              <span className="balance-card-title">Casual Leave</span>
              <span className="balance-card-value">{balance.casual?.available ?? 0}</span>
              <span className="balance-card-sub">
                Available of {balance.casual?.total ?? 0} total
              </span>
            </div>
            <div className="balance-card">
              <span className="balance-card-title">Sick Leave</span>
              <span className="balance-card-value">{balance.sick?.available ?? 0}</span>
              <span className="balance-card-sub">
                Available of {balance.sick?.total ?? 0} total
              </span>
            </div>
            <div className="balance-card">
              <span className="balance-card-title">Earned Leave</span>
              <span className="balance-card-value">{balance.earned?.available ?? 0}</span>
              <span className="balance-card-sub">
                Available of {balance.earned?.total ?? 0} total
              </span>
            </div>
          </div>
        ) : (
          <div style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>
            {loading ? "Loading balance..." : "No leave balance record available."}
          </div>
        )}

        <h2 className="section-title" style={{ marginTop: "12px" }}>My Leave History</h2>
        {loading ? (
          <div style={{ color: "var(--text-secondary)", padding: "16px 0" }}>
            Loading leave history...
          </div>
        ) : myHistory.length === 0 ? (
          <div style={{ color: "var(--text-secondary)", padding: "16px 0" }}>
            No leave requests found.
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="leave-table">
              <thead>
                <tr>
                  <th>Leave Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Approver Comment</th>
                </tr>
              </thead>
              <tbody>
                {myHistory.map((req) => (
                  <tr key={req._id}>
                    <td>
                      <strong>{req.leaveType}</strong>
                    </td>
                    <td>{req.startDate ? new Date(req.startDate).toLocaleDateString() : "—"}</td>
                    <td>{req.endDate ? new Date(req.endDate).toLocaleDateString() : "—"}</td>
                    <td>{req.numberOfDays}</td>
                    <td>{req.reason}</td>
                    <td>
                      <span className={`badge-leave badge-leave-${req.status}`}>
                        {req.status}
                      </span>
                    </td>
                    <td>{req.approverComment || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section B: Approvals (Admin & Manager only) */}
      {canApprove && (
        <div style={{ marginTop: "16px" }}>
          <h2 className="section-title">Pending Team Approvals</h2>
          {loading ? (
            <div style={{ color: "var(--text-secondary)", padding: "16px 0" }}>
              Loading pending approvals...
            </div>
          ) : pendingApprovals.length === 0 ? (
            <div style={{ color: "var(--text-secondary)", padding: "16px 0" }}>
              No pending leave requests to review.
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="leave-table">
                <thead>
                  <tr>
                    <th>Employee Name</th>
                    <th>Leave Type</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Days</th>
                    <th>Reason</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingApprovals.map((req) => {
                    const empName = req.employee?.user?.name || "N/A";
                    return (
                      <tr key={req._id}>
                        <td>
                          <strong>{empName}</strong>
                        </td>
                        <td>{req.leaveType}</td>
                        <td>{req.startDate ? new Date(req.startDate).toLocaleDateString() : "—"}</td>
                        <td>{req.endDate ? new Date(req.endDate).toLocaleDateString() : "—"}</td>
                        <td>{req.numberOfDays}</td>
                        <td>{req.reason}</td>
                        <td>
                          <div className="approval-action-group">
                            <input
                              type="text"
                              className="input-comment"
                              placeholder="Comment (optional)"
                              value={comments[req._id] || ""}
                              onChange={(e) => handleCommentChange(req._id, e.target.value)}
                              disabled={decidingId === req._id}
                            />
                            <button
                              className="btn-action-approve"
                              onClick={() => handleDecision(req._id, "approve")}
                              disabled={decidingId === req._id}
                            >
                              {decidingId === req._id ? "..." : "Approve"}
                            </button>
                            <button
                              className="btn-action-reject"
                              onClick={() => handleDecision(req._id, "reject")}
                              disabled={decidingId === req._id}
                            >
                              {decidingId === req._id ? "..." : "Reject"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Leave;
