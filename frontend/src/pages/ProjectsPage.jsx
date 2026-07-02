import React, { useEffect, useMemo, useState } from "react";

import { DataTable, MetricGrid } from "../components/DataViews";
import VoiceField from "../components/VoiceField";
import { createProject, fetchProjects } from "../services/api";
import { formatCurrency, formatStatus } from "../utils/formatters";

const initialForm = {
  name: "",
  code: "",
  client_name: "",
  location: "",
  description: "",
  start_date: "",
  end_date: "",
  status: "planning",
  estimated_budget: "",
  estimated_revenue: "",
  project_type: "residential_building",
};

const projectTypeOptions = [
  { value: "residential_building", label: "Residential Building" },
  { value: "commercial_building", label: "Commercial Building" },
  { value: "interior_fitout", label: "Interior Fit-out" },
  { value: "road_work", label: "Road Work" },
  { value: "drainage", label: "Drainage" },
  { value: "renovation", label: "Renovation" },
  { value: "industrial", label: "Industrial" },
  { value: "infrastructure", label: "Infrastructure" },
];

const statusOptions = [
  { value: "planning", label: "Planning" },
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
];

function buildProjectCode(name, location) {
  const nameCode = name
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part.slice(0, 3))
    .join("");
  const locationCode = location.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3);
  const yearCode = new Date().getFullYear().toString().slice(-2);
  return [nameCode || "PRJ", locationCode || "LOC", yearCode].filter(Boolean).join("-");
}

function validateProjectForm(form) {
  const trimmedName = form.name.trim();
  const trimmedClient = form.client_name.trim();
  const trimmedLocation = form.location.trim();
  const budget = Number(form.estimated_budget);
  const revenue = Number(form.estimated_revenue);

  if (!trimmedName || trimmedName.length < 3) {
    return "Project name should be at least 3 characters.";
  }
  if (!form.code.trim()) {
    return "Project code is required for tracking finance and site entries.";
  }
  if (!trimmedClient) {
    return "Client name is required.";
  }
  if (!trimmedLocation) {
    return "Location is required.";
  }
  if (!form.start_date) {
    return "Start date is required.";
  }
  if (form.end_date && form.end_date < form.start_date) {
    return "Expected end date cannot be earlier than the start date.";
  }
  if (!Number.isFinite(budget) || budget <= 0) {
    return "Estimated budget must be greater than zero.";
  }
  if (!Number.isFinite(revenue) || revenue <= 0) {
    return "Estimated revenue must be greater than zero.";
  }
  return "";
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function loadProjects() {
    try {
      const response = await fetchProjects();
      setProjects(response);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  const totalBudget = useMemo(() => projects.reduce((sum, item) => sum + Number(item.estimated_budget || 0), 0), [projects]);
  const totalRevenue = useMemo(() => projects.reduce((sum, item) => sum + Number(item.estimated_revenue || 0), 0), [projects]);
  const activeProjectCount = useMemo(() => projects.filter((item) => item.status === "active").length, [projects]);
  const metrics = [
    { label: "Total Projects", value: projects.length, trend: "All jobs tracked in one register" },
    { label: "Active Jobs", value: activeProjectCount, trend: "Projects currently demanding daily attention" },
    { label: "Estimated Pipeline", value: formatCurrency(totalRevenue - totalBudget), trend: "Expected commercial spread across the portfolio" },
  ];
  const columns = [
    { key: "code", label: "Code" },
    {
      key: "name",
      label: "Name",
      render: (project) => (
        <>
          <strong>{project.name}</strong>
          <div className="table-subtle">{project.location}</div>
        </>
      ),
    },
    { key: "client_name", label: "Client" },
    { key: "budget", label: "Budget", render: (project) => formatCurrency(project.estimated_budget) },
    { key: "revenue", label: "Revenue", render: (project) => formatCurrency(project.estimated_revenue) },
    {
      key: "status",
      label: "Status",
      render: (project) => <span className={`status-badge ${project.status}`}>{formatStatus(project.status)}</span>,
    },
  ];

  async function handleSubmit(event) {
    event.preventDefault();
    const validationError = validateProjectForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await createProject({
        ...form,
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        client_name: form.client_name.trim(),
        location: form.location.trim(),
        description: form.description.trim(),
        estimated_budget: Number(form.estimated_budget || 0),
        estimated_revenue: Number(form.estimated_revenue || 0),
        end_date: form.end_date || null,
      });
      setForm(initialForm);
      await loadProjects();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Project Setup</p>
          <h2>Projects</h2>
        </div>
      </div>

      {error ? <div className="notice-card error">{error}</div> : null}

      <MetricGrid items={metrics} />

      <div className="split-layout split-layout--wide">
        <section className="panel">
          <div className="section-heading">
            <div>
              <h3>Create New Project</h3>
            </div>
            <button
              className="secondary-button secondary-button--dark"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  code: buildProjectCode(current.name, current.location),
                }))
              }
              type="button"
            >
              Suggest Code
            </button>
          </div>

          <form className="form-grid form-grid--two" onSubmit={handleSubmit}>
            <VoiceField
              helper="Use the client-facing project title."
              label="Project Name"
              onChangeValue={(value) => setForm((current) => ({ ...current, name: value }))}
              
              value={form.name}
            />
            <VoiceField
              helper="Keep this short and unique for logs, expenses, and uploads."
              label="Project Code"
              onChangeValue={(value) => setForm((current) => ({ ...current, code: value.toUpperCase().replace(/\s+/g, "-") }))}
              
              value={form.code}
            />
            <VoiceField
              helper="Record the client or contracting company."
              label="Client Name"
              onChangeValue={(value) => setForm((current) => ({ ...current, client_name: value }))}
              
              value={form.client_name}
            />
            <VoiceField
              helper="Mention area, city, or site landmark."
              label="Location"
              onChangeValue={(value) => setForm((current) => ({ ...current, location: value }))}
            
              value={form.location}
            />
            <VoiceField
              helper="You can say dates like 'May 20 2026' or 'today'."
              label="Start Date"
              onChangeValue={(value) => setForm((current) => ({ ...current, start_date: value }))}
              type="date"
              value={form.start_date}
              voiceHint="Say a date like 'May 20 2026' or 'today'."
            />
            <VoiceField
              helper="Optional, but useful for planning cash flow and manpower."
              label="Expected End Date"
              onChangeValue={(value) => setForm((current) => ({ ...current, end_date: value }))}
              type="date"
              value={form.end_date}
              voiceHint="Say a date like 'August 15 2026'."
            />
            <VoiceField
              control="select"
              label="Status"
              onChangeValue={(value) => setForm((current) => ({ ...current, status: value }))}
              options={statusOptions}
              value={form.status}
              voiceHint="Say planning, active, on hold, or completed."
            />
            <VoiceField
              control="select"
              label="Project Type"
              onChangeValue={(value) => setForm((current) => ({ ...current, project_type: value }))}
              options={projectTypeOptions}
              value={form.project_type}
              voiceHint="Say residential building, commercial building, road work, or another listed type."
            />
            <VoiceField
              helper="Set the real execution budget, not just the tender hope."
              label="Estimated Budget"
              onChangeValue={(value) => setForm((current) => ({ ...current, estimated_budget: value }))}
              min="0"
              step="0.01"
              type="number"
              value={form.estimated_budget}
              voiceHint="Say a numeric amount like '2500000'."
            />
            <VoiceField
              helper="Expected client billing or collection for the full project."
              label="Estimated Revenue"
              onChangeValue={(value) => setForm((current) => ({ ...current, estimated_revenue: value }))}
              min="0"
              step="0.01"
              type="number"
              value={form.estimated_revenue}
              voiceHint="Say a numeric amount like '3100000'."
            />
            <VoiceField
              appendVoice
              className="field field--full"
              control="textarea"
              helper="Mention structural scope, package limits, special conditions, or client expectations."
              label="Description"
              onChangeValue={(value) => setForm((current) => ({ ...current, description: value }))}
             
              value={form.description}
            />
            <button className="primary-button" disabled={submitting} type="submit">
              {submitting ? "Saving..." : "Create Project"}
            </button>
          </form>
        </section>

       
      </div>

      {loading ? <div className="notice-card">Loading projects...</div> : null}

      {!loading ? <DataTable columns={columns} emptyText="No projects found yet. Create your first project above." rows={projects} /> : null}
    </section>
  );
}
