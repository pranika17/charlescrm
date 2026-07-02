import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { getRoleLabel, hasAccess } from "../utils/access";
const navGroups = [
  {
    title: "Command",
    items: [
      {
        to: "/",
        label: "Dashboard",
        accessKey: "dashboard",
      },
      {
        to: "/users",
        label: "Users",
        accessKey: "userManagement",
      },
    ],
  },

  {
    title: "Execution",
    items: [
      {
        to: "/projects",
        label: "Projects",
        accessKey: "projects",
      },

      {
        to: "/boq",
        label: "BOQ",
        accessKey: "boq",
      },

      {
        to: "/site-operations",
        label: "Site Operations",
        accessKey: "siteOperations",
      },

      {
        to: "/labor",
        label: "Labor",
        accessKey: "labor",
      },

      {
        to: "/materials",
        label: "Materials",
        accessKey: "materials",
      },

      {
        to: "/equipment",
        label: "Equipment",
        accessKey: "equipment",
      },
    ],
  },

  {
    title: "Commercial",
    items: [
      {
        to: "/vendors",
        label: "Vendors",
        accessKey: "vendors",
      },

      {
        to: "/purchase-orders",
        label: "Purchase Orders",
        accessKey: "purchaseOrders",
      },

      {
        to: "/finance",
        label: "Finance",
        accessKey: "finance",
      },

      {
        to: "/quotations",
        label: "Quotations",
        accessKey: "quotations",
      },

      {
        to: "/approvals",
        label: "Approvals",
        accessKey: "approvals",
      },

      {
        to: "/reports",
        label: "Reports",
        accessKey: "reports",
      },
    ],
  },
];

const groupCodes = {
  Command: "CM",
  Execution: "EX",
  Commercial: "CO",
};

export default function AppShell({ children }) {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.classList.toggle("sidebar-scroll-lock", isSidebarOpen);

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsSidebarOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.classList.remove("sidebar-scroll-lock");
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isSidebarOpen]);

  function isActive(path) {
    return path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);
  }

  function handleSignOut() {
    setIsSidebarOpen(false);
    signOut();
  }

  return (
    <div className={`app-shell ${isSidebarOpen ? "sidebar-is-open" : ""}`}>
      <button
        aria-label="Close menu"
        className="sidebar-backdrop"
        onClick={() => setIsSidebarOpen(false)}
        type="button"
      />
      <aside className={`sidebar ${isSidebarOpen ? "sidebar--open" : ""}`}>
        <div className="sidebar-top">
          <div className="brand-block">
            <div className="brand-lockup">
              <span className="brand-mark">C</span>
              <div>
                <div className="brand-tag">
                  <span className="brand-dot" />
                  Civil Engineering CRM
                </div>
                <h1>CharlesCRM</h1>
              </div>
              <button
                aria-label="Close menu"
                className="sidebar-close-button"
                onClick={() => setIsSidebarOpen(false)}
                type="button"
              >
                <span />
                <span />
              </button>
            </div>
            <div className="control-strip">
              <span>Live Cost Desk</span>
              <strong>{getRoleLabel(user?.role)}</strong>
            </div>
          </div>

          <nav className="nav">
            {navGroups.map((group) => (
              <div className="nav-group" key={group.title}>
                <p className="nav-group-title">
                  <span>{groupCodes[group.title]}</span>
                  {group.title}
                </p>
                <div className="nav-group-items">
                  {group.items.filter((item) => hasAccess(user, item.accessKey)).map((item) => (
                    <Link
                      key={item.to}
                      className={isActive(item.to) ? "nav-link active" : "nav-link"}
                      onClick={() => setIsSidebarOpen(false)}
                      to={item.to}
                    >
                      <span className="nav-link-label">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>

        <div className="sidebar-footer">
        <div className="sidebar-user-card">
          <p className="sidebar-user">{user?.full_name || user?.email}</p>
          <p className="sidebar-role">{getRoleLabel(user?.role)} access</p>
        </div>
          <button className="secondary-button" onClick={handleSignOut} type="button">
            Logout
          </button>
        </div>
      </aside>

      <main className="content">
        <div className="content-topbar">
          <button
            aria-expanded={isSidebarOpen}
            aria-label="Open menu"
            className="mobile-menu-button"
            onClick={() => setIsSidebarOpen(true)}
            type="button"
          >
            <span />
            <span />
            <span />
          </button>
          <div>
            <strong>{location.pathname === "/" ? "Dashboard" : location.pathname.replace("/", "").replaceAll("-", " ")}</strong>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
