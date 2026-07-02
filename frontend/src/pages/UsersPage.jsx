import React, { useEffect, useState } from "react";

import { DataTable, MetricGrid } from "../components/DataViews";
import { createUser, fetchUsers, updateUser } from "../services/api";
import { formatStatus } from "../utils/formatters";
import { getRoleLabel } from "../utils/access";

const roleOptions = [
  { value: "owner", label: "Owner" },
  { value: "manager", label: "Manager" },
  { value: "site_engineer", label: "Site Engineer" },
  { value: "accountant", label: "Accountant" },
  { value: "viewer", label: "Viewer" },
];

const initialForm = {
  username: "",
  full_name: "",
  email: "",
  phone: "",
  role: "viewer",
  password: "",
};

function buildUsername(email, currentUsername) {
  if (currentUsername.trim()) {
    return currentUsername.trim();
  }

  return email.split("@")[0]?.replace(/[^a-zA-Z0-9_.-]/g, "") || "";
}

function validateForm(form) {
  if (!form.full_name.trim()) {
    return "Full name is required.";
  }
  if (!form.email.trim()) {
    return "Email is required.";
  }
  if (!buildUsername(form.email, form.username)) {
    return "Username is required.";
  }
  if (!form.password || form.password.length < 6) {
    return "Password must be at least 6 characters.";
  }
  return "";
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function loadUsers() {
    try {
      const response = await fetchUsers();
      setUsers(response);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    const validationError = validateForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await createUser({
        ...form,
        username: buildUsername(form.email, form.username),
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      });
      setForm(initialForm);
      await loadUsers();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRoleChange(userId, role) {
    try {
      await updateUser(userId, { role });
      await loadUsers();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleStatusToggle(userId, isActive) {
    try {
      await updateUser(userId, { is_active: !isActive });
      await loadUsers();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  const metrics = [
    { label: "Total Users", value: users.length, trend: "Accounts available for role-based access" },
    { label: "Active Users", value: users.filter((item) => item.is_active).length, trend: "People currently allowed to sign in" },
    { label: "Roles In Use", value: new Set(users.map((item) => item.role)).size, trend: "Role coverage across your working team" },
  ];
  const columns = [
    {
      key: "user",
      label: "User",
      render: (user) => (
        <>
          <strong>{user.full_name}</strong>
          <div className="table-subtle">{user.email}</div>
        </>
      ),
    },
    {
      key: "role",
      label: "Role",
      render: (user) => (
        <>
          <label className="inline-select">
            <select className="field-control" value={user.role} onChange={(event) => handleRoleChange(user.id, event.target.value)}>
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div className="table-subtle">{getRoleLabel(user.role)}</div>
        </>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (user) => <span className={`status-badge ${user.is_active ? "approved" : "rejected"}`}>{formatStatus(user.is_active ? "active" : "inactive")}</span>,
    },
    {
      key: "access",
      label: "Access Control",
      render: (user) => (
        <button className="small-button" onClick={() => handleStatusToggle(user.id, user.is_active)} type="button">
          {user.is_active ? "Deactivate" : "Activate"}
        </button>
      ),
    },
  ];

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Authentication & User Management</p>
          <h2>Users</h2>
        </div>
      </div>

      {error ? <div className="notice-card error">{error}</div> : null}

      <MetricGrid items={metrics} />

      <div className="split-layout split-layout--wide">
        <section className="panel">
          <div className="section-heading">
            <div>
              <h3>Create Team User</h3>
              <p className="section-copy">Add accounts for operations, site, accounts, or reporting without sharing one admin login everywhere.</p>
            </div>
          </div>

          <form className="form-grid form-grid--two" onSubmit={handleSubmit}>
            <label className="field">
              <span>Full Name</span>
              <input className="field-control" value={form.full_name} onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))} />
            </label>
            <label className="field">
              <span>Email</span>
              <input className="field-control" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
            </label>
            <label className="field">
              <span>Username</span>
              <input className="field-control" value={form.username} onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))} />
              <span className="field-hint">If left blank, it will be generated from the email address.</span>
            </label>
            <label className="field">
              <span>Phone</span>
              <input className="field-control" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
            </label>
            <label className="field">
              <span>Role</span>
              <select className="field-control" value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}>
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Password</span>
              <input className="field-control" type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
            </label>
            <button className="primary-button" disabled={submitting} type="submit">
              {submitting ? "Creating..." : "Create User"}
            </button>
          </form>
        </section>

        
      </div>

      {loading ? <div className="notice-card">Loading users...</div> : null}

      {!loading ? <DataTable columns={columns} emptyText="No users available yet." rows={users} /> : null}
    </section>
  );
}
