import React, { useEffect, useState } from "react";

import { DataTable } from "../components/DataViews";
import { fetchProjects, fetchProjectSummary } from "../services/api";
import { formatCurrency, formatStatus } from "../utils/formatters";

function buildReportSignal(project, summary) {
  const profit = Number(summary.profit_or_loss || 0);
  const spend = Number(summary.total_spend || 0);
  const budget = Number(summary.estimated_budget || 0);

  if (profit < 0 || spend > budget) {
    return { label: "Critical Leakage", className: "critical" };
  }
  if (spend > budget * 0.8) {
    return { label: "Margin Tight", className: "medium" };
  }
  if (project.status === "completed") {
    return { label: "Closed", className: "low" };
  }
  return { label: "Healthy", className: "low" };
}

export default function ReportsPage() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadReports() {
      try {
        const projects = await fetchProjects();
        const summaryRows = await Promise.all(
          projects.map(async (project) => ({
            project,
            summary: await fetchProjectSummary(project.id),
          })),
        );

        if (active) {
          setRows(summaryRows);
        }
      } catch (requestError) {
        if (active) {
          setError(requestError.message);
        }
      }
    }

    loadReports();

    return () => {
      active = false;
    };
  }, []);

  const columns = [
    {
      key: "project",
      label: "Project",
      render: ({ project }) => (
        <>
          <strong>{project.name}</strong>
          <div className="table-subtle">{project.code}</div>
        </>
      ),
    },
    { key: "status", label: "Status", render: ({ project }) => formatStatus(project.status) },
    {
      key: "signal",
      label: "Signal",
      render: ({ project, summary }) => {
        const signal = buildReportSignal(project, summary);
        return <span className={`risk-badge ${signal.className}`}>{signal.label}</span>;
      },
    },
    { key: "budget", label: "Budget", render: ({ summary }) => formatCurrency(summary.estimated_budget) },
    { key: "spend", label: "Spend", render: ({ summary }) => formatCurrency(summary.total_spend) },
    { key: "received", label: "Received", render: ({ summary }) => formatCurrency(summary.total_received) },
    {
      key: "profit",
      label: "Profit / Loss",
      className: ({ summary }) => (Number(summary.profit_or_loss) < 0 ? "loss-text" : "profit-text"),
      render: ({ summary }) => formatCurrency(summary.profit_or_loss),
    },
  ];

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Business Intelligence</p>
          <h2>Reports</h2>
        </div>
      </div>

      {error ? <div className="notice-card error">{error}</div> : null}

      <DataTable columns={columns} emptyText="No projects available for reporting yet." getRowKey={({ project }) => project.id} rows={rows} />
    </section>
  );
}
