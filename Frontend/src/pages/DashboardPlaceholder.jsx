import React from "react";
import { useAuth } from "../context/AuthContext";

const DashboardPlaceholder = () => {
  const { user, profile } = useAuth();

  return (
    <div>
      <h2 style={{ marginBottom: "16px" }}>Dashboard</h2>
      <div
        style={{
          backgroundColor: "var(--panel-bg)",
          border: "1px solid var(--border-color)",
          padding: "20px",
          borderRadius: "2px",
        }}
      >
        <p style={{ marginBottom: "8px" }}>
          Welcome, <strong>{user?.name}</strong>!
        </p>
        <p style={{ color: "var(--text-secondary)" }}>
          Role: <strong>{user?.role}</strong> | Email: <strong>{user?.email}</strong>
        </p>
        {profile && (
          <p style={{ color: "var(--text-secondary)", marginTop: "8px" }}>
            Designation: <strong>{profile.designation || "N/A"}</strong> | Department:{" "}
            <strong>{profile.department || "N/A"}</strong>
          </p>
        )}
      </div>
    </div>
  );
};

export default DashboardPlaceholder;
