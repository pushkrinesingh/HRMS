import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Sidebar.css";

const Sidebar = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

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
          to="/dashboard"
          className={({ isActive }) => (isActive ? "sidebar-link active" : "sidebar-link")}
        >
          Employees
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
