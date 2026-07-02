import React from "react";

import { DataTable, MetricGrid, PageTitle, ValueList } from "../components/DataViews";
import { formatCurrency } from "../utils/formatters";

const moduleRows = [
  {
    title: "Authentication & User Management",
    status: "Foundation Ready",
    className: "medium",
  },
  {
    title: "Dashboard & Analytics",
    status: "Partially Live",
    className: "medium",
  },
  {
    title: "Project Management",
    status: "Live",
    className: "low",
  },
  {
    title: "Daily Reports Module",
    status: "Live",
    className: "low",
  },
  {
    title: "Expense Management",
    status: "Live",
    className: "low",
  },
  {
    title: "Material Management",
    status: "Live",
    className: "low",
  },
  {
    title: "Labor Management",
    status: "Live",
    className: "low",
  },
  {
    title: "Photo Gallery",
    status: "Foundation Ready",
    className: "medium",
  },
  {
    title: "Reports Module",
    status: "Live",
    className: "low",
  },
  {
    title: "Quotation Management",
    status: "Live",
    className: "low",
  },
  {
    title: "Deployment & Production Setup",
    status: "Planned",
    className: "high",
  },
];

const phases = [
  {
    title: "Core Control",
    duration: "Week 1",
  },
  {
    title: "Site Execution",
    duration: "Week 2 to Week 3",
  },
  {
    title: "Commercial Tracking",
    duration: "Week 4",
  },
  {
    title: "Delivery and Launch",
    duration: "Week 5 to Week 6",
  },
];

const pricingRows = [
  { label: "CRM Development", amount: 120000 },
  { label: "Analytics & Advanced Features", amount: 40000 },
  { label: "Deployment & Server Setup", amount: 15000 },
  { label: "Support & Maintenance", amount: 25000 },
];

const paymentTerms = ["40% advance payment", "40% during development", "20% upon final delivery"];

export default function DeliveryRoadmapPage() {
  const totalCost = pricingRows.reduce((sum, item) => sum + item.amount, 0);
  const liveModules = moduleRows.filter((module) => module.status === "Live").length;
  const pendingModules = moduleRows.length - liveModules;
  const metrics = [
    { label: "Cost", value: formatCurrency(totalCost) },
    { label: "Team", value: "2 Developers" },
    { label: "Modules", value: moduleRows.length },
    { label: "Live", value: liveModules },
    { label: "Pending", value: pendingModules },
  ];
  const moduleColumns = [
    {
      key: "title",
      label: "Module",
      render: (module) => <strong>{module.title}</strong>,
    },
    {
      key: "status",
      label: "Status",
      render: (module) => <span className={`risk-badge ${module.className}`}>{module.status}</span>,
    },
  ];
  const pricingColumns = [
    { key: "label", label: "Description" },
    { key: "amount", label: "Amount", render: (row) => formatCurrency(row.amount) },
  ];
  const pricingTableRows = [...pricingRows, { label: "Total Project Cost", amount: totalCost }];

  return (
    <section className="page">
      <PageTitle
        action={<div className="pill">5 to 6 Weeks</div>}
        eyebrow="Roadmap"
        title="Charles CRM Scope"
      />

      <MetricGrid className="roadmap-metric-grid" items={metrics} variant="dashboard" />

      <DataTable columns={moduleColumns} getRowKey={(module) => module.title} rows={moduleRows} />

      <div className="split-layout split-layout--equal">
        <section className="panel">
          <h3 className="compact-panel-title">Order</h3>
          <div className="timeline-list">
            {phases.map((phase) => (
              <div className="timeline-item" key={phase.title}>
                <strong>{phase.title}</strong>
                <span>{phase.duration}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <h3 className="compact-panel-title">Payment</h3>
          <ValueList items={paymentTerms.map((term) => ({ label: term, value: "" }))} />
        </section>
      </div>

      <div className="split-layout split-layout--equal">
        <DataTable columns={pricingColumns} getRowKey={(row) => row.label} rows={pricingTableRows} />

        <section className="panel">
          <h3 className="compact-panel-title">Notes</h3>
          <ValueList
            items={[
              { label: "Support", value: "Included" },
              { label: "Extra Scope", value: "Separate" },
              { label: "Third-party Charges", value: "Separate" },
            ]}
          />
        </section>
      </div>
    </section>
  );
}
