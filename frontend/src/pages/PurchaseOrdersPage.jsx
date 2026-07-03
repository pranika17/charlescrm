import React, { useEffect, useState } from "react";
import { DataTable, MetricGrid, PageTitle, PanelTitle } from "../components/DataViews";
import { createPurchaseOrder, fetchProjects, fetchPurchaseOrders, fetchVendors } from "../services/api";
import { formatCurrency, toNumber } from "../utils/formatters";

const initialForm = {
  project: "",
  po_number: "",
  vendor: "",
  total_amount: "",
  status: "pending",
};

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [vendors, setVendors] = useState([]);
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
      setOrders([]);
      setVendors([]);
      return;
    }

    try {
      const [orderResponse, vendorResponse] = await Promise.all([fetchPurchaseOrders(selectedProject), fetchVendors()]);

      if (Array.isArray(orderResponse)) {
        setOrders(orderResponse);
      } else if (orderResponse?.results) {
        setOrders(orderResponse.results);
      } else {
        setOrders([]);
      }

      if (Array.isArray(vendorResponse)) {
        setVendors(vendorResponse);
      } else if (vendorResponse?.results) {
        setVendors(vendorResponse.results);
      } else {
        setVendors([]);
      }
    } catch (error) {
      console.error("Purchase Orders Error:", error);
      setOrders([]);
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
        setError("Choose a project before saving purchase order.");
        setSaving(false);
        return;
      }

      await createPurchaseOrder({
        ...form,
        project: Number(form.project),
        vendor: Number(form.vendor),
        total_amount: toNumber(form.total_amount),
      });
      setForm((current) => ({ ...initialForm, project: current.project }));
      await loadData();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  const rows = Array.isArray(orders) ? orders : [];
  const vendorById = new Map(vendors.map((vendor) => [vendor.id, vendor.name]));
  const totalValue = rows.reduce((total, order) => total + toNumber(order.total_amount), 0);
  const stats = [
    { label: "Orders", value: rows.length },
    { label: "Pending", value: rows.filter((order) => order.status === "pending").length },
    { label: "Total Value", value: formatCurrency(totalValue) },
  ];

  const columns = [
    { key: "po_number", label: "PO Number" },
    {
      key: "vendor",
      label: "Vendor",
      render: (row) => row.vendor_name || vendorById.get(row.vendor) || row.vendor || "-",
    },
    { key: "total_amount", label: "Amount", render: (row) => formatCurrency(row.total_amount) },
    {
      key: "status",
      label: "Status",
      render: (row) => <span className={`status-badge ${row.status}`}>{row.status}</span>,
    },
  ];

  return (
    <section className="page">
      <PageTitle eyebrow="Procurement" title="Purchase Orders" />

      <MetricGrid items={stats} />

      <div className="panel">
        <PanelTitle title="Choose Project">Purchase orders are stored against the selected project.</PanelTitle>
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
          <PanelTitle title="Add Purchase Order">Use a unique PO number and select the supplier.</PanelTitle>

          {error ? <div className="notice-card error">{error}</div> : null}

          <form className="form-grid form-grid--two" onSubmit={handleSubmit}>
            <label className="field">
              <span>PO Number</span>
              <input name="po_number" onChange={handleChange} required value={form.po_number} />
            </label>
            <label className="field">
              <span>Vendor</span>
              <select name="vendor" onChange={handleChange} required value={form.vendor}>
                <option value="">Select vendor</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Total Amount</span>
              <input min="0" name="total_amount" onChange={handleChange} required step="0.01" type="number" value={form.total_amount} />
            </label>
            <label className="field">
              <span>Status</span>
              <select name="status" onChange={handleChange} value={form.status}>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="received">Received</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
            <button className="primary-button" disabled={saving} type="submit">
              {saving ? "Saving..." : "Save Purchase Order"}
            </button>
          </form>
        </section>

        <DataTable columns={columns} rows={rows} emptyText="No purchase orders found." />
      </div>
    </section>
  );
}
