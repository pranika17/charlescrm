import React, { useEffect, useState } from "react";

import { DataTable } from "../components/DataViews";
import { fetchApprovals, updateApproval } from "../services/api";
import { formatCurrency } from "../utils/formatters";

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState([]);
  const [error, setError] = useState("");

  async function loadApprovals() {
    try {
      const response = await fetchApprovals();
      setApprovals(response);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  useEffect(() => {
    loadApprovals();
  }, []);

  async function handleAction(id, action) {
    try {
      await updateApproval(id, action, `${action}d by admin`);
      await loadApprovals();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  const columns = [
    { key: "request_type", label: "Request" },
    { key: "module_name", label: "Module" },
    { key: "amount", label: "Amount", render: (approval) => formatCurrency(approval.amount) },
    {
      key: "status",
      label: "Status",
      render: (approval) => <span className={`status-badge ${approval.status}`}>{approval.status}</span>,
    },
    {
      key: "action",
      label: "Action",
      render: (approval) =>
        approval.status === "pending" ? (
          <div className="action-row">
            <button className="small-button" onClick={() => handleAction(approval.id, "approve")} type="button">
              Approve
            </button>
            <button className="small-button small-button--muted" onClick={() => handleAction(approval.id, "reject")} type="button">
              Reject
            </button>
          </div>
        ) : (
          "Completed"
        ),
    },
  ];

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Control Tower</p>
          <h2>Approve Faster Without Losing Commercial Discipline</h2>
        </div>
        <div className="pill">Risk Control</div>
      </div>

      {error ? <div className="notice-card error">{error}</div> : null}

      <DataTable columns={columns} emptyText="No approval requests yet." rows={approvals} />
    </section>
  );
}
