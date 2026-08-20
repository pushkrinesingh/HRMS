import React, { useState, useEffect } from "react";
import { getAttendanceApi } from "../api/attendanceApi";
import "./TeamAttendance.css";

const TeamAttendance = () => {
  const [teamRecords, setTeamRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTeamAttendance = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAttendanceApi({ team: "true" });
      if (res.success && Array.isArray(res.data)) {
        setTeamRecords(res.data);
      } else {
        setTeamRecords([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load team attendance records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamAttendance();
  }, []);

  return (
    <div className="team-attendance-container">
      <div className="team-attendance-header">
        <h1 className="team-attendance-title">Team Attendance</h1>
      </div>

      {error && <div className="team-attendance-error">{error}</div>}

      {loading ? (
        <div style={{ color: "var(--text-secondary)", padding: "20px 0" }}>
          Loading team attendance records...
        </div>
      ) : teamRecords.length === 0 ? (
        <div style={{ color: "var(--text-secondary)", padding: "20px 0" }}>
          No team attendance records found.
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="team-attendance-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Date</th>
                <th>Check-in Time</th>
                <th>Check-out Time</th>
                <th>Status</th>
                <th>Working Hours</th>
              </tr>
            </thead>
            <tbody>
              {teamRecords.map((rec) => {
                const empName = rec.employee?.user?.name || "N/A";
                const empEmail = rec.employee?.user?.email;
                const formattedDate = rec.date
                  ? new Date(rec.date).toLocaleDateString()
                  : "N/A";
                const checkInTime = rec.checkIn
                  ? new Date(rec.checkIn).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })
                  : "—";
                const checkOutTime = rec.checkOut
                  ? new Date(rec.checkOut).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })
                  : "—";

                return (
                  <tr key={rec._id}>
                    <td>
                      <div>
                        <strong>{empName}</strong>
                        {empEmail && (
                          <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                            {empEmail}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>{formattedDate}</td>
                    <td>{checkInTime}</td>
                    <td>{checkOutTime}</td>
                    <td>
                      <span className={`badge-status badge-status-${rec.status}`}>
                        {rec.status}
                      </span>
                    </td>
                    <td>
                      {rec.workingHours !== undefined && rec.workingHours !== null
                        ? `${rec.workingHours} hrs`
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TeamAttendance;
