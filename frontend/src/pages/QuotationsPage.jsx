import React, { useEffect, useMemo, useState } from "react";

import { MetricGrid, PageTitle, PanelTitle } from "../components/DataViews";
import VoiceField from "../components/VoiceField";
import { convertQuotationToProject, createQuotation, deleteQuotation, fetchQuotations } from "../services/api";
import { formatCurrency, formatStatus } from "../utils/formatters";

const COMPANY_NAME = "Charles Civil Engineering";
const COMPANY_TAGLINE = "Civil Construction Quotation";
const CEO_NAME = "Charles";
const CEO_TITLE = "Civil CEO";
const COMPANY_TERMS = [
  "Quoted rates are valid only until the validity date mentioned in this quotation.",
  "Material rates are based on current market prices and may be revised if supplier rates change before work order confirmation.",
  "Any extra work, drawing change, client variation, or authority requirement will be billed separately after written approval.",
  "Work will start only after advance payment, final drawing confirmation, and site handover.",
  "Taxes, statutory approvals, government fees, EB/water deposits, and third-party charges are excluded unless clearly mentioned.",
  "Payment delays may affect procurement, manpower deployment, and project schedule.",
];
const COMPANY_POLICY = [
  "All work will follow approved drawings, agreed specifications, and standard civil construction practice.",
  "Client must provide site access, water, electricity, approvals, and timely decisions wherever required.",
  "Warranty applies only to workmanship defects and excludes misuse, structural changes, natural wear, seepage from external sources, and force majeure events.",
  "Final measurements, quality checks, and handover notes must be reviewed and signed by both parties.",
];

const initialLineItem = {
  category: "",
  description: "",
  quantity: "1",
  unit: "",
  unit_rate: "",
};

const initialForm = {
  project_name: "",
  client_name: "",
  client_phone: "",
  client_email: "",
  site_contact_name: "",
  location: "",
  description: "",
  quotation_date: "",
  valid_until: "",
  work_duration: "",
  payment_terms: "",
  gst_percent: "18",
  profit_margin_percent: "0",
  advance_amount: "",
  notes: "",
  line_items: [{ ...initialLineItem }],
};

function calculateTotals(form) {
  const subtotal = form.line_items.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_rate || 0),
    0,
  );
  const gstAmount = subtotal * (Number(form.gst_percent || 0) / 100);
  const totalAmount = subtotal + gstAmount;
  const advanceAmount = Number(form.advance_amount || 0);
  const balanceAmount = Math.max(totalAmount - advanceAmount, 0);

  return { subtotal, gstAmount, totalAmount, advanceAmount, balanceAmount };
}

function validateQuotationForm(form) {
  if (!form.project_name.trim()) {
    return "Project name is required.";
  }
  if (!form.client_name.trim()) {
    return "Client name is required.";
  }
  if (!form.quotation_date) {
    return "Quotation date is required.";
  }
  if (form.valid_until && form.valid_until < form.quotation_date) {
    return "Valid until date cannot be earlier than the quotation date.";
  }
  const totals = calculateTotals(form);
  if (Number(form.advance_amount || 0) < 0) {
    return "Advance amount cannot be negative.";
  }
  if (Number(form.advance_amount || 0) > totals.totalAmount) {
    return "Advance amount cannot be greater than the quotation total.";
  }
  if (form.line_items.length === 0) {
    return "Add at least one line item.";
  }
  const invalidItem = form.line_items.find(
    (item) => !item.description.trim() || Number(item.quantity) <= 0 || Number(item.unit_rate) < 0,
  );
  if (invalidItem) {
    return "Each line item needs a description, quantity greater than zero, and a valid unit rate.";
  }
  return "";
}

function formatPdfMoney(value) {
  return `INR ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function sanitizePdfText(value) {
  return String(value ?? "")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapePdfText(value) {
  return sanitizePdfText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapPdfText(value, maxLength = 78) {
  const words = sanitizePdfText(value).split(" ").filter(Boolean);
  const lines = [];
  let current = "";

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });

  if (current) {
    lines.push(current);
  }

  return lines.length ? lines : [""];
}

function createPdfBlob(objects) {
  const encoder = new TextEncoder();
  const chunks = [];
  const offsets = [0];
  let byteLength = 0;

  function append(value) {
    const bytes = encoder.encode(value);
    chunks.push(bytes);
    byteLength += bytes.length;
  }

  append("%PDF-1.4\n");
  objects.forEach((object, index) => {
    offsets.push(byteLength);
    append(`${index + 1} 0 obj\n${object}\nendobj\n`);
  });

  const xrefOffset = byteLength;
  append(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`);
  offsets.slice(1).forEach((offset) => {
    append(`${String(offset).padStart(10, "0")} 00000 n \n`);
  });
  append(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);

  return new Blob(chunks, { type: "application/pdf" });
}

function buildQuotationPdfBlob(quotation) {
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 42;
  const bottom = 46;
  const lineHeight = 16;
  const pages = [];
  let commands = [];
  let y = pageHeight - margin;

  function addPage() {
    if (commands.length) {
      pages.push(commands.join("\n"));
    }
    commands = [];
    y = pageHeight - margin;
  }

  function ensureSpace(height = lineHeight) {
    if (y - height < bottom) {
      addPage();
    }
  }

  function text(value, x = margin, size = 10, font = "F1") {
    ensureSpace(lineHeight);
    drawText(value, x, y, size, font);
    y -= lineHeight;
  }

  function drawText(value, x, rowY, size = 10, font = "F1") {
    commands.push(`BT /${font} ${size} Tf 1 0 0 1 ${x} ${rowY} Tm (${escapePdfText(value)}) Tj ET`);
  }

  function drawTextRight(value, x, rowY, size = 10, font = "F1") {
    const safeValue = sanitizePdfText(value);
    const width = safeValue.length * size * 0.52;
    drawText(safeValue, Math.max(margin, x - width), rowY, size, font);
  }

  function drawBox(x, rowY, width, height) {
    commands.push(`${x} ${rowY} ${width} ${height} re S`);
  }

  function drawCircle(x, rowY, radius) {
    const c = radius * 0.5523;
    commands.push(`${x + radius} ${rowY} m ${x + radius} ${rowY + c} ${x + c} ${rowY + radius} ${x} ${rowY + radius} c`);
    commands.push(`${x - c} ${rowY + radius} ${x - radius} ${rowY + c} ${x - radius} ${rowY} c`);
    commands.push(`${x - radius} ${rowY - c} ${x - c} ${rowY - radius} ${x} ${rowY - radius} c`);
    commands.push(`${x + c} ${rowY - radius} ${x + radius} ${rowY - c} ${x + radius} ${rowY} c S`);
  }

  function textRight(value, x = pageWidth - margin, size = 10, font = "F1") {
    const safeValue = sanitizePdfText(value);
    ensureSpace(lineHeight);
    drawTextRight(safeValue, x, y, size, font);
    y -= lineHeight;
  }

  function gap(size = 8) {
    y -= size;
  }

  function rule() {
    ensureSpace(10);
    commands.push(`${margin} ${y} m ${pageWidth - margin} ${y} l S`);
    y -= 12;
  }

  function tableHeader() {
    ensureSpace(lineHeight);
    const rowY = y;
    drawText("Description", margin, rowY, 10, "F2");
    drawTextRight("Qty", 356, rowY, 10, "F2");
    drawText("Unit", 372, rowY, 10, "F2");
    drawTextRight("Rate", 466, rowY, 10, "F2");
    drawTextRight("Amount", pageWidth - margin, rowY, 10, "F2");
    y -= lineHeight;
  }

  function totalRow(label, value, size = 11, font = "F1") {
    ensureSpace(lineHeight);
    drawText(label, 336, y, size, font);
    drawTextRight(value, pageWidth - margin, y, size, font);
    y -= lineHeight;
  }

  drawBox(margin, y - 52, pageWidth - margin * 2, 58);
  text(COMPANY_NAME.toUpperCase(), margin + 14, 18, "F2");
  text(COMPANY_TAGLINE, margin + 14, 11);
  textRight("CIVIL QUOTATION", pageWidth - margin - 14, 18, "F2");
  textRight(`${CEO_TITLE}: ${CEO_NAME}`, pageWidth - margin - 14, 10, "F2");
  gap(6);
  text(`Quotation No: ${quotation.quotation_number}`, margin, 10, "F2");
  if (quotation.revision_number > 1) {
    text(`Revision: R${String(quotation.revision_number).padStart(2, "0")}`, margin, 10, "F2");
  }
  text(`Date: ${quotation.quotation_date || "-"}`, margin, 10);
  if (quotation.valid_until) {
    text(`Valid Until: ${quotation.valid_until}`, margin, 10);
  }
  rule();

  text("Project", margin, 12, "F2");
  text(quotation.project_name, margin, 11, "F2");
  text(`Client: ${quotation.client_name}`);
  if (quotation.client_phone) {
    text(`Phone: ${quotation.client_phone}`);
  }
  if (quotation.client_email) {
    text(`Email: ${quotation.client_email}`);
  }
  if (quotation.site_contact_name) {
    text(`Site Contact: ${quotation.site_contact_name}`);
  }
  if (quotation.location) {
    text(`Location: ${quotation.location}`);
  }
  if (quotation.work_duration) {
    text(`Work Duration: ${quotation.work_duration}`);
  }
  if (quotation.description) {
    wrapPdfText(quotation.description, 86).forEach((line) => text(line));
  }
  gap();

  text("Work Items", margin, 12, "F2");
  rule();
  tableHeader();
  rule();

  quotation.line_items.forEach((item, index) => {
    const itemTitle = `${index + 1}. ${item.category ? `${item.category} - ` : ""}${item.description}`;
    wrapPdfText(itemTitle, 52).forEach((line, lineIndex) => {
      text(line, margin, 9);
      if (lineIndex === 0) {
        const rowY = y + lineHeight;
        drawTextRight(item.quantity, 356, rowY, 9);
        drawText(item.unit || "-", 372, rowY, 9);
        drawTextRight(formatPdfMoney(item.unit_rate), 466, rowY, 9);
        drawTextRight(formatPdfMoney(item.line_total), pageWidth - margin, rowY, 9);
      }
    });
    gap(4);
  });

  rule();
  totalRow("Work Value", formatPdfMoney(quotation.subtotal), 11, "F2");
  totalRow(`GST ${quotation.gst_percent}%`, formatPdfMoney(quotation.gst_amount), 11);
  totalRow("Grand Total", formatPdfMoney(quotation.total_amount), 13, "F2");
  totalRow("Advance", formatPdfMoney(quotation.advance_amount), 11);
  totalRow("Balance", formatPdfMoney(quotation.balance_amount), 13, "F2");

  if (quotation.notes) {
    gap();
    text("Notes", margin, 12, "F2");
    wrapPdfText(quotation.notes, 86).forEach((line) => text(line));
  }

  if (quotation.payment_terms) {
    gap();
    text("Payment Terms", margin, 12, "F2");
    wrapPdfText(quotation.payment_terms, 86).forEach((line) => text(line));
  }

  gap();
  text("Company Terms & Conditions", margin, 12, "F2");
  COMPANY_TERMS.forEach((term, index) => {
    wrapPdfText(`${index + 1}. ${term}`, 88).forEach((line) => text(line, margin, 9));
  });

  gap();
  text("Company Policy", margin, 12, "F2");
  COMPANY_POLICY.forEach((policy, index) => {
    wrapPdfText(`${index + 1}. ${policy}`, 88).forEach((line) => text(line, margin, 9));
  });

  ensureSpace(98);
  gap(8);
  const signY = y - 78;
  drawBox(margin, signY, 230, 76);
  drawBox(pageWidth - margin - 230, signY, 230, 76);
  drawCircle(pageWidth / 2, signY + 38, 34);
  drawText("COMPANY", pageWidth / 2 - 28, signY + 46, 8, "F2");
  drawText("SEAL", pageWidth / 2 - 14, signY + 32, 12, "F2");
  drawText("Client Acceptance", margin + 12, signY + 52, 10, "F2");
  drawText("Name / Signature / Date", margin + 12, signY + 16, 9);
  drawText("Authorized Signatory", pageWidth - margin - 218, signY + 52, 10, "F2");
  drawText(`For ${COMPANY_NAME}`, pageWidth - margin - 218, signY + 34, 9);
  drawText(`${CEO_NAME}, ${CEO_TITLE}`, pageWidth - margin - 218, signY + 16, 9, "F2");
  addPage();

  const pageReferences = pages.map((_, index) => `${3 + index * 2} 0 R`).join(" ");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${pageReferences}] /Count ${pages.length} >>`,
  ];

  pages.forEach((page, index) => {
    const pageObjectId = 3 + index * 2;
    const contentObjectId = pageObjectId + 1;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> >> >> /Contents ${contentObjectId} 0 R >>`);
    objects.push(`<< /Length ${new TextEncoder().encode(page).length} >>\nstream\n${page}\nendstream`);
  });

  return createPdfBlob(objects);
}

function downloadQuotationPdf(quotation) {
  const blob = buildQuotationPdfBlob(quotation);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const fileName = sanitizePdfText(quotation.quotation_number || "quotation").replace(/[<>:"/\\|?*]+/g, "-");
  link.href = url;
  link.download = `${fileName || "quotation"}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function quotationToForm(quotation) {
  return {
    project_name: quotation.project_name || "",
    client_name: quotation.client_name || "",
    client_phone: quotation.client_phone || "",
    client_email: quotation.client_email || "",
    site_contact_name: quotation.site_contact_name || "",
    location: quotation.location || "",
    description: quotation.description || "",
    quotation_date: new Date().toISOString().slice(0, 10),
    valid_until: quotation.valid_until || "",
    work_duration: quotation.work_duration || "",
    payment_terms: quotation.payment_terms || "",
    gst_percent: String(quotation.gst_percent ?? 18),
    profit_margin_percent: "0",
    advance_amount: String(quotation.advance_amount ?? ""),
    notes: quotation.notes || "",
    line_items: quotation.line_items?.length
      ? quotation.line_items.map((item) => ({
          category: item.category || "",
          description: item.description || "",
          quantity: String(item.quantity ?? "1"),
          unit: item.unit || "",
          unit_rate: String(item.unit_rate ?? ""),
        }))
      : [{ ...initialLineItem }],
  };
}

function getQuotationRootId(quotation) {
  return quotation.parent_quotation || quotation.id;
}

function getRevisionLabel(quotation) {
  return `R${String(quotation.revision_number || 1).padStart(2, "0")}`;
}

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingQuotation, setEditingQuotation] = useState(null);
  const [openHistoryId, setOpenHistoryId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function loadQuotations() {
    try {
      const response = await fetchQuotations();
      setQuotations(response);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setForm((current) => ({ ...current, quotation_date: current.quotation_date || today }));
    loadQuotations();
  }, []);

  const totals = useMemo(() => calculateTotals(form), [form]);
  const quotationHistory = useMemo(() => {
    const groups = new Map();

    quotations.forEach((quotation) => {
      const rootId = getQuotationRootId(quotation);
      const rows = groups.get(rootId) || [];
      rows.push(quotation);
      groups.set(rootId, rows);
    });

    return Array.from(groups.entries())
      .map(([rootId, rows]) => {
        const sortedRows = [...rows].sort((first, second) => (first.revision_number || 1) - (second.revision_number || 1));
        const latest = sortedRows[sortedRows.length - 1];
        return { rootId, latest, rows: sortedRows };
      })
      .sort((first, second) => new Date(second.latest.created_at || 0) - new Date(first.latest.created_at || 0));
  }, [quotations]);
  const latestQuotations = useMemo(() => quotationHistory.map((group) => group.latest), [quotationHistory]);
  const quotationValue = useMemo(
    () => latestQuotations.reduce((sum, item) => sum + Number(item.total_amount || 0), 0),
    [latestQuotations],
  );
  const convertedCount = useMemo(
    () => latestQuotations.filter((item) => item.status === "converted").length,
    [latestQuotations],
  );
  const metrics = [
    { label: "Active Quotations", value: latestQuotations.length },
    { label: "History PDFs", value: quotations.length },
    { label: "Quotation Value", value: formatCurrency(quotationValue) },
    { label: "Converted to Projects", value: convertedCount },
  ];
  function updateLineItem(index, key, value) {
    setForm((current) => ({
      ...current,
      line_items: current.line_items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    }));
  }

  function addLineItem() {
    setForm((current) => ({
      ...current,
      line_items: [...current.line_items, { ...initialLineItem }],
    }));
  }

  function removeLineItem(index) {
    setForm((current) => ({
      ...current,
      line_items: current.line_items.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationError = validateQuotationForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const savedQuotation = await createQuotation({
        ...form,
        source_quotation: editingQuotation?.id,
        project_name: form.project_name.trim(),
        client_name: form.client_name.trim(),
        client_phone: form.client_phone.trim(),
        client_email: form.client_email.trim(),
        site_contact_name: form.site_contact_name.trim(),
        location: form.location.trim(),
        description: form.description.trim(),
        work_duration: form.work_duration.trim(),
        payment_terms: form.payment_terms.trim(),
        notes: form.notes.trim(),
        gst_percent: Number(form.gst_percent || 0),
        profit_margin_percent: 0,
        advance_amount: Number(form.advance_amount || 0),
        valid_until: form.valid_until || null,
        line_items: form.line_items.map((item) => ({
          category: item.category.trim(),
          description: item.description.trim(),
          quantity: Number(item.quantity || 0),
          unit: item.unit.trim(),
          unit_rate: Number(item.unit_rate || 0),
        })),
      });
      setOpenHistoryId(getQuotationRootId(savedQuotation));
      setForm({
        ...initialForm,
        quotation_date: new Date().toISOString().slice(0, 10),
        line_items: [{ ...initialLineItem }],
      });
      setEditingQuotation(null);
      await loadQuotations();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConvert(quotationId) {
    try {
      await convertQuotationToProject(quotationId);
      await loadQuotations();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function handleEdit(quotation) {
    setEditingQuotation(quotation);
    setForm(quotationToForm(quotation));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function getHistoryChange(rows, index) {
    if (index === 0) {
      return "Original";
    }

    const currentTotal = Number(rows[index].total_amount || 0);
    const previousTotal = Number(rows[index - 1].total_amount || 0);
    const change = currentTotal - previousTotal;

    if (change === 0) {
      return "No amount change";
    }

    return `${change > 0 ? "Increased" : "Decreased"} ${formatCurrency(Math.abs(change))}`;
  }

  function renderQuotationCells(quotation) {
    const rootId = getQuotationRootId(quotation);
    const isHistoryOpen = openHistoryId === rootId;
    const historyCount = quotations.filter((item) => getQuotationRootId(item) === rootId).length;

    return (
      <>
        <td className="quotation-title-cell">
          <strong>{quotation.project_name}</strong>
          <div className="quotation-meta-row">
            <span>{quotation.quotation_number}</span>
            <span>{getRevisionLabel(quotation)}</span>
            <span>{historyCount} PDF{historyCount === 1 ? "" : "s"}</span>
          </div>
        </td>
        <td>
          <strong>{quotation.client_name}</strong>
          {quotation.client_phone || quotation.client_email ? (
            <div className="table-subtle">{quotation.client_phone || quotation.client_email}</div>
          ) : null}
          {quotation.location ? <div className="table-subtle">{quotation.location}</div> : null}
        </td>
        <td>
          <span className={`status-badge ${quotation.status === "converted" ? "approved" : "pending"}`}>
            {formatStatus(quotation.status)}
          </span>
          {quotation.converted_project_name ? <div className="table-subtle">{quotation.converted_project_name}</div> : null}
        </td>
        <td className="quotation-commercial-cell">
          <div className="quotation-commercial-stack">
            <div>
              <span>Work</span>
              <strong>{formatCurrency(quotation.subtotal)}</strong>
            </div>
            <div>
              <span>Total</span>
              <strong>{formatCurrency(quotation.total_amount)}</strong>
            </div>
            <div>
              <span>Balance</span>
              <strong className="money-cell--strong">{formatCurrency(quotation.balance_amount)}</strong>
            </div>
          </div>
        </td>
        <td className="action-cell">
          <div className="quotation-action-stack">
            <div className="quotation-primary-actions">
              <button className="small-button" onClick={() => downloadQuotationPdf(quotation)} type="button">
                PDF
              </button>
              <button className="small-button" onClick={() => handleEdit(quotation)} type="button">
                Edit
              </button>
            </div>
            <div className="quotation-secondary-actions">
              <button
                className="small-button small-button--muted"
                onClick={() => setOpenHistoryId(isHistoryOpen ? null : rootId)}
                type="button"
              >
                {isHistoryOpen ? "Hide History" : "History"}
              </button>
              <button className="small-button small-button--muted quotation-delete-button" onClick={() => handleDelete(quotation.id)} type="button">
                Delete
              </button>
            </div>
            {quotation.converted_project ? (
              <span className="quotation-workflow-note">Converted</span>
            ) : (
              <button className="small-button small-button--muted" onClick={() => handleConvert(quotation.id)} type="button">
                Convert to Project
              </button>
            )}
          </div>
        </td>
      </>
    );
  }

  function handleCancelEdit() {
    setEditingQuotation(null);
    setForm({
      ...initialForm,
      quotation_date: new Date().toISOString().slice(0, 10),
      line_items: [{ ...initialLineItem }],
    });
    setError("");
  }

  async function handleDelete(quotationId) {
    const confirmed = window.confirm("Delete this quotation?");
    if (!confirmed) {
      return;
    }

    try {
      await deleteQuotation(quotationId);
      if (editingQuotation?.id === quotationId) {
        handleCancelEdit();
      }
      await loadQuotations();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <section className="page">
      <PageTitle action={<div className="pill">PDF Ready</div>} eyebrow="Quotation" title="Civil Project Quotation" />

      {error ? <div className="notice-card error">{error}</div> : null}

      <MetricGrid items={metrics} />

      <div className="split-layout split-layout--wide quotation-layout">
        <section className="panel">
          <PanelTitle title={editingQuotation ? "Update Quotation" : "Create Quotation"} />
          {editingQuotation ? (
            <div className="notice-card">
              Editing {editingQuotation.quotation_number}. Saving will create a new revision and keep the old quotation in history.
            </div>
          ) : null}

          <form className="quotation-form" onSubmit={handleSubmit}>
            <div className="quotation-form-section">
              <div className="quotation-section-title">
                <span>Project Details</span>
              </div>
              <div className="quotation-field-grid quotation-field-grid--two">
                <VoiceField
                  label="Project Name"
                  onChangeValue={(value) => setForm((current) => ({ ...current, project_name: value }))}
                  placeholder="Example: G+2 Villa Construction at Medavakkam"
                  value={form.project_name}
                />
                <VoiceField
                  label="Location"
                  onChangeValue={(value) => setForm((current) => ({ ...current, location: value }))}
                  placeholder="Example: Medavakkam, Chennai"
                  value={form.location}
                />
                <VoiceField
                  label="Quotation Date"
                  onChangeValue={(value) => setForm((current) => ({ ...current, quotation_date: value }))}
                  type="date"
                  value={form.quotation_date}
                  voiceHint="Say a valid quotation date."
                />
                <VoiceField
                  label="Valid Until"
                  onChangeValue={(value) => setForm((current) => ({ ...current, valid_until: value }))}
                  type="date"
                  value={form.valid_until}
                  voiceHint="Say a valid date."
                />
                <VoiceField
                  label="Work Duration"
                  onChangeValue={(value) => setForm((current) => ({ ...current, work_duration: value }))}
                  placeholder="Example: 120 days from work order"
                  value={form.work_duration}
                />
              </div>
            </div>

            <div className="quotation-form-section">
              <div className="quotation-section-title">
                <span>Client Details</span>
              </div>
              <div className="quotation-field-grid quotation-field-grid--two">
                <VoiceField
                  label="Client Name"
                  onChangeValue={(value) => setForm((current) => ({ ...current, client_name: value }))}
                  placeholder="Example: Arun Kumar"
                  value={form.client_name}
                />
                <VoiceField
                  label="Client Phone"
                  onChangeValue={(value) => setForm((current) => ({ ...current, client_phone: value }))}
                  placeholder="Example: 9876543210"
                  value={form.client_phone}
                />
                <VoiceField
                  label="Client Email"
                  onChangeValue={(value) => setForm((current) => ({ ...current, client_email: value }))}
                  placeholder="Example: client@example.com"
                  type="email"
                  value={form.client_email}
                />
                <VoiceField
                  label="Site Contact"
                  onChangeValue={(value) => setForm((current) => ({ ...current, site_contact_name: value }))}
                  placeholder="Example: Site Engineer Ravi"
                  value={form.site_contact_name}
                />
              </div>
            </div>

            <div className="quotation-form-section">
              <div className="quotation-section-title">
                <span>Commercial Terms</span>
              </div>
              <div className="quotation-field-grid quotation-field-grid--two">
                <VoiceField
                  label="GST %"
                  min="0"
                  step="0.01"
                  onChangeValue={(value) => setForm((current) => ({ ...current, gst_percent: value }))}
                  type="number"
                  value={form.gst_percent}
                  voiceHint="Say a GST percentage."
                />
                <VoiceField
                  label="Advance Amount"
                  min="0"
                  step="0.01"
                  onChangeValue={(value) => setForm((current) => ({ ...current, advance_amount: value }))}
                  type="number"
                  value={form.advance_amount}
                  voiceHint="Say an advance amount."
                />
              </div>
              <VoiceField
                appendVoice
                className="field"
                control="textarea"
                label="Payment Terms"
                onChangeValue={(value) => setForm((current) => ({ ...current, payment_terms: value }))}
                placeholder="Example: 25% advance, 50% during execution, 25% before handover."
                rows={3}
                value={form.payment_terms}
              />
            </div>

            <div className="quotation-form-section">
              <div className="quotation-section-title quotation-section-title--with-action">
                <span>Line Items</span>
                <button className="secondary-button secondary-button--dark" onClick={addLineItem} type="button">
                  Add Line Item
                </button>
              </div>
              <div className="quotation-line-table">
                <div className="quotation-line-header" aria-hidden="true">
                  <span>Category</span>
                  <span>Description</span>
                  <span>Qty</span>
                  <span>Unit</span>
                  <span>Rate</span>
                  <span>Total</span>
                  <span></span>
                </div>
                {form.line_items.map((item, index) => (
                  <div className="quotation-line-row" key={`line-item-${index}`}>
                    <input
                      className="field-control"
                      onChange={(event) => updateLineItem(index, "category", event.target.value)}
                      placeholder="RCC Work"
                      value={item.category}
                    />
                    <input
                      className="field-control"
                      onChange={(event) => updateLineItem(index, "description", event.target.value)}
                      placeholder="Footing excavation and PCC"
                      value={item.description}
                    />
                    <input
                      className="field-control"
                      min="0"
                      onChange={(event) => updateLineItem(index, "quantity", event.target.value)}
                      step="0.01"
                      type="number"
                      value={item.quantity}
                    />
                    <input
                      className="field-control"
                      onChange={(event) => updateLineItem(index, "unit", event.target.value)}
                      placeholder="sq ft"
                      value={item.unit}
                    />
                    <input
                      className="field-control"
                      min="0"
                      onChange={(event) => updateLineItem(index, "unit_rate", event.target.value)}
                      step="0.01"
                      type="number"
                      value={item.unit_rate}
                    />
                    <input
                      className="field-control quotation-line-total"
                      disabled
                      type="text"
                      value={formatCurrency(Number(item.quantity || 0) * Number(item.unit_rate || 0))}
                    />
                    <button
                      className="small-button small-button--muted quotation-remove-button"
                      disabled={form.line_items.length === 1}
                      onClick={() => removeLineItem(index)}
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="quotation-form-section">
              <div className="quotation-section-title">
                <span>Notes</span>
              </div>
              <VoiceField
                appendVoice
                className="field"
                control="textarea"
                label="Description"
                onChangeValue={(value) => setForm((current) => ({ ...current, description: value }))}
                placeholder="Example: Civil construction including footing, RCC frame, brickwork, plastering, and finishing package."
                rows={3}
                value={form.description}
              />
              <VoiceField
                appendVoice
                className="field"
                control="textarea"
                label="Notes"
                onChangeValue={(value) => setForm((current) => ({ ...current, notes: value }))}
                placeholder="Example: Rate excludes government approval charges and EB application fee."
                rows={3}
                value={form.notes}
              />
            </div>

            <div className="action-row">
              <button className="primary-button" disabled={submitting} type="submit">
                {submitting ? "Saving..." : editingQuotation ? "Save New Revision" : "Create Quotation"}
              </button>
              {editingQuotation ? (
                <button className="small-button small-button--muted" onClick={handleCancelEdit} type="button">
                  Cancel Edit
                </button>
              ) : null}
            </div>
          </form>
        </section>

        <section className="panel panel--dark panel--stacked quotation-summary">
          <PanelTitle title="Auto Calculation Summary" />
          <div className="stat-stack">
            <div className="stat-inline">
              <span>Work Value</span>
              <strong>{formatCurrency(totals.subtotal)}</strong>
            </div>
            <div className="stat-inline">
              <span>GST</span>
              <strong>{formatCurrency(totals.gstAmount)}</strong>
            </div>
            <div className="stat-inline">
              <span>Total Quotation</span>
              <strong>{formatCurrency(totals.totalAmount)}</strong>
            </div>
            <div className="stat-inline">
              <span>Advance</span>
              <strong>{formatCurrency(totals.advanceAmount)}</strong>
            </div>
            <div className="stat-inline">
              <span>Balance</span>
              <strong>{formatCurrency(totals.balanceAmount)}</strong>
            </div>
          </div>
        </section>
      </div>

      {loading ? <div className="notice-card">Loading quotations...</div> : null}

      {!loading ? (
        <div className="quotation-table-wrap">
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>Quotation</th>
                  <th>Client</th>
                  <th>Status</th>
                  <th>Commercials</th>
                  <th>Workflow</th>
                </tr>
              </thead>
              <tbody>
                {quotationHistory.length === 0 ? (
                  <tr>
                    <td className="empty-cell" colSpan={5}>
                      No quotations available yet. Create the first one above.
                    </td>
                  </tr>
                ) : (
                  quotationHistory.map((group) => {
                    const isOpen = openHistoryId === group.rootId;
                    const newestFirstRows = [...group.rows].reverse();

                    return (
                      <React.Fragment key={group.rootId}>
                        <tr>{renderQuotationCells(group.latest)}</tr>
                        {isOpen ? (
                          <tr className="quotation-history-expanded-row">
                            <td colSpan={5}>
                              <div className="quotation-history-inline">
                                {newestFirstRows.map((quotation) => {
                                  const originalIndex = group.rows.findIndex((row) => row.id === quotation.id);
                                  const isFinal = quotation.id === group.latest.id;

                                  return (
                                    <div className="quotation-history-row" key={quotation.id}>
                                      <div>
                                        <strong>{isFinal ? "Final / Latest" : getRevisionLabel(quotation)}</strong>
                                        <span>{quotation.quotation_number}</span>
                                      </div>
                                      <div>
                                        <strong>{formatCurrency(quotation.total_amount)}</strong>
                                        <span>{getHistoryChange(group.rows, originalIndex)}</span>
                                      </div>
                                      <div>
                                        <strong>{quotation.quotation_date}</strong>
                                        <span>{quotation.valid_until ? `Valid until ${quotation.valid_until}` : ""}</span>
                                      </div>
                                      <div className="action-row">
                                        <button className="small-button" onClick={() => downloadQuotationPdf(quotation)} type="button">
                                          PDF
                                        </button>
                                        <button className="small-button small-button--muted" onClick={() => handleEdit(quotation)} type="button">
                                          Edit
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}
