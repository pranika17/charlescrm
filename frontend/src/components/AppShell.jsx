import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { onApiNotice } from "../services/api";
import { getRoleLabel, hasAccess } from "../utils/access";
const navGroups = [
  {
    title: "Command",
    items: [
      {
        to: "/",
        label: "Dashboard",
        accessKey: "dashboard",
        icon: "dashboard",
      },
      {
        to: "/users",
        label: "Users",
        accessKey: "userManagement",
        icon: "users",
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
        icon: "projects",
      },

      {
        to: "/boq",
        label: "BOQ",
        accessKey: "boq",
        icon: "boq",
      },

      {
        to: "/site-operations",
        label: "Site Operations",
        accessKey: "siteOperations",
        icon: "site",
      },

      {
        to: "/labor",
        label: "Labor",
        accessKey: "labor",
        icon: "labor",
      },

      {
        to: "/materials",
        label: "Materials",
        accessKey: "materials",
        icon: "materials",
      },

      {
        to: "/equipment",
        label: "Equipment",
        accessKey: "equipment",
        icon: "equipment",
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
        icon: "vendors",
      },

      {
        to: "/purchase-orders",
        label: "Purchase Orders",
        accessKey: "purchaseOrders",
        icon: "orders",
      },

      {
        to: "/finance",
        label: "Finance",
        accessKey: "finance",
        icon: "finance",
      },

      {
        to: "/quotations",
        label: "Quotations",
        accessKey: "quotations",
        icon: "quotations",
      },

      {
        to: "/approvals",
        label: "Approvals",
        accessKey: "approvals",
        icon: "approvals",
      },

      {
        to: "/reports",
        label: "Reports",
        accessKey: "reports",
        icon: "reports",
      },
    ],
  },
];

const groupCodes = {
  Command: "CM",
  Execution: "EX",
  Commercial: "CO",
};

const iconPaths = {
  dashboard: ["M4 13h6V4H4v9Z", "M14 20h6v-9h-6v9Z", "M4 20h6v-3H4v3Z", "M14 7h6V4h-6v3Z"],
  users: ["M16 18v-1.5A3.5 3.5 0 0 0 12.5 13h-5A3.5 3.5 0 0 0 4 16.5V18", "M10 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z", "M20 18v-1a3 3 0 0 0-2.2-2.9", "M15.5 4.2a3 3 0 0 1 0 5.6"],
  projects: ["M4 19V6.5A2.5 2.5 0 0 1 6.5 4h4L13 6.5h4.5A2.5 2.5 0 0 1 20 9v10H4Z", "M4 10h16"],
  boq: ["M6 3h9l3 3v15H6V3Z", "M14 3v4h4", "M9 12h6", "M9 16h6", "M9 8h2"],
  site: ["M4 19h16", "M6 19V9l6-4 6 4v10", "M9 19v-6h6v6", "M9 9h.01", "M15 9h.01"],
  labor: ["M8 21v-4", "M16 21v-4", "M5 17h14l-2-7H7l-2 7Z", "M12 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"],
  materials: ["M4 8l8-4 8 4-8 4-8-4Z", "M4 8v8l8 4 8-4V8", "M12 12v8"],
  equipment: ["M5 17h14", "M7 17l2-8h7l2 8", "M10 9V5h4v4", "M8 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z", "M16 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"],
  vendors: ["M4 10h16l-1-5H5l-1 5Z", "M6 10v10h12V10", "M9 20v-5h6v5", "M8 5V3h8v2"],
  orders: ["M7 3h10v18H7V3Z", "M10 7h4", "M10 11h4", "M10 15h2"],
  finance: ["M12 3v18", "M17 7.5A4 4 0 0 0 12 5c-2.2 0-4 1-4 2.7 0 4.3 9 2.1 9 6.6 0 1.7-1.8 2.7-4 2.7a5 5 0 0 1-5-2.5"],
  quotations: ["M5 4h14v16H5V4Z", "M8 8h8", "M8 12h8", "M8 16h5"],
  approvals: ["M20 6 9 17l-5-5", "M15 5h3a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5"],
  reports: ["M5 20V4", "M19 20V4", "M5 20h14", "M9 16v-5", "M12 16V8", "M15 16v-7"],
};

function NavIcon({ name }) {
  const paths = iconPaths[name] || iconPaths.dashboard;

  return (
    <span className="nav-link-icon" aria-hidden="true">
      <svg fill="none" viewBox="0 0 24 24">
        {paths.map((path) => (
          <path d={path} key={path} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        ))}
      </svg>
    </span>
  );
}

export default function AppShell({ children }) {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notices, setNotices] = useState([]);

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

  useEffect(() => {
    const unsubscribe = onApiNotice((event) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const userName = user?.full_name || user?.email || "Current user";
      const notice = {
        id,
        type: event.detail?.type || "success",
        title: event.detail?.title || "Saved successfully",
        message: event.detail?.message || "The action was completed.",
        userName,
      };

      setNotices((current) => [notice, ...current].slice(0, 4));
      window.setTimeout(() => {
        setNotices((current) => current.filter((item) => item.id !== id));
      }, notice.type === "error" ? 7000 : 4500);
    });

    return unsubscribe;
  }, [user?.email, user?.full_name]);

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
                      <NavIcon name={item.icon} />
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
      <div className="toast-stack" role="status" aria-live="polite">
        {notices.map((notice) => (
          <div className={`toast-card ${notice.type === "error" ? "toast-card--error" : "toast-card--success"}`} key={notice.id}>
            <div className="toast-icon" aria-hidden="true">
              {notice.type === "error" ? "!" : "OK"}
            </div>
            <div>
              <strong>{notice.title}</strong>
              <p>{notice.type === "error" ? notice.message : `Added by ${notice.userName}. ${notice.message}`}</p>
            </div>
            <button
              aria-label="Dismiss message"
              className="toast-close"
              onClick={() => setNotices((current) => current.filter((item) => item.id !== notice.id))}
              type="button"
            >
              x
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
