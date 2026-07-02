import React, { useEffect, useMemo, useState } from "react";

import { DataTable, MetricGrid } from "../components/DataViews";
import VoiceField from "../components/VoiceField";
import { createLaborEntry, fetchLaborEntries, fetchProjects } from "../services/api";
import { formatCurrency } from "../utils/formatters";

const laborTypeOptions = [
  "Mason",
  "Helper",
  "Bar Bender",
  "Carpenter",
  "Electrician",
  "Plumber",
  "Painter",
  "Tile Worker",
  "Welder",
  "Machine Operator",
  "Supervisor",
];

const initialForm = {
  project: "",
  work_date: "",
  labor_type: "",
  worker_name: "",
  contractor_name: "",
  attendance_days: "1",
  wage_per_day: "",
  overtime_amount: "0",
  total_amount: "",
  notes: "",
};

function calculateTotal(form) {
  const attendance = Number(form.attendance_days || 0);
  const wagePerDay = Number(form.wage_per_day || 0);
  const overtime = Number(form.overtime_amount || 0);
  return attendance * wagePerDay + overtime;
}

function validateLaborForm(form) {
  if (!form.project) {
    return "Choose a project before saving labor.";
  }
  if (!form.work_date) {
    return "Work date is required.";
  }
  if (!form.labor_type.trim()) {
    return "Labor type is required.";
  }
  if (!form.worker_name.trim()) {
    return "Worker or crew name is required.";
  }
  if (Number(form.attendance_days) <= 0) {
    return "Attendance must be greater than zero.";
  }
  if (Number(form.wage_per_day) <= 0) {
    return "Wage per day must be greater than zero.";
  }
  return "";
}

export default function LaborPage() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState(initialForm);
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
    async function loadEntries() {
      if (!selectedProject) {
        setEntries([]);
        return;
      }
      try {
        setEntries(await fetchLaborEntries(selectedProject));
      } catch (requestError) {
        setError(requestError.message);
      }
    }

    loadEntries();
  }, [selectedProject]);

  const computedTotal = useMemo(() => calculateTotal(form), [form]);
  const totalLaborCost = useMemo(() => entries.reduce((sum, item) => sum + Number(item.total_amount || 0), 0), [entries]);
  const totalAttendance = useMemo(() => entries.reduce((sum, item) => sum + Number(item.attendance_days || 0), 0), [entries]);
  const overtimeCount = useMemo(() => entries.filter((item) => Number(item.overtime_amount || 0) > 0).length, [entries]);
  const metrics = [
    { label: "Labor Entries", value: entries.length, trend: "Recorded labor rows for this project" },
    { label: "Total Attendance", value: totalAttendance, trend: "Person-days or attendance units logged" },
    { label: "Total Labor Cost", value: formatCurrency(totalLaborCost), trend: `${overtimeCount} entries include overtime` },
  ];
  const columns = [
    { key: "work_date", label: "Date" },
    { key: "labor_type", label: "Labor Type" },
    {
      key: "worker",
      label: "Worker",
      render: (entry) => (
        <>
          {entry.worker_name}
          {entry.contractor_name ? <div className="table-subtle">{entry.contractor_name}</div> : null}
        </>
      ),
    },
    { key: "attendance_days", label: "Attendance" },
    { key: "total_amount", label: "Total", render: (entry) => formatCurrency(entry.total_amount) },
  ];

  async function handleSubmit(event) {
    event.preventDefault();
    const validationError = validateLaborForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");

    try {
      await createLaborEntry({
        ...form,
        labor_type: form.labor_type.trim(),
        worker_name: form.worker_name.trim(),
        contractor_name: form.contractor_name.trim(),
        notes: form.notes.trim(),
        attendance_days: Number(form.attendance_days),
        wage_per_day: Number(form.wage_per_day),
        overtime_amount: Number(form.overtime_amount || 0),
        total_amount: computedTotal,
      });
      setForm((current) => ({ ...initialForm, project: current.project }));
      setEntries(await fetchLaborEntries(selectedProject));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Workforce Control</p>
          <h2>Labor</h2>
        </div>
      </div>

      {error ? <div className="notice-card error">{error}</div> : null}

      <div className="panel">
        <div className="section-heading">
          <div>
            <h3>Choose Project</h3>
          </div>
        </div>
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

      <MetricGrid items={metrics} />

      <div className="split-layout split-layout--equal">
        <section className="panel">
          <div className="section-heading">
            <div>
              <h3>Add Labor Entry</h3>
            </div>
          </div>

          <form className="form-grid form-grid--two" onSubmit={handleSubmit}>
            <VoiceField
              label="Work Date"
              onChangeValue={(value) => setForm((current) => ({ ...current, work_date: value }))}
              type="date"
              value={form.work_date}
              voiceHint="Say a valid work date."
            />
            <VoiceField
              helper="Choose the crew skill or role."
              label="Labor Type"
              list="labor-type-options"
              onChangeValue={(value) => setForm((current) => ({ ...current, labor_type: value }))}
              placeholder="Example: Mason"
              value={form.labor_type}
            />
            <VoiceField
              helper="Record a worker name or gang name."
              label="Worker / Crew Name"
              onChangeValue={(value) => setForm((current) => ({ ...current, worker_name: value }))}
              placeholder="Example: Selvam Mason Team"
              value={form.worker_name}
            />
            <VoiceField
              helper="Optional contractor or subcontractor."
              label="Contractor Name"
              onChangeValue={(value) => setForm((current) => ({ ...current, contractor_name: value }))}
              placeholder="Example: Vignesh Labour Contract"
              value={form.contractor_name}
            />
            <VoiceField
              label="Attendance Days"
              min="0"
              step="0.5"
              onChangeValue={(value) => setForm((current) => ({ ...current, attendance_days: value }))}
              type="number"
              value={form.attendance_days}
              voiceHint="Say a number like 1 or 0.5."
            />
            <VoiceField
              label="Wage Per Day"
              min="0"
              step="0.01"
              onChangeValue={(value) => setForm((current) => ({ ...current, wage_per_day: value }))}
              type="number"
              value={form.wage_per_day}
              voiceHint="Say a numeric wage amount."
            />
            <VoiceField
              label="Overtime Amount"
              min="0"
              step="0.01"
              onChangeValue={(value) => setForm((current) => ({ ...current, overtime_amount: value }))}
              type="number"
              value={form.overtime_amount}
              voiceHint="Say a numeric overtime amount."
            />
            <label className="field">
              <span>Total Amount</span>
              <input className="field-control" disabled type="text" value={formatCurrency(computedTotal)} />
              <span className="field-hint">Calculated from attendance x wage plus overtime.</span>
            </label>
            <VoiceField
              appendVoice
              className="field field--full"
              control="textarea"
              label="Notes"
              onChangeValue={(value) => setForm((current) => ({ ...current, notes: value }))}
              placeholder="Example: Night shift concreting support for raft pour."
              rows={3}
              value={form.notes}
            />
            <button className="primary-button" type="submit">
              Save Labor Entry
            </button>
          </form>

          <datalist id="labor-type-options">
            {laborTypeOptions.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </section>
      </div>

      <DataTable columns={columns} emptyText="No labor entries recorded for this project yet." rows={entries} />
    </section>
  );
}
