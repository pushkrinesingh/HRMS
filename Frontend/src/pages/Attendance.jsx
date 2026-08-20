import React, { useState, useEffect } from "react";
import { getAttendanceApi, toggleAttendanceApi } from "../api/attendanceApi";
import "./Attendance.css";

const isRecordToday = (dateStr) => {
  if (!dateStr) return false;
  const recDate = new Date(dateStr);
  const today = new Date();
  return (
    recDate.getFullYear() === today.getFullYear() &&
    recDate.getMonth() === today.getMonth() &&
    recDate.getDate() === today.getDate()
  );
};

const Attendance = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchAttendanceHistory = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAttendanceApi();
      if (res.success && Array.isArray(res.data)) {
        setAttendanceRecords(res.data);
      } else {
        setAttendanceRecords([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load attendance records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceHistory();
  }, []);

  const todayRecord = attendanceRecords.find((rec) => isRecordToday(rec.date));
  const isCheckedIn = Boolean(todayRecord && !todayRecord.checkOut);

  const handleToggle = async () => {
    setToggling(true);
    setError("");
    setMessage("");
    try {
      const res = await toggleAttendanceApi();
      if (res.success) {
        setMessage(res.message || "Attendance updated successfully");
        await fetchAttendanceHistory();
      } else {
        setError(res.message || "Failed to update attendance");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to toggle attendance");
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="attendance-container">
      <div className="attendance-header">
        <h1 className="attendance-title">My Attendance</h1>
        <button
          className={`btn-toggle ${isCheckedIn ? "btn-toggle-checkout" : "btn-toggle-checkin"}`}
          onClick={handleToggle}
          disabled={toggling}
        >
          {toggling ? "Updating..." : isCheckedIn ? "Check Out" : "Check In"}
        </button>
      </div>

      {error && <div className="attendance-error">{error}</div>}
      {message && <div className="attendance-message">{message}</div>}

      {loading ? (
        <div style={{ color: "var(--text-secondary)", padding: "20px 0" }}>
          Loading attendance history...
        </div>
      ) : attendanceRecords.length === 0 ? (
        <div style={{ color: "var(--text-secondary)", padding: "20px 0" }}>
          No attendance records found. Click "{isCheckedIn ? "Check Out" : "Check In"}" to start.
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Check-in Time</th>
                <th>Check-out Time</th>
                <th>Status</th>
                <th>Working Hours</th>
              </tr>
            </thead>
            <tbody>
              {attendanceRecords.map((rec) => {
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
                      <strong>{formattedDate}</strong>
                    </td>
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

export default Attendance;
