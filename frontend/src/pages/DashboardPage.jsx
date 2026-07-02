import React, { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { DataTable, MetricGrid, PageTitle, ValueList } from "../components/DataViews";
import {
  fetchApprovals,
  fetchDashboardOverview,
  fetchProjects,
  fetchProjectSummary,
  fetchSmartAlerts,
  sendProfitLossAlert,
} from "../services/api";
import { formatCurrency, formatStatus } from "../utils/formatters";

function buildRisk(summary, project) {
  const profit = Number(summary?.profit_or_loss || 0);
  const spend = Number(summary?.total_spend || 0);
  const received = Number(summary?.total_received || 0);
  const budget = Number(summary?.estimated_budget || 0);

  if (project.status === "on_hold" || profit < 0 || spend > budget * 0.9) {
    return { label: "Critical", className: "critical" };
  }

  if (received < spend || spend > budget * 0.7) {
    return { label: "Medium", className: "medium" };
  }

  return { label: "Low", className: "low" };
}

export default function DashboardPage() {
  const [overview, setOverview] = useState(null);
  const [projectSummaries, setProjectSummaries] = useState([]);
  const [smartAlerts, setSmartAlerts] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mailStatus, setMailStatus] = useState(null);
  const [sendingMail, setSendingMail] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const [overviewResponse, projectsResponse, alertResponse] = await Promise.all([
          fetchDashboardOverview(),
          fetchProjects(),
          fetchSmartAlerts(),
        ]);
        const approvalResponse = await fetchApprovals().catch(() => []);
        const summaryResponse = await Promise.all(
          projectsResponse.map(async (project) => ({
            project,
            summary: await fetchProjectSummary(project.id),
          })),
        );

        if (active) {
          setOverview(overviewResponse);
          setProjectSummaries(summaryResponse);
          setSmartAlerts(alertResponse.alerts || []);
          setPendingPayments(alertResponse.pending_payments || []);
          setApprovals(approvalResponse || []);
          setError("");
        }
      } catch (requestError) {
        if (active) {
          setError(requestError.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  async function handleSendProfitLossAlert() {
    setSendingMail(true);
    setMailStatus(null);

    try {
      const response = await sendProfitLossAlert();
      setMailStatus({ type: "success", text: `${response.detail} ${response.status} message sent to ${response.sent_to.join(", ")}.` });
    } catch (requestError) {
      setMailStatus({ type: "error", text: requestError.message });
    } finally {
      setSendingMail(false);
    }
  }

  const profitOrLoss = Number(overview?.profit_or_loss || 0);
  const pendingApprovalRows = approvals.filter((approval) => approval.status === "pending");
  const pendingApprovalAmount = pendingApprovalRows.reduce((total, approval) => total + Number(approval.amount || 0), 0);
  const pendingApprovalCount = overview?.pending_approvals ?? pendingApprovalRows.length;
  const activeAlertCount = smartAlerts.length;
  const totalSpend = Number(overview?.total_spend || 0);
  const totalReceived = Number(overview?.total_received || 0);
  const totalExpectedRevenue = Number(overview?.total_expected_revenue || 0);
  const pendingAmount = Number(overview?.pending_amount || 0);
  const profitMargin = totalReceived > 0 ? (profitOrLoss / totalReceived) * 100 : 0;
  const netProfitAmount = Math.max(profitOrLoss, 0);
  const netLossAmount = Math.max(Math.abs(profitOrLoss), 0);
  const profitLossStatus =
    profitOrLoss > 0
      ? { label: "Profit", className: "profit" }
      : profitOrLoss < 0
        ? { label: "Loss", className: "loss" }
        : { label: "Break Even", className: "neutral" };

  const stats = [
    { label: "Active Projects", value: overview?.active_projects ?? 0 },
    { label: "Spend", value: formatCurrency(overview?.total_spend) },
    { label: "Received", value: formatCurrency(overview?.total_received) },
    { label: "Profit", value: formatCurrency(netProfitAmount), className: "profit-text" },
    { label: "Loss", value: formatCurrency(profitOrLoss < 0 ? netLossAmount : 0), className: "loss-text" },
    { label: "Pending", value: formatCurrency(overview?.pending_amount) },
    { label: "Approvals", value: pendingApprovalCount },
    { label: "Alerts", value: activeAlertCount },
  ];

  const moneyChartData = [
    { name: "Revenue", value: Number(overview?.total_expected_revenue || 0), fill: "#1f4b73" },
    { name: "Received", value: Number(overview?.total_received || 0), fill: "#0b6c5c" },
    { name: "Spend", value: Number(overview?.total_spend || 0), fill: "#d88f29" },
    { name: "Pending", value: Number(overview?.pending_amount || 0), fill: "#b53f33" },
  ];

  const statusChartData = (overview?.project_status_breakdown || [])
    .filter((item) => item.count > 0)
    .map((item) => ({
      name: formatStatus(item.status),
      value: item.count,
    }));

  const statusColors = ["#1f4b73", "#0b6c5c", "#d88f29", "#b53f33", "#5f6d7a"];
  const activeProjectSummaries = projectSummaries.filter(({ project }) => project.status === "active");
  const alertProjectSummaries = activeProjectSummaries;

  const projectMoneyRows = alertProjectSummaries.map(({ project, summary }) => {
    const projectProfitOrLoss = Number(summary.profit_or_loss || 0);
    return {
      name: project.code || project.name,
      spend: Number(summary.total_spend || 0),
      received: Number(summary.total_received || 0),
      profit: Math.max(projectProfitOrLoss, 0),
      loss: projectProfitOrLoss < 0 ? Math.abs(projectProfitOrLoss) : 0,
    };
  });
  const lossProjects = alertProjectSummaries
    .filter(({ summary }) => Number(summary.profit_or_loss || 0) < 0)
    .sort((first, second) => Number(first.summary.profit_or_loss || 0) - Number(second.summary.profit_or_loss || 0));
  const breakEvenProjects = alertProjectSummaries.filter(({ summary }) => Number(summary.profit_or_loss || 0) === 0);
  const criticalLossAmount = lossProjects.reduce((total, { summary }) => total + Math.abs(Number(summary.profit_or_loss || 0)), 0);
  const lossWatchRows = lossProjects.slice(0, 5).map(({ project, summary }) => ({
    id: project.id,
    label: project.name,
    value: formatCurrency(Math.abs(Number(summary.profit_or_loss || 0))),
    className: "loss-text",
  }));
  const profitProjects = alertProjectSummaries
    .filter(({ summary }) => Number(summary.profit_or_loss || 0) > 0)
    .sort((first, second) => Number(second.summary.profit_or_loss || 0) - Number(first.summary.profit_or_loss || 0));
  const totalProjectProfit = profitProjects.reduce((total, { summary }) => total + Number(summary.profit_or_loss || 0), 0);
  const profitAlertRows = profitProjects.slice(0, 3);
  const lossAlertRows = lossProjects.slice(0, 3);

  const pendingRows = pendingPayments.slice(0, 5);
  const approvalRows = pendingApprovalRows.slice(0, 5);

  const metricRows = [
    { label: "Labor", value: formatCurrency(overview?.total_labor_cost) },
    { label: "Material", value: formatCurrency(overview?.total_material_cost) },
    { label: "Other", value: formatCurrency(overview?.total_other_expenses) },
    { label: "Approval Amount", value: formatCurrency(pendingApprovalAmount) },
  ];

  const projectColumns = [
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
      key: "risk",
      label: "Risk",
      render: ({ project, summary }) => {
        const risk = buildRisk(summary, project);
        return <span className={`risk-badge ${risk.className}`}>{risk.label}</span>;
      },
    },
    { key: "spend", label: "Spend", render: ({ summary }) => formatCurrency(summary.total_spend) },
    { key: "received", label: "Received", render: ({ summary }) => formatCurrency(summary.total_received) },
    {
      key: "profit",
      label: "P / L",
      className: ({ summary }) => (Number(summary.profit_or_loss) < 0 ? "loss-text" : "profit-text"),
      render: ({ summary }) => formatCurrency(summary.profit_or_loss),
    },
  ];

  return (
    <section className="page">
      <PageTitle
        action={(
          <div className={`dashboard-result ${profitOrLoss < 0 ? "loss" : profitOrLoss > 0 ? "profit" : "neutral"}`}>
            <span>{profitOrLoss < 0 ? "Loss" : profitOrLoss > 0 ? "Profit" : "Break Even"}</span>
            <strong>{formatCurrency(profitOrLoss)}</strong>
          </div>
        )}
        eyebrow="Dashboard"
        title="Dashboard"
      />
      {/*
        Dashboard blocks below are data-driven: update arrays above, not markup.
      */}

      {loading ? <div className="notice-card">Loading dashboard data...</div> : null}
      {error ? <div className="notice-card error">{error}</div> : null}
      {mailStatus ? <div className={`notice-card ${mailStatus.type === "error" ? "error" : ""}`}>{mailStatus.text}</div> : null}

      {!loading && !error ? (
        <>
          <MetricGrid items={stats} variant="dashboard" />

          <div className="dashboard-alert-grid">
            <section className="dashboard-hero-status dashboard-hero-status--compact profit">
              <div className="dashboard-hero-copy">
                <span>Profit Alert</span>
                <h3>{profitProjects.length} of {alertProjectSummaries.length} active project{alertProjectSummaries.length === 1 ? "" : "s"} in profit</h3>
              </div>
              <div className="dashboard-hero-number">
                <span>Total Profit</span>
                <strong>{formatCurrency(totalProjectProfit)}</strong>
              </div>
              <div className="dashboard-hero-actions">
                {(profitAlertRows.length ? profitAlertRows : alertProjectSummaries.slice(0, 3)).map(({ project, summary }) => (
                  <div className="dashboard-alert-row" key={project.id}>
                    <span>{project.code || project.name}</span>
                    <strong className="profit-text">{formatCurrency(Math.max(Number(summary.profit_or_loss || 0), 0))}</strong>
                  </div>
                ))}
              </div>
            </section>

            <section className="dashboard-hero-status dashboard-hero-status--compact loss">
              <div className="dashboard-hero-copy">
                <span>Loss Alert</span>
                <h3>{lossProjects.length} of {alertProjectSummaries.length} active project{alertProjectSummaries.length === 1 ? "" : "s"} in loss</h3>
              </div>
              <div className="dashboard-hero-number">
                <span>Loss Exposure</span>
                <strong>{formatCurrency(criticalLossAmount)}</strong>
              </div>
              <div className="dashboard-hero-actions">
                {(lossAlertRows.length ? lossAlertRows : alertProjectSummaries.slice(0, 3)).map(({ project, summary }) => (
                  <div className="dashboard-alert-row" key={project.id}>
                    <span>{project.code || project.name}</span>
                    <strong className="loss-text">
                      {formatCurrency(Math.abs(Math.min(Number(summary.profit_or_loss || 0), 0)))}
                    </strong>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className={`profit-status-panel ${profitLossStatus.className}`}>
            <div className="profit-status-main">
              <span>Profit & Loss Status</span>
              <strong>{profitLossStatus.label}</strong>
              <button className="profit-status-mail-button" disabled={sendingMail} onClick={handleSendProfitLossAlert} type="button">
                {sendingMail ? "Sending Mail..." : "Mail P / L Alert"}
              </button>
            </div>
            <div className="profit-status-amount">
              <span>Net P / L</span>
              <strong>{formatCurrency(profitOrLoss)}</strong>
              <small>Margin {profitMargin.toFixed(1)}%</small>
            </div>
            <div className="profit-status-grid">
              <div>
                <span>Expected</span>
                <strong>{formatCurrency(totalExpectedRevenue)}</strong>
              </div>
              <div>
                <span>Received</span>
                <strong>{formatCurrency(totalReceived)}</strong>
              </div>
              <div>
                <span>Spend</span>
                <strong>{formatCurrency(totalSpend)}</strong>
              </div>
              <div>
                <span>Pending</span>
                <strong>{formatCurrency(pendingAmount)}</strong>
              </div>
            </div>
          </section>

          <div className="dashboard-grid">
            <section className="panel dashboard-chart-panel">
              <h3>Money</h3>
              <ResponsiveContainer width="100%" height={270}>
                <BarChart data={moneyChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(value) => `Rs ${Number(value) / 1000}k`} tickLine={false} axisLine={false} width={64} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {moneyChartData.map((entry) => (
                      <Cell fill={entry.fill} key={entry.name} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </section>

            <section className="panel dashboard-chart-panel">
              <h3>Project Status</h3>
              <ResponsiveContainer width="100%" height={270}>
                <PieChart>
                  <Pie data={statusChartData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={94} paddingAngle={4}>
                    {statusChartData.map((entry, index) => (
                      <Cell fill={statusColors[index % statusColors.length]} key={entry.name} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </section>
          </div>

          <div className="dashboard-grid dashboard-grid--three">
            <section className="panel dashboard-list-panel">
              <h3>Cost Breakup</h3>
              <ValueList items={metricRows} />
            </section>

            <section className="panel dashboard-list-panel">
              <h3>Pending Collections</h3>
              <ValueList
                emptyLabel="Collections"
                emptyValue={formatCurrency(0)}
                items={pendingRows.map((item) => ({
                  id: item.project_id,
                  label: item.project_name,
                  value: formatCurrency(item.pending_amount),
                }))}
              />
            </section>

            <section className="panel dashboard-list-panel">
              <h3>Approvals</h3>
              <ValueList
                emptyLabel="Pending"
                emptyValue={pendingApprovalCount}
                items={approvalRows.map((approval) => ({
                  id: approval.id,
                  label: approval.module_name || approval.request_type,
                  value: formatCurrency(approval.amount),
                }))}
              />
            </section>

            <section className="panel dashboard-list-panel">
              <h3>Loss Watch</h3>
              <ValueList
                emptyLabel="No Loss"
                emptyValue={formatCurrency(0)}
                items={lossWatchRows}
              />
            </section>
          </div>

          <section className="panel dashboard-chart-panel">
            <h3>Active Project Spend vs Collection</h3>
            <ResponsiveContainer width="100%" height={310}>
              <BarChart data={projectMoneyRows}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(value) => `Rs ${Number(value) / 1000}k`} tickLine={false} axisLine={false} width={64} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="spend" fill="#d88f29" name="Spend" radius={[6, 6, 0, 0]} />
                <Bar dataKey="received" fill="#0b6c5c" name="Received" radius={[6, 6, 0, 0]} />
                <Bar dataKey="profit" fill="#14745d" name="Profit" radius={[6, 6, 0, 0]} />
                <Bar dataKey="loss" fill="#b84035" name="Loss" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </section>

          <DataTable
            columns={projectColumns}
            emptyText="No projects."
            getRowKey={({ project }) => project.id}
            rows={projectSummaries}
          />
        </>
      ) : null}
    </section>
  );
}
