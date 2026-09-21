import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Sidebar.css";

const Sidebar = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager";
  const isManagerOrAdmin = isAdmin || isManager;

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => (isActive ? "sidebar-link active" : "sidebar-link")}
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/attendance"
          className={({ isActive }) => (isActive ? "sidebar-link active" : "sidebar-link")}
        >
          Attendance
        </NavLink>

        {isManagerOrAdmin && (
          <NavLink
            to="/team-attendance"
            className={({ isActive }) => (isActive ? "sidebar-link active" : "sidebar-link")}
          >
            Team Attendance
          </NavLink>
        )}

        <NavLink
          to="/leave"
          className={({ isActive }) => (isActive ? "sidebar-link active" : "sidebar-link")}
        >
          Leave
        </NavLink>

        {isAdmin && (
          <NavLink
            to="/create-admin"
            className={({ isActive }) => (isActive ? "sidebar-link active" : "sidebar-link")}
          >
            Create Admin
          </NavLink>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
