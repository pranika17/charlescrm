import React, { useEffect, useState } from "react";
import { DataTable, MetricGrid, PageTitle, PanelTitle } from "../components/DataViews";
import { createEquipment, fetchEquipment, fetchProjects } from "../services/api";
import { formatCurrency } from "../utils/formatters";

const initialForm = {
  project: "",
  name: "",
  equipment_type: "",
  daily_cost: "",
  status: "available",
};

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function bootstrap() {
      try {
        const projectList = await fetchProjects();
        setProjects(projectList);

        if (projectList[0]) {
          const projectId = String(projectList[0].id);
          setSelectedProject(projectId);
          setForm((current) => ({ ...current, project: projectId }));
        }
      } catch (requestError) {
        setError(requestError.message);
      }
    }

    bootstrap();
  }, []);

  useEffect(() => {
    loadData();
  }, [selectedProject]);

  async function loadData() {
    if (!selectedProject) {
      setEquipment([]);
      return;
    }

    try {
      const response = await fetchEquipment(selectedProject);

      if (Array.isArray(response)) {
        setEquipment(response);
      } else if (response?.results) {
        setEquipment(response.results);
      } else {
        setEquipment([]);
      }
    } catch (error) {
      console.error("Equipment Error:", error);
      setEquipment([]);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (!form.project) {
        setError("Choose a project before saving equipment.");
        setSaving(false);
        return;
      }

      await createEquipment({
        ...form,
        project: Number(form.project),
        daily_cost: Number(form.daily_cost),
      });
      setForm((current) => ({ ...initialForm, project: current.project }));
      await loadData();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  const rows = Array.isArray(equipment) ? equipment : [];
  const totalDailyCost = rows.reduce((total, item) => total + Number(item.daily_cost || 0), 0);
  const stats = [
    { label: "Equipment", value: rows.length },
    { label: "Available", value: rows.filter((item) => item.status === "available").length },
    { label: "Daily Cost", value: formatCurrency(totalDailyCost) },
  ];

  const columns = [
    { key: "name", label: "Equipment" },
    { key: "equipment_type", label: "Type" },
    { key: "daily_cost", label: "Daily Cost", render: (row) => formatCurrency(row.daily_cost) },
    {
      key: "status",
      label: "Status",
      render: (row) => <span className={`status-badge ${row.status}`}>{row.status}</span>,
    },
  ];

  return (
    <section className="page">
      <PageTitle eyebrow="Assets" title="Equipment" />

      <MetricGrid items={stats} />

      <div className="panel">
        <PanelTitle title="Choose Project">Equipment cost is stored against the selected project.</PanelTitle>
        <label className="field">
          <span>Project</span>
          <select
            className="field-control"
            value={selectedProject}
            onChange={(event) => {
              const projectId = event.target.value;
              setSelectedProject(projectId);
              setForm((current) => ({ ...current, project: projectId }));
            }}
          >
            <option value="">Select a project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.code} - {project.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="split-layout split-layout--wide">
        <section className="panel">
          <PanelTitle title="Add Equipment">Register equipment with type, daily cost, and current status.</PanelTitle>

          {error ? <div className="notice-card error">{error}</div> : null}

          <form className="form-grid form-grid--two" onSubmit={handleSubmit}>
            <label className="field">
              <span>Equipment Name</span>
              <input name="name" onChange={handleChange} required value={form.name} />
            </label>
            <label className="field">
              <span>Equipment Type</span>
              <input name="equipment_type" onChange={handleChange} required value={form.equipment_type} />
            </label>
            <label className="field">
              <span>Daily Cost</span>
              <input min="0" name="daily_cost" onChange={handleChange} required step="0.01" type="number" value={form.daily_cost} />
            </label>
            <label className="field">
              <span>Status</span>
              <select name="status" onChange={handleChange} value={form.status}>
                <option value="available">Available</option>
                <option value="in_use">In Use</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </label>
            <button className="primary-button" disabled={saving} type="submit">
              {saving ? "Saving..." : "Save Equipment"}
            </button>
          </form>
        </section>

        <DataTable columns={columns} rows={rows} emptyText="No equipment found." />
      </div>
    </section>
  );
}
