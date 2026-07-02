import React from "react";

export function PageTitle({ title, action }) {
  return (
    <div className="page-header">
      <div>
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function MetricGrid({ items, className = "", variant = "stat" }) {
  const gridClassName = variant === "dashboard" ? "dashboard-metric-grid" : "stats-grid stats-grid--three";
  const itemClassName = variant === "dashboard" ? "dashboard-metric" : "stat-card";

  return (
    <div className={`${gridClassName} ${className}`.trim()}>
      {items.map((item) => (
        <article className={itemClassName} key={item.label}>
          <span>{item.label}</span>
          <strong className={item.className}>{item.value}</strong>
        </article>
      ))}
    </div>
  );
}

export function PanelTitle({ title }) {
  return (
    <div className="section-heading">
      <div>
        <h3>{title}</h3>
      </div>
    </div>
  );
}

export function ValueList({ items, emptyLabel = "No data", emptyValue = "" }) {
  const rows = items.length ? items : [{ label: emptyLabel, value: emptyValue }];

  return (
    <div className="dashboard-value-list">
      {rows.map((item) => (
        <div key={item.id || item.label}>
          <span>{item.label}</span>
          <strong className={item.className}>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

export function ActionList({ items, emptyTitle = "Clear", emptyText = "No items." }) {
  const rows = items.length ? items : [{ title: emptyTitle, text: emptyText }];

  return (
    <div className="check-list">
      {rows.map((item) => (
        <div className="check-item" key={item.id || item.title}>
          <strong>{item.title}</strong>
          {item.text ? <span>{item.text}</span> : null}
        </div>
      ))}
    </div>
  );
}

export function DataTable({ columns, rows, emptyText = "No data.", getRowKey }) {
  return (
    <div className="table-card">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="empty-cell" colSpan={columns.length}>
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr key={getRowKey ? getRowKey(row, rowIndex) : row.id || rowIndex}>
                {columns.map((column) => (
                  <td className={column.className ? column.className(row) : undefined} key={column.key}>
                    {column.render ? column.render(row, rowIndex) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
