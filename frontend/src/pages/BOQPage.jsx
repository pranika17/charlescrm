import React, { useEffect, useState } from "react";
import { DataTable, MetricGrid, PageTitle, PanelTitle } from "../components/DataViews";
import { createBOQ, fetchBOQ, fetchProjects } from "../services/api";
import { formatCurrency } from "../utils/formatters";

const initialForm = {
  project: "",
  item_name: "",
  category: "",
  quantity: "",
  unit: "",
  unit_rate: "",
};

export default function BOQPage() {
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [form, setForm] = useState(initialForm);
  const [showItemForm, setShowItemForm] = useState(false);
  const [selectedSavedItem, setSelectedSavedItem] = useState("new");
  const [selectedCategory, setSelectedCategory] = useState("new");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

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
      setItems([]);
      return;
    }

    try {
      const response = await fetchBOQ(selectedProject);

      if (Array.isArray(response)) {
        setItems(response);
      } else if (response?.results) {
        setItems(response.results);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error("BOQ Error:", error);
      setItems([]);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setSaveMessage("");
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleSavedItemChange(event) {
    const value = event.target.value;
    setSaveMessage("");
    setSelectedSavedItem(value);

    if (value === "new") {
      setForm(initialForm);
      setSelectedCategory("new");
      return;
    }

    const item = rows.find((row) => String(row.id) === value);
    if (!item) {
      return;
    }

    setForm({
      item_name: item.item_name || "",
      category: item.category || "",
      quantity: "",
      unit: item.unit || "",
      unit_rate: String(item.unit_rate || ""),
    });
    setSelectedCategory(item.category || "new");
  }

  function handleCategoryChange(event) {
    const value = event.target.value;
    setSaveMessage("");
    setSelectedCategory(value);
    setForm((current) => ({
      ...current,
      category: value === "new" ? "" : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSaveMessage("");

    if (!form.item_name.trim()) {
      setError("Item name is required.");
      return;
    }
    if (!form.project) {
      setError("Choose a project before saving BOQ.");
      return;
    }
    if (!form.category.trim()) {
      setError("Category is required.");
      return;
    }
    if (!form.unit.trim()) {
      setError("Unit is required.");
      return;
    }
    if (Number(form.quantity) <= 0) {
      setError("Quantity must be greater than zero.");
      return;
    }
    if (Number(form.unit_rate) < 0) {
      setError("Unit rate cannot be negative.");
      return;
    }

    setSaving(true);

    try {
      await createBOQ({
        ...form,
        project: Number(form.project),
        quantity: Number(form.quantity),
        unit_rate: Number(form.unit_rate),
      });
      setForm((current) => ({ ...initialForm, project: current.project }));
      setSelectedSavedItem("new");
      setSelectedCategory("new");
      setShowItemForm(false);
      await loadData();
      setSaveMessage("BOQ item saved.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  const rows = Array.isArray(items) ? items : [];
  const savedItems = rows.reduce((accumulator, item) => {
    if (!item.item_name || accumulator.some((savedItem) => savedItem.item_name === item.item_name)) {
      return accumulator;
    }
    return [...accumulator, item];
  }, []);
  const savedCategories = Array.from(new Set(rows.map((item) => item.category).filter(Boolean))).sort();
  const totalCost = rows.reduce((total, item) => total + Number(item.total_cost || Number(item.quantity || 0) * Number(item.unit_rate || 0)), 0);
  const stats = [
    { label: "BOQ Items", value: rows.length },
    { label: "Categories", value: new Set(rows.map((item) => item.category).filter(Boolean)).size },
    { label: "Total Cost", value: formatCurrency(totalCost) },
  ];

  const columns = [
    { key: "item_name", label: "Item" },
    { key: "category", label: "Category" },
    { key: "quantity", label: "Qty" },
    { key: "unit", label: "Unit" },
    { key: "unit_rate", label: "Rate", render: (row) => formatCurrency(row.unit_rate) },
    { key: "total_cost", label: "Total Cost", render: (row) => formatCurrency(row.total_cost) },
  ];

  return (
    <section className="page">
      <PageTitle eyebrow="Planning" title="BOQ Management">
        <p className="page-intro">Build a clear bill of quantities with category, unit, rate, and total cost visibility.</p>
      </PageTitle>

      <MetricGrid items={stats} />

      <div className="panel">
        <PanelTitle title="Choose Project" />
        <label className="field">
          <span>Project</span>
          <select
            className="field-control"
            value={selectedProject}
            onChange={(event) => {
              const projectId = event.target.value;
              setSelectedProject(projectId);
              setForm((current) => ({ ...current, project: projectId }));
              setSelectedSavedItem("new");
              setSelectedCategory("new");
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

      {saveMessage ? <div className="notice-card success">{saveMessage}</div> : null}

      <div className="boq-toolbar">
        <button className="primary-button" onClick={() => setShowItemForm((current) => !current)} type="button">
          {showItemForm ? "Close Add Item" : "+ Add BOQ Item"}
        </button>
      </div>

      <div className={showItemForm ? "split-layout split-layout--wide" : "boq-table-only"}>
        {showItemForm ? (
        <section className="panel">
          <div className="section-heading">
            <div>
              <h3>Add BOQ Item</h3>
            </div>
            <button className="small-button small-button--muted" onClick={() => setShowItemForm(false)} type="button">
              Close
            </button>
          </div>
          {error ? <div className="notice-card error">{error}</div> : null}

          <form className="form-grid form-grid--two" onSubmit={handleSubmit}>
            <label className="field field--full">
              <span>BOQ Item</span>
              <select className="field-control" onChange={handleSavedItemChange} value={selectedSavedItem}>
                <option value="new">+ Add new item</option>
                {savedItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.item_name}
                  </option>
                ))}
              </select>
            </label>
            {selectedSavedItem === "new" ? (
              <label className="field field--full">
                <span>New Item Name</span>
                <input name="item_name" onChange={handleChange} required value={form.item_name} />
              </label>
            ) : null}
            {selectedSavedItem !== "new" ? (
              <div className="boq-selected-item field--full">
                <div>
                  <span>Selected Item</span>
                  <strong>{form.item_name}</strong>
                </div>
                <button className="small-button small-button--muted" onClick={() => handleSavedItemChange({ target: { value: "new" } })} type="button">
                  Add Different Item
                </button>
              </div>
            ) : null}
            <label className="field">
              <span>Category</span>
              <select className="field-control" onChange={handleCategoryChange} value={selectedCategory}>
                <option value="new">+ Add new category</option>
                {savedCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            {selectedCategory === "new" ? (
            <label className="field">
              <span>New Category</span>
              <input name="category" onChange={handleChange} required value={form.category} />
            </label>
            ) : null}
            <label className="field">
              <span>Unit</span>
              <input name="unit" onChange={handleChange} required value={form.unit} />
            </label>
            <label className="field">
              <span>Quantity</span>
              <input min="0" name="quantity" onChange={handleChange} required step="0.01" type="number" value={form.quantity} />
            </label>
            <label className="field">
              <span>Unit Rate</span>
              <input min="0" name="unit_rate" onChange={handleChange} required step="0.01" type="number" value={form.unit_rate} />
            </label>
            <button className="primary-button" disabled={saving} type="submit">
              {saving ? "Saving..." : "Save BOQ Item"}
            </button>
          </form>
        </section>
        ) : null}

        <DataTable columns={columns} rows={rows} emptyText="No BOQ items found." />
      </div>
    </section>
  );
}
