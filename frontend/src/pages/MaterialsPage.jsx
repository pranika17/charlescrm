import React, { useEffect, useMemo, useState } from "react";

import { DataTable, MetricGrid } from "../components/DataViews";
import VoiceField from "../components/VoiceField";
import {
  createMaterial,
  createMaterialPurchase,
  createMaterialUsage,
  fetchMaterialPurchases,
  fetchMaterialUsage,
  fetchMaterials,
  fetchProjects,
} from "../services/api";
import { formatCurrency } from "../utils/formatters";

const materialCategories = [
  "Concrete Materials",
  "Steel",
  "Masonry",
  "Finishes",
  "Electrical",
  "Plumbing",
  "Waterproofing",
  "Hardware",
  "Site Consumables",
];

const materialUnits = ["bag", "kg", "ton", "cft", "cum", "nos", "load", "roll", "sheet", "litre", "meter"];

const initialMaterialForm = {
  name: "",
  category: "",
  unit: "nos",
  default_rate: "",
  description: "",
};

const initialPurchaseForm = {
  project: "",
  material: "",
  supplier_name: "",
  quantity: "",
  unit_rate: "",
  total_amount: "",
  purchase_date: "",
  invoice_number: "",
  notes: "",
};

const initialUsageForm = {
  project: "",
  material: "",
  usage_date: "",
  quantity_used: "",
  quantity_wasted: "0",
  area_or_task: "",
  notes: "",
};

function calculatePurchaseTotal(form) {
  return Number(form.quantity || 0) * Number(form.unit_rate || 0);
}

function validateMaterialForm(form) {
  if (!form.name.trim()) {
    return "Material name is required.";
  }
  if (!form.unit.trim()) {
    return "Unit is required.";
  }
  if (Number(form.default_rate || 0) < 0) {
    return "Default rate cannot be negative.";
  }
  return "";
}

function validatePurchaseForm(form) {
  if (!form.project) {
    return "Choose a project before saving the purchase.";
  }
  if (!form.material) {
    return "Select a material.";
  }
  if (!form.purchase_date) {
    return "Purchase date is required.";
  }
  if (Number(form.quantity) <= 0) {
    return "Purchase quantity must be greater than zero.";
  }
  if (Number(form.unit_rate) <= 0) {
    return "Unit rate must be greater than zero.";
  }
  return "";
}

function validateUsageForm(form) {
  if (!form.project) {
    return "Choose a project before saving material usage.";
  }
  if (!form.material) {
    return "Select a material.";
  }
  if (!form.usage_date) {
    return "Usage date is required.";
  }
  if (Number(form.quantity_used) <= 0) {
    return "Quantity used must be greater than zero.";
  }
  if (Number(form.quantity_wasted || 0) < 0) {
    return "Quantity wasted cannot be negative.";
  }
  return "";
}

export default function MaterialsPage() {
  const [projects, setProjects] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [purchases, setPurchases] = useState([]);
  const [usageEntries, setUsageEntries] = useState([]);
  const [materialForm, setMaterialForm] = useState(initialMaterialForm);
  const [purchaseForm, setPurchaseForm] = useState(initialPurchaseForm);
  const [usageForm, setUsageForm] = useState(initialUsageForm);
  const [error, setError] = useState("");

  useEffect(() => {
    async function bootstrap() {
      try {
        const [projectList, materialList] = await Promise.all([fetchProjects(), fetchMaterials()]);
        setProjects(projectList);
        setMaterials(materialList);

        if (projectList[0]) {
          const projectId = String(projectList[0].id);
          setSelectedProject(projectId);
          setPurchaseForm((current) => ({ ...current, project: projectId }));
          setUsageForm((current) => ({ ...current, project: projectId }));
        }
      } catch (requestError) {
        setError(requestError.message);
      }
    }

    bootstrap();
  }, []);

  useEffect(() => {
    async function loadMaterialRows() {
      if (!selectedProject) {
        setPurchases([]);
        setUsageEntries([]);
        return;
      }

      try {
        const [purchaseRows, usageRows] = await Promise.all([fetchMaterialPurchases(selectedProject), fetchMaterialUsage(selectedProject)]);
        setPurchases(purchaseRows);
        setUsageEntries(usageRows);
      } catch (requestError) {
        setError(requestError.message);
      }
    }

    loadMaterialRows();
  }, [selectedProject]);

  const purchaseTotal = useMemo(() => calculatePurchaseTotal(purchaseForm), [purchaseForm]);
  const totalPurchasedValue = useMemo(() => purchases.reduce((sum, item) => sum + Number(item.total_amount || 0), 0), [purchases]);
  const totalUsedQty = useMemo(() => usageEntries.reduce((sum, item) => sum + Number(item.quantity_used || 0), 0), [usageEntries]);
  const totalWasteQty = useMemo(() => usageEntries.reduce((sum, item) => sum + Number(item.quantity_wasted || 0), 0), [usageEntries]);
  const metrics = [
    { label: "Material Master", value: materials.length, trend: "Standardized items available for site entries" },
    { label: "Purchased Value", value: formatCurrency(totalPurchasedValue), trend: "Recorded procurement value for the selected project" },
    { label: "Waste Logged", value: totalWasteQty, trend: "Wastage entries that explain stock leakage" },
  ];
  const purchaseColumns = [
    { key: "material", label: "Material", render: (purchase) => getMaterialLabel(purchase.material) },
    { key: "purchase_date", label: "Date" },
    { key: "quantity", label: "Quantity" },
    { key: "total_amount", label: "Total", render: (purchase) => formatCurrency(purchase.total_amount) },
  ];
  const usageColumns = [
    { key: "material", label: "Material", render: (entry) => getMaterialLabel(entry.material) },
    { key: "usage_date", label: "Date" },
    { key: "quantity_used", label: "Used" },
    { key: "quantity_wasted", label: "Waste" },
  ];

  function getMaterialLabel(materialId) {
    const material = materials.find((item) => String(item.id) === String(materialId));
    return material ? material.name : `Material #${materialId}`;
  }

  async function refreshMaterials() {
    setMaterials(await fetchMaterials());
  }

  async function handleMaterialSubmit(event) {
    event.preventDefault();
    const validationError = validateMaterialForm(materialForm);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    try {
      await createMaterial({
        ...materialForm,
        name: materialForm.name.trim(),
        category: materialForm.category.trim(),
        unit: materialForm.unit.trim(),
        description: materialForm.description.trim(),
        default_rate: Number(materialForm.default_rate || 0),
      });
      setMaterialForm(initialMaterialForm);
      await refreshMaterials();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handlePurchaseSubmit(event) {
    event.preventDefault();
    const validationError = validatePurchaseForm(purchaseForm);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    try {
      await createMaterialPurchase({
        ...purchaseForm,
        supplier_name: purchaseForm.supplier_name.trim(),
        invoice_number: purchaseForm.invoice_number.trim(),
        notes: purchaseForm.notes.trim(),
        quantity: Number(purchaseForm.quantity),
        unit_rate: Number(purchaseForm.unit_rate),
        total_amount: purchaseTotal,
      });
      setPurchaseForm((current) => ({ ...initialPurchaseForm, project: current.project, material: current.material }));
      setPurchases(await fetchMaterialPurchases(selectedProject));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleUsageSubmit(event) {
    event.preventDefault();
    const validationError = validateUsageForm(usageForm);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    try {
      await createMaterialUsage({
        ...usageForm,
        area_or_task: usageForm.area_or_task.trim(),
        notes: usageForm.notes.trim(),
        quantity_used: Number(usageForm.quantity_used),
        quantity_wasted: Number(usageForm.quantity_wasted || 0),
      });
      setUsageForm((current) => ({ ...initialUsageForm, project: current.project, material: current.material }));
      setUsageEntries(await fetchMaterialUsage(selectedProject));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Stock and Consumption</p>
          <h2>Materials</h2>
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
              setPurchaseForm((current) => ({ ...current, project: projectId }));
              setUsageForm((current) => ({ ...current, project: projectId }));
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
              <h3>Create Material Master</h3>
            </div>
          </div>
          <form className="form-grid form-grid--two" onSubmit={handleMaterialSubmit}>
            <VoiceField label="Material Name" onChangeValue={(value) => setMaterialForm((current) => ({ ...current, name: value }))} placeholder="Example: OPC Cement 53 Grade" value={materialForm.name} />
            <VoiceField
              helper="Use broad groups for easier procurement filtering."
              label="Category"
              list="material-category-options"
              onChangeValue={(value) => setMaterialForm((current) => ({ ...current, category: value }))}
              placeholder="Example: Concrete Materials"
              value={materialForm.category}
            />
            <VoiceField
              helper="Common units include bag, kg, ton, cft, cum, nos, and metre."
              label="Unit"
              list="material-unit-options"
              onChangeValue={(value) => setMaterialForm((current) => ({ ...current, unit: value }))}
              placeholder="Example: bag"
              value={materialForm.unit}
            />
            <VoiceField
              label="Default Rate"
              min="0"
              step="0.01"
              onChangeValue={(value) => setMaterialForm((current) => ({ ...current, default_rate: value }))}
              type="number"
              value={materialForm.default_rate}
              voiceHint="Say a numeric rate."
            />
            <VoiceField
              appendVoice
              className="field field--full"
              control="textarea"
              label="Description"
              onChangeValue={(value) => setMaterialForm((current) => ({ ...current, description: value }))}
              placeholder="Example: Used for slab, beam, and column concreting."
              rows={3}
              value={materialForm.description}
            />
            <button className="primary-button" type="submit">
              Save Material
            </button>
          </form>

          <datalist id="material-category-options">
            {materialCategories.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
          <datalist id="material-unit-options">
            {materialUnits.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </section>

        <section className="panel panel--stacked">
          <div className="stat-stack">
            <div className="stat-inline">
              <span>Total Quantity Used</span>
              <strong>{totalUsedQty}</strong>
            </div>
            <div className="stat-inline">
              <span>Waste Quantity</span>
              <strong>{totalWasteQty}</strong>
            </div>
          </div>
        </section>
      </div>

      <div className="split-layout split-layout--equal">
        <section className="panel">
          <div className="section-heading">
            <div>
              <h3>Record Material Purchase</h3>
            </div>
          </div>
          <form className="form-grid form-grid--two" onSubmit={handlePurchaseSubmit}>
            <label className="field">
              <span>Material</span>
              <select className="field-control" value={purchaseForm.material} onChange={(event) => setPurchaseForm((current) => ({ ...current, material: event.target.value }))}>
                <option value="">Select a material</option>
                {materials.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.name} ({material.unit})
                  </option>
                ))}
              </select>
            </label>
            <VoiceField label="Supplier Name" onChangeValue={(value) => setPurchaseForm((current) => ({ ...current, supplier_name: value }))} placeholder="Example: Sree Venkateswara Traders" value={purchaseForm.supplier_name} />
            <VoiceField label="Quantity" min="0" step="0.01" onChangeValue={(value) => setPurchaseForm((current) => ({ ...current, quantity: value }))} type="number" value={purchaseForm.quantity} voiceHint="Say a numeric quantity." />
            <VoiceField label="Unit Rate" min="0" step="0.01" onChangeValue={(value) => setPurchaseForm((current) => ({ ...current, unit_rate: value }))} type="number" value={purchaseForm.unit_rate} voiceHint="Say a numeric rate." />
            <VoiceField label="Purchase Date" onChangeValue={(value) => setPurchaseForm((current) => ({ ...current, purchase_date: value }))} type="date" value={purchaseForm.purchase_date} voiceHint="Say a valid purchase date." />
            <VoiceField label="Invoice Number" onChangeValue={(value) => setPurchaseForm((current) => ({ ...current, invoice_number: value }))} placeholder="Example: INV-5529" value={purchaseForm.invoice_number} />
            <label className="field">
              <span>Total Amount</span>
              <input className="field-control" disabled type="text" value={formatCurrency(purchaseTotal)} />
              <span className="field-hint">Calculated from quantity x unit rate.</span>
            </label>
            <VoiceField
              appendVoice
              className="field field--full"
              control="textarea"
              label="Notes"
              onChangeValue={(value) => setPurchaseForm((current) => ({ ...current, notes: value }))}
              placeholder="Example: Delivered directly to site stockyard for footing concreting."
              rows={3}
              value={purchaseForm.notes}
            />
            <button className="primary-button" type="submit">
              Save Purchase
            </button>
          </form>
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <h3>Record Material Usage</h3>
            </div>
          </div>
          <form className="form-grid form-grid--two" onSubmit={handleUsageSubmit}>
            <label className="field">
              <span>Material</span>
              <select className="field-control" value={usageForm.material} onChange={(event) => setUsageForm((current) => ({ ...current, material: event.target.value }))}>
                <option value="">Select a material</option>
                {materials.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.name} ({material.unit})
                  </option>
                ))}
              </select>
            </label>
            <VoiceField label="Usage Date" onChangeValue={(value) => setUsageForm((current) => ({ ...current, usage_date: value }))} type="date" value={usageForm.usage_date} voiceHint="Say a valid usage date." />
            <VoiceField label="Quantity Used" min="0" step="0.01" onChangeValue={(value) => setUsageForm((current) => ({ ...current, quantity_used: value }))} type="number" value={usageForm.quantity_used} voiceHint="Say a numeric used quantity." />
            <VoiceField label="Quantity Wasted" min="0" step="0.01" onChangeValue={(value) => setUsageForm((current) => ({ ...current, quantity_wasted: value }))} type="number" value={usageForm.quantity_wasted} voiceHint="Say a numeric wastage quantity." />
            <VoiceField
              helper="Mention area, floor, grid, or activity."
              label="Area or Task"
              onChangeValue={(value) => setUsageForm((current) => ({ ...current, area_or_task: value }))}
              placeholder="Example: Ground floor blockwork east wing"
              value={usageForm.area_or_task}
            />
            <VoiceField
              appendVoice
              className="field field--full"
              control="textarea"
              label="Notes"
              onChangeValue={(value) => setUsageForm((current) => ({ ...current, notes: value }))}
              placeholder="Example: Extra mortar consumption due to uneven old wall surface."
              rows={3}
              value={usageForm.notes}
            />
            <button className="primary-button" type="submit">
              Save Usage
            </button>
          </form>
        </section>
      </div>

      <div className="split-layout split-layout--equal">
        <DataTable columns={purchaseColumns} emptyText="No material purchases recorded for this project." rows={purchases} />
        <DataTable columns={usageColumns} emptyText="No material usage recorded for this project." rows={usageEntries} />
      </div>
    </section>
  );
}
