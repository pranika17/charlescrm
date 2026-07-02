import React from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { getRoleLabel, hasAccess } from "../utils/access";

export default function ProtectedRoute({ children, accessKey }) {
  const { authenticated, loading, user } = useAuth();

  if (loading) {
    return <div className="notice-card">Checking access...</div>;
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasAccess(user, accessKey)) {
    return (
      <section className="page">
        <div className="notice-card error">
          Your current role, {getRoleLabel(user?.role)}, does not have access to this module.
        </div>
      </section>
    );
  }

  return children;
}
