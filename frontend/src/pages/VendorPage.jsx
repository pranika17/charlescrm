import React, { useEffect, useState } from "react";
import { DataTable, MetricGrid, PageTitle, PanelTitle } from "../components/DataViews";
import { createVendor, fetchVendors } from "../services/api";

const initialForm = {
  name: "",
  phone: "",
  email: "",
  gst_number: "",
  address: "",
};

export default function VendorPage() {
  const [vendors, setVendors] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const response = await fetchVendors();

      if (Array.isArray(response)) {
        setVendors(response);
      } else if (response?.results) {
        setVendors(response.results);
      } else {
        setVendors([]);
      }
    } catch (error) {
      console.error("Vendor Error:", error);
      setVendors([]);
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
      await createVendor(form);
      setForm(initialForm);
      await loadData();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  const rows = Array.isArray(vendors) ? vendors : [];
  const stats = [
    { label: "Vendors", value: rows.length },
    { label: "GST Ready", value: rows.filter((vendor) => vendor.gst_number).length },
    { label: "With Email", value: rows.filter((vendor) => vendor.email).length },
  ];

  const columns = [
    {
      key: "name",
      label: "Vendor",
      render: (row) => (
        <>
          <strong>{row.name}</strong>
          <div className="table-subtle">{row.address || "Address not added"}</div>
        </>
      ),
    },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
    { key: "gst_number", label: "GST Number" },
  ];

  return (
    <section className="page">
      <PageTitle eyebrow="Commercial" title="Vendor Management">
        <p className="page-intro">Add supplier records with contact, GST, and address details for purchase planning.</p>
      </PageTitle>

      <MetricGrid items={stats} />

      <div className="split-layout split-layout--wide">
        <section className="panel">
          <PanelTitle title="Add Vendor">Fill the supplier fields used by procurement and purchase orders.</PanelTitle>

          {error ? <div className="notice-card error">{error}</div> : null}

          <form className="form-grid form-grid--two" onSubmit={handleSubmit}>
            <label className="field">
              <span>Vendor Name</span>
              <input name="name" onChange={handleChange} required value={form.name} />
            </label>
            <label className="field">
              <span>Phone</span>
              <input name="phone" onChange={handleChange} required value={form.phone} />
            </label>
            <label className="field">
              <span>Email</span>
              <input name="email" onChange={handleChange} type="email" value={form.email} />
            </label>
            <label className="field">
              <span>GST Number</span>
              <input name="gst_number" onChange={handleChange} value={form.gst_number} />
            </label>
            <label className="field field--full">
              <span>Address</span>
              <textarea name="address" onChange={handleChange} value={form.address} />
            </label>
            <button className="primary-button" disabled={saving} type="submit">
              {saving ? "Saving..." : "Save Vendor"}
            </button>
          </form>
        </section>

        <DataTable columns={columns} rows={rows} emptyText="No vendors found." />
      </div>
    </section>
  );
}
