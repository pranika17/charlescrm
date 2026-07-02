import React, { useState } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { authenticated, signIn } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (authenticated) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await signIn(form);
    } catch (requestError) {
      setError(requestError.message || "Login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">Role-Based Access</p>
        <h1>Sign in to CharlesCRM</h1>
        <p className="auth-copy">Sign in with your assigned role to access the parts of Charles CRM that match your responsibilities across projects, site operations, finance, and reporting.</p>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              required
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            />
          </label>

          {error ? <div className="notice-card error">{error}</div> : null}

          <button className="primary-button" disabled={submitting} type="submit">
            {submitting ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    </section>
  );
}
