import React, { useEffect, useMemo, useState } from "react";

import { DataTable, MetricGrid } from "../components/DataViews";
import VoiceField from "../components/VoiceField";
import {
  createCashFlow,
  createCollection,
  createExpense,
  createFinanceBudget,
  createPayment,
  createPettyCash,
  fetchCashFlow,
  fetchCollections,
  fetchExpenses,
  fetchFinanceBudgets,
  fetchPayments,
  fetchPettyCash,
  fetchProjects,
  fetchProjectSummary,
  fetchSmartAlerts,
} from "../services/api";
import { calculateClosingBalance, formatCurrency, toNumber } from "../utils/formatters";

const today = () => new Date().toISOString().slice(0, 10);

const expenseCategoryOptions = [
  "Direct Expense",
  "Indirect Expense",
  "Misc Expense",
  "Cement",
  "Steel",
  "Labour Advance",
  "Equipment Rental",
  "Transport",
  "Site Welfare",
];

const budgetCategoryOptions = [
  "Civil Work",
  "Labour",
  "Materials",
  "Equipment",
  "Subcontract",
  "Contingency",
  "Petty Cash",
];

const selectOptions = {
  approval: [
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ],
  budgetApproval: [
    { value: "draft", label: "Draft" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ],
  paymentMode: [
    { value: "", label: "Payment Mode" },
    { value: "cash", label: "Cash" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "cheque", label: "Cheque" },
    { value: "upi", label: "UPI" },
    { value: "credit", label: "Credit" },
  ],
  paymentType: [
    { value: "incoming", label: "Incoming - Client Collection" },
    { value: "outgoing", label: "Outgoing - Site Payment" },
  ],
  paymentCategory: [
    { value: "client_payment", label: "Client Payment" },
    { value: "advance", label: "Advance" },
    { value: "partial", label: "Partial Payment" },
    { value: "final", label: "Final Payment" },
    { value: "vendor", label: "Vendor Payment" },
    { value: "labour", label: "Labour Payment" },
    { value: "material", label: "Material Payment" },
    { value: "equipment", label: "Equipment Payment" },
    { value: "subcontractor", label: "Subcontractor Payment" },
    { value: "misc", label: "Misc Payment" },
  ],
  paymentStatus: [
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "paid", label: "Paid" },
    { value: "received", label: "Received" },
    { value: "rejected", label: "Rejected" },
  ],
  pettyType: [
    { value: "issue", label: "Cash Issue" },
    { value: "expense", label: "Cash Expense" },
    { value: "return", label: "Cash Return" },
    { value: "settlement", label: "Settlement" },
  ],
  pettyStatus: [
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "settled", label: "Settled" },
    { value: "rejected", label: "Rejected" },
  ],
  collectionStatus: [
    { value: "upcoming", label: "Upcoming" },
    { value: "pending", label: "Pending" },
    { value: "overdue", label: "Overdue" },
    { value: "collected", label: "Collected" },
  ],
  expenseType: [
    { value: "direct", label: "Direct Expense" },
    { value: "indirect", label: "Indirect Expense" },
    { value: "misc", label: "Misc Expense" },
  ],
  cashFlowPeriod: [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "yearly", label: "Yearly" },
  ],
};

const initialBudgetForm = {
  project: "",
  project_budget: "",
  category: "",
  allocated_amount: "",
  revised_amount: "0",
  approval_status: "pending",
  revision_note: "",
};

const initialExpenseForm = {
  project: "",
  expense_date: today(),
  expense_type: "direct",
  category: "",
  title: "",
  amount: "",
  vendor_name: "",
  payment_mode: "",
  receipt_number: "",
  attachment_reference: "",
  notes: "",
  history_note: "",
  approval_status: "pending",
};

const initialPaymentForm = {
  project: "",
  payment_date: today(),
  payment_type: "incoming",
  payment_category: "client_payment",
  amount: "",
  payment_method: "",
  reference_number: "",
  received_from: "",
  due_date: "",
  receipt_reference: "",
  payment_status: "pending",
  approval_note: "",
  notes: "",
};

const initialPettyForm = {
  project: "",
  cash_type: "issue",
  issued_to: "",
  issued_by: "",
  entry_date: today(),
  amount: "",
  current_balance: "",
  expense_category: "",
  description: "",
  receipt_reference: "",
  status: "pending",
  approved_by: "",
  approved_date: "",
};

const initialCollectionForm = {
  project: "",
  client_name: "",
  expected_date: today(),
  expected_amount: "",
  forecast_amount: "",
  status: "pending",
  follow_up_note: "",
  history_note: "",
};

const initialCashFlowForm = {
  project: "",
  period_type: "daily",
  flow_date: today(),
  opening_balance: "",
  cash_in: "",
  cash_out: "",
  closing_balance: "",
  notes: "",
};

function percent(value) {
  return `${Math.max(0, toNumber(value)).toFixed(1)}%`;
}

function validateAmount(form, field, label) {
  if (toNumber(form[field]) <= 0) {
    return `${label} must be greater than zero.`;
  }
  return "";
}

export default function FinancePage() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [pettyCash, setPettyCash] = useState([]);
  const [collections, setCollections] = useState([]);
  const [cashFlowRows, setCashFlowRows] = useState([]);
  const [projectSummary, setProjectSummary] = useState(null);
  const [projectAlerts, setProjectAlerts] = useState([]);
  const [activeEntry, setActiveEntry] = useState("expense");
  const [budgetForm, setBudgetForm] = useState(initialBudgetForm);
  const [expenseForm, setExpenseForm] = useState(initialExpenseForm);
  const [paymentForm, setPaymentForm] = useState(initialPaymentForm);
  const [pettyForm, setPettyForm] = useState(initialPettyForm);
  const [collectionForm, setCollectionForm] = useState(initialCollectionForm);
  const [cashFlowForm, setCashFlowForm] = useState(initialCashFlowForm);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const financeEntryTabs = [
    ["budget", "Budget"],
    ["expense", "Expense"],
    ["payment", "Payment"],
    ["petty", "Petty Cash"],
    ["collection", "Collection"],
    ["cashFlow", "Cash Flow"],
  ];

  useEffect(() => {
    async function bootstrap() {
      try {
        const projectList = await fetchProjects();
        setProjects(projectList);
        if (projectList[0]) {
          applyProject(projectList[0].id);
        }
      } catch (requestError) {
        setError(requestError.message);
      }
    }

    bootstrap();
  }, []);

  useEffect(() => {
    loadFinanceRows(selectedProject);
  }, [selectedProject]);

  function applyProject(projectIdValue) {
    const projectId = String(projectIdValue || "");
    setSelectedProject(projectId);
    setBudgetForm((current) => ({ ...current, project: projectId }));
    setExpenseForm((current) => ({ ...current, project: projectId }));
    setPaymentForm((current) => ({ ...current, project: projectId }));
    setPettyForm((current) => ({ ...current, project: projectId }));
    setCollectionForm((current) => ({ ...current, project: projectId }));
    setCashFlowForm((current) => ({ ...current, project: projectId }));
  }

  async function loadFinanceRows(projectId = selectedProject) {
    if (!projectId) {
      setBudgets([]);
      setExpenses([]);
      setPayments([]);
      setPettyCash([]);
      setCollections([]);
      setCashFlowRows([]);
      setProjectSummary(null);
      setProjectAlerts([]);
      return;
    }

    try {
      const [budgetRows, expenseRows, paymentRows, pettyRows, collectionRows, cashFlowResponse, summaryResponse, alertResponse] = await Promise.all([
        fetchFinanceBudgets(projectId),
        fetchExpenses(projectId),
        fetchPayments(projectId),
        fetchPettyCash(projectId),
        fetchCollections(projectId),
        fetchCashFlow(projectId),
        fetchProjectSummary(projectId),
        fetchSmartAlerts(),
      ]);
      setBudgets(budgetRows);
      setExpenses(expenseRows);
      setPayments(paymentRows);
      setPettyCash(pettyRows);
      setCollections(collectionRows);
      setCashFlowRows(cashFlowResponse);
      setProjectSummary(summaryResponse);
      setProjectAlerts((alertResponse.alerts || []).filter((item) => String(item.project_id) === String(projectId)));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function saveRecord(event, type) {
    event.preventDefault();
    setError("");
    setSaveMessage("");

    const projectMissing = !selectedProject ? "Choose a project before saving finance data." : "";
    if (projectMissing) {
      setError(projectMissing);
      return;
    }

    try {
      if (type === "budget") {
        const validationError = validateAmount(budgetForm, "allocated_amount", "Allocated amount");
        if (validationError || !budgetForm.category.trim()) {
          setError(validationError || "Budget category is required.");
          return;
        }
        await createFinanceBudget({
          ...budgetForm,
          project_budget: toNumber(budgetForm.project_budget),
          category: budgetForm.category.trim(),
          allocated_amount: toNumber(budgetForm.allocated_amount),
          revised_amount: toNumber(budgetForm.revised_amount),
          revision_note: budgetForm.revision_note.trim(),
        });
        setBudgetForm((current) => ({ ...initialBudgetForm, project: current.project }));
        setSaveMessage("Budget saved and utilization recalculated.");
      }

      if (type === "expense") {
        const validationError = validateAmount(expenseForm, "amount", "Expense amount");
        if (validationError || !expenseForm.expense_date || !expenseForm.category.trim() || !expenseForm.title.trim()) {
          setError(validationError || "Expense date, category, and title are required.");
          return;
        }
        await createExpense({
          ...expenseForm,
          amount: toNumber(expenseForm.amount),
          attachment_reference: expenseForm.attachment_reference.trim(),
          history_note: expenseForm.history_note.trim(),
        });
        setExpenseForm((current) => ({ ...initialExpenseForm, project: current.project }));
        setSaveMessage("Expense saved and spend updated.");
      }

      if (type === "payment") {
        const validationError = validateAmount(paymentForm, "amount", "Payment amount");
        if (validationError || !paymentForm.payment_date) {
          setError(validationError || "Payment date is required.");
          return;
        }
        await createPayment({
          ...paymentForm,
          amount: toNumber(paymentForm.amount),
          payment_method: paymentForm.payment_method.trim(),
          receipt_reference: paymentForm.receipt_reference.trim(),
          approval_note: paymentForm.approval_note.trim(),
          due_date: paymentForm.due_date || null,
        });
        setPaymentForm((current) => ({ ...initialPaymentForm, project: current.project }));
        setSaveMessage("Payment saved and cash flow updated.");
      }

      if (type === "petty") {
        const validationError = validateAmount(pettyForm, "amount", "Petty cash amount");
        if (validationError || !pettyForm.issued_to.trim() || !pettyForm.entry_date) {
          setError(validationError || "Issued to and date are required.");
          return;
        }
        await createPettyCash({
          ...pettyForm,
          amount: toNumber(pettyForm.amount),
          current_balance: toNumber(pettyForm.current_balance),
          receipt_reference: pettyForm.receipt_reference.trim(),
          approved_date: pettyForm.approved_date || null,
        });
        setPettyForm((current) => ({ ...initialPettyForm, project: current.project }));
        setSaveMessage("Petty cash entry saved.");
      }

      if (type === "collection") {
        const validationError = validateAmount(collectionForm, "expected_amount", "Collection amount");
        if (validationError || !collectionForm.client_name.trim() || !collectionForm.expected_date) {
          setError(validationError || "Client name and expected date are required.");
          return;
        }
        await createCollection({
          ...collectionForm,
          expected_amount: toNumber(collectionForm.expected_amount),
          forecast_amount: toNumber(collectionForm.forecast_amount),
          history_note: collectionForm.history_note.trim(),
        });
        setCollectionForm((current) => ({ ...initialCollectionForm, project: current.project }));
        setSaveMessage("Collection follow-up saved.");
      }

      if (type === "cashFlow") {
        if (!cashFlowForm.flow_date) {
          setError("Cash flow date is required.");
          return;
        }
        await createCashFlow({
          ...cashFlowForm,
          opening_balance: toNumber(cashFlowForm.opening_balance),
          cash_in: toNumber(cashFlowForm.cash_in),
          cash_out: toNumber(cashFlowForm.cash_out),
          closing_balance: calculateClosingBalance(cashFlowForm.opening_balance, cashFlowForm.cash_in, cashFlowForm.cash_out),
          notes: cashFlowForm.notes.trim(),
        });
        setCashFlowForm((current) => ({ ...initialCashFlowForm, project: current.project }));
        setSaveMessage("Cash flow entry saved.");
      }

      await loadFinanceRows(selectedProject);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  const selectedProjectData = projects.find((project) => String(project.id) === String(selectedProject));
  const expectedRevenue = toNumber(projectSummary?.estimated_revenue);
  const activeBudget = toNumber(projectSummary?.active_budget || projectSummary?.estimated_budget);
  const received = toNumber(projectSummary?.total_received);
  const laborCost = toNumber(projectSummary?.labor_cost);
  const materialCost = toNumber(projectSummary?.material_cost);
  const directExpenses = toNumber(projectSummary?.other_expenses);
  const outgoingPayments = toNumber(projectSummary?.outgoing_payments);
  const pettyCashSpend = toNumber(projectSummary?.petty_cash_spend);
  const pettyCashBalance = toNumber(projectSummary?.petty_cash_balance);
  const totalSpend = toNumber(projectSummary?.total_spend);
  const netProfitLoss = toNumber(projectSummary?.profit_or_loss);
  const pendingCollections = toNumber(projectSummary?.pending_collections) || Math.max(expectedRevenue - received, 0);
  const cashFlow = toNumber(projectSummary?.cash_flow);
  const computedClosingBalance = calculateClosingBalance(cashFlowForm.opening_balance, cashFlowForm.cash_in, cashFlowForm.cash_out);
  const budgetUtilization = toNumber(projectSummary?.budget_utilization_percent);
  const profitMargin = toNumber(projectSummary?.profit_margin_percent);
  const pendingPayments = outgoingPayments;

  const dashboardMetrics = [
    { label: "Total Budget", value: formatCurrency(activeBudget) },
    { label: "Total Spend", value: formatCurrency(totalSpend), className: "loss-text" },
    { label: "Total Received", value: formatCurrency(received), className: "profit-text" },
    { label: "Net Profit", value: formatCurrency(Math.max(netProfitLoss, 0)), className: "profit-text" },
    { label: "Net Loss", value: formatCurrency(Math.max(Math.abs(netProfitLoss), 0)), className: netProfitLoss < 0 ? "loss-text" : "" },
    { label: "Profit Margin", value: percent(profitMargin) },
    { label: "Budget Used", value: percent(budgetUtilization), className: budgetUtilization >= 90 ? "loss-text" : "" },
    { label: "Petty Cash", value: formatCurrency(pettyCashBalance), className: pettyCashBalance < 0 ? "loss-text" : "profit-text" },
    { label: "Cash Flow", value: formatCurrency(cashFlow), className: cashFlow < 0 ? "loss-text" : "profit-text" },
  ];

  const financeFormula = [
    { label: "Labor", value: laborCost },
    { label: "Materials", value: materialCost },
    { label: "Expenses", value: directExpenses },
    { label: "Petty Cash Spend", value: pettyCashSpend },
    { label: "Outgoing Payments", value: outgoingPayments },
  ];

  const generatedAlerts = useMemo(() => {
    const alerts = [];
    if (budgetUtilization >= 100) alerts.push({ title: "Budget exceeded", text: `${percent(budgetUtilization)} of budget used.` });
    else if (budgetUtilization >= 90) alerts.push({ title: "90% budget used", text: "Approval required before further major spend." });
    else if (budgetUtilization >= 80) alerts.push({ title: "80% budget used", text: "Watch new purchase and labor commitments." });
    if (netProfitLoss < 0) alerts.push({ title: "Project loss", text: `${formatCurrency(Math.abs(netProfitLoss))} loss at current receipts.` });
    if (cashFlow < 0) alerts.push({ title: "Negative cash flow", text: "Outgoing cash is higher than incoming cash." });
    if (pendingCollections > 0) alerts.push({ title: "Pending collection", text: `${formatCurrency(pendingCollections)} to collect.` });
    if (pettyCashBalance < 5000) alerts.push({ title: "Low petty cash", text: `${formatCurrency(pettyCashBalance)} remaining.` });
    projectAlerts.forEach((alert) => alerts.push({ title: alert.type.replace(/_/g, " "), text: alert.message }));
    return alerts;
  }, [budgetUtilization, cashFlow, netProfitLoss, pendingCollections, pettyCashBalance, projectAlerts]);

  const budgetColumns = [
    { key: "category", label: "Budget", render: (row) => <><strong>{row.category}</strong><div className="table-subtle">Project budget {formatCurrency(row.project_budget)}</div></> },
    { key: "allocated_amount", label: "Allocated", render: (row) => formatCurrency(row.allocated_amount) },
    { key: "revised_amount", label: "Revised", render: (row) => formatCurrency(row.revised_amount) },
    { key: "approval_status", label: "Status", render: (row) => <span className={`status-badge ${row.approval_status}`}>{row.approval_status}</span> },
  ];

  const expenseColumns = [
    { key: "title", label: "Expense", render: (row) => <><strong>{row.title}</strong><div className="table-subtle">{row.expense_type} / {row.category}</div></> },
    { key: "expense_date", label: "Date" },
    { key: "amount", label: "Amount", render: (row) => formatCurrency(row.amount) },
    { key: "receipt_number", label: "Receipt", render: (row) => row.receipt_number || row.attachment_reference || "-" },
    { key: "approval_status", label: "Status", render: (row) => <span className={`status-badge ${row.approval_status}`}>{row.approval_status}</span> },
  ];

  const paymentColumns = [
    { key: "payment_type", label: "Type", render: (row) => <><strong>{row.payment_type === "incoming" ? "Incoming" : "Outgoing"}</strong><div className="table-subtle">{row.payment_category}</div></> },
    { key: "received_from", label: "Party", render: (row) => row.received_from || "-" },
    { key: "amount", label: "Amount", render: (row) => formatCurrency(row.amount) },
    { key: "payment_method", label: "Method", render: (row) => row.payment_method || "-" },
    { key: "payment_status", label: "Status", render: (row) => <span className={`status-badge ${row.payment_status}`}>{row.payment_status}</span> },
  ];

  const pettyColumns = [
    { key: "cash_type", label: "Type", render: (row) => row.cash_type.replace("_", " ") },
    { key: "issued_to", label: "Employee" },
    { key: "amount", label: "Amount", render: (row) => formatCurrency(row.amount) },
    { key: "current_balance", label: "Balance", render: (row) => formatCurrency(row.current_balance) },
    { key: "entry_date", label: "Date" },
    { key: "status", label: "Status", render: (row) => <span className={`status-badge ${row.status}`}>{row.status}</span> },
  ];

  const collectionColumns = [
    { key: "client_name", label: "Client" },
    { key: "expected_amount", label: "Expected", render: (row) => formatCurrency(row.expected_amount) },
    { key: "forecast_amount", label: "Forecast", render: (row) => formatCurrency(row.forecast_amount) },
    { key: "expected_date", label: "Due Date" },
    { key: "status", label: "Status", render: (row) => <span className={`status-badge ${row.status}`}>{row.status}</span> },
  ];

  const cashFlowColumns = [
    { key: "period_type", label: "Period", render: (row) => row.period_type },
    { key: "flow_date", label: "Date" },
    { key: "opening_balance", label: "Opening", render: (row) => formatCurrency(row.opening_balance) },
    { key: "cash_in", label: "Cash In", render: (row) => formatCurrency(row.cash_in) },
    { key: "cash_out", label: "Cash Out", render: (row) => formatCurrency(row.cash_out) },
    { key: "closing_balance", label: "Closing", render: (row) => formatCurrency(row.closing_balance) },
  ];

  return (
    <section className="page finance-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Finance</p>
          <h2>Finance</h2>
        </div>
        <div className="pill">{selectedProjectData ? selectedProjectData.code : "Select Project"}</div>
      </div>

      {error ? <div className="notice-card error">{error}</div> : null}
      {saveMessage ? <div className="notice-card success">{saveMessage}</div> : null}

      <section className="panel finance-project-bar">
        <label className="field">
          <span>Project</span>
          <select
            className="field-control"
            value={selectedProject}
            onChange={(event) => {
              setError("");
              setSaveMessage("");
              applyProject(event.target.value);
            }}
          >
            <option value="">Select Project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.code} - {project.name}
              </option>
            ))}
          </select>
        </label>
        <div>
          <span>Client</span>
          <strong>{selectedProjectData?.client_name || "-"}</strong>
        </div>
        <div>
          <span>Location</span>
          <strong>{selectedProjectData?.location || "-"}</strong>
        </div>
      </section>

      <MetricGrid className="finance-metric-grid" items={dashboardMetrics} />

      <div className="split-layout split-layout--equal">
        <section className="panel">
          <div className="section-heading">
            <div>
              <h3>What This Page Calculates</h3>
            </div>
          </div>
          <div className="finance-calculation-box">
            <div>
              <span>Total Spend</span>
              <strong>{formatCurrency(totalSpend)}</strong>
              <small>Labor + Materials + Expenses + Petty Cash + Outgoing Payments</small>
            </div>
            <div>
              <span>Total Received</span>
              <strong>{formatCurrency(received)}</strong>
              <small>Incoming client payments saved in this project</small>
            </div>
            <div className={netProfitLoss < 0 ? "loss" : "profit"}>
              <span>Net Profit / Loss</span>
              <strong>{formatCurrency(netProfitLoss)}</strong>
              <small>Received - Total Spend</small>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <h3>Spend Breakdown</h3>
            </div>
          </div>
          <div className="finance-breakdown-list">
            {financeFormula.map((item) => (
              <div key={item.label}>
                <span>{item.label}</span>
                <strong>{formatCurrency(item.value)}</strong>
              </div>
            ))}
            <div className="finance-breakdown-total">
              <span>Pending Collections</span>
              <strong>{formatCurrency(pendingCollections)}</strong>
            </div>
            <div className="finance-breakdown-total">
              <span>Pending Payments</span>
              <strong>{formatCurrency(pendingPayments)}</strong>
            </div>
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="finance-tabs">
          {financeEntryTabs.map(([key, label]) => (
            <button
              aria-pressed={activeEntry === key}
              className={activeEntry === key ? "active" : ""}
              key={key}
              onClick={() => setActiveEntry(key)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
        <div className="finance-active-heading">
          <span>Selected Section</span>
          <strong>{financeEntryTabs.find(([key]) => key === activeEntry)?.[1]}</strong>
        </div>

        {activeEntry === "budget" ? (
          <form className="form-grid form-grid--two finance-entry-form" onSubmit={(event) => saveRecord(event, "budget")}>
            <VoiceField label="Project Budget" min="0" onChangeValue={(value) => setBudgetForm((current) => ({ ...current, project_budget: value }))} step="0.01" type="number" value={budgetForm.project_budget} />
            <VoiceField label="Category" list="budget-category-options" onChangeValue={(value) => setBudgetForm((current) => ({ ...current, category: value }))} placeholder="Materials" value={budgetForm.category} />
            <VoiceField label="Allocated Amount" min="0" onChangeValue={(value) => setBudgetForm((current) => ({ ...current, allocated_amount: value }))} step="0.01" type="number" value={budgetForm.allocated_amount} />
            <VoiceField label="Revised Budget" min="0" onChangeValue={(value) => setBudgetForm((current) => ({ ...current, revised_amount: value }))} step="0.01" type="number" value={budgetForm.revised_amount} />
            <VoiceField control="select" label="Approval" onChangeValue={(value) => setBudgetForm((current) => ({ ...current, approval_status: value }))} options={selectOptions.budgetApproval} value={budgetForm.approval_status} />
            <VoiceField appendVoice className="field field--full" control="textarea" label="Revision Note" onChangeValue={(value) => setBudgetForm((current) => ({ ...current, revision_note: value }))} placeholder="Reason for revision" rows={3} value={budgetForm.revision_note} />
            <button className="primary-button" type="submit">Save Budget</button>
          </form>
        ) : null}

        {activeEntry === "expense" ? (
          <form className="form-grid form-grid--two finance-entry-form" onSubmit={(event) => saveRecord(event, "expense")}>
            <VoiceField label="Date" onChangeValue={(value) => setExpenseForm((current) => ({ ...current, expense_date: value }))} type="date" value={expenseForm.expense_date} />
            <VoiceField control="select" label="Expense Type" onChangeValue={(value) => setExpenseForm((current) => ({ ...current, expense_type: value }))} options={selectOptions.expenseType} value={expenseForm.expense_type} />
            <VoiceField label="Category" list="expense-category-options" onChangeValue={(value) => setExpenseForm((current) => ({ ...current, category: value }))} placeholder="Direct Expense" value={expenseForm.category} />
            <VoiceField label="Title" onChangeValue={(value) => setExpenseForm((current) => ({ ...current, title: value }))} placeholder="Steel delivery" value={expenseForm.title} />
            <VoiceField label="Amount" min="0" onChangeValue={(value) => setExpenseForm((current) => ({ ...current, amount: value }))} step="0.01" type="number" value={expenseForm.amount} />
            <VoiceField label="Vendor" onChangeValue={(value) => setExpenseForm((current) => ({ ...current, vendor_name: value }))} placeholder="Supplier name" value={expenseForm.vendor_name} />
            <VoiceField control="select" label="Payment Mode" onChangeValue={(value) => setExpenseForm((current) => ({ ...current, payment_mode: value }))} options={selectOptions.paymentMode} value={expenseForm.payment_mode} />
            <VoiceField label="Receipt Number" onChangeValue={(value) => setExpenseForm((current) => ({ ...current, receipt_number: value }))} placeholder="INV-2248" value={expenseForm.receipt_number} />
            <VoiceField label="Attachment / Receipt" onChangeValue={(value) => setExpenseForm((current) => ({ ...current, attachment_reference: value }))} placeholder="File name or receipt link" value={expenseForm.attachment_reference} />
            <VoiceField control="select" label="Approval" onChangeValue={(value) => setExpenseForm((current) => ({ ...current, approval_status: value }))} options={selectOptions.approval} value={expenseForm.approval_status} />
            <VoiceField appendVoice className="field field--full" control="textarea" label="Notes" onChangeValue={(value) => setExpenseForm((current) => ({ ...current, notes: value }))} placeholder="Quantity or site purpose" rows={3} value={expenseForm.notes} />
            <VoiceField appendVoice className="field field--full" control="textarea" label="Expense History" onChangeValue={(value) => setExpenseForm((current) => ({ ...current, history_note: value }))} placeholder="Approval or edit history note" rows={2} value={expenseForm.history_note} />
            <button className="primary-button" type="submit">Save Expense</button>
          </form>
        ) : null}

        {activeEntry === "payment" ? (
          <form className="form-grid form-grid--two finance-entry-form" onSubmit={(event) => saveRecord(event, "payment")}>
            <VoiceField label="Date" onChangeValue={(value) => setPaymentForm((current) => ({ ...current, payment_date: value }))} type="date" value={paymentForm.payment_date} />
            <VoiceField control="select" label="Type" onChangeValue={(value) => setPaymentForm((current) => ({ ...current, payment_type: value }))} options={selectOptions.paymentType} value={paymentForm.payment_type} />
            <VoiceField control="select" label="Category" onChangeValue={(value) => setPaymentForm((current) => ({ ...current, payment_category: value }))} options={selectOptions.paymentCategory} value={paymentForm.payment_category} />
            <VoiceField label="Amount" min="0" onChangeValue={(value) => setPaymentForm((current) => ({ ...current, amount: value }))} step="0.01" type="number" value={paymentForm.amount} />
            <VoiceField control="select" label="Payment Method" onChangeValue={(value) => setPaymentForm((current) => ({ ...current, payment_method: value }))} options={selectOptions.paymentMode} value={paymentForm.payment_method} />
            <VoiceField label="Reference" onChangeValue={(value) => setPaymentForm((current) => ({ ...current, reference_number: value }))} placeholder="UTR / cheque / voucher" value={paymentForm.reference_number} />
            <VoiceField label="Client / Paid To" onChangeValue={(value) => setPaymentForm((current) => ({ ...current, received_from: value }))} placeholder="Client or vendor" value={paymentForm.received_from} />
            <VoiceField label="Due Date" onChangeValue={(value) => setPaymentForm((current) => ({ ...current, due_date: value }))} type="date" value={paymentForm.due_date} />
            <VoiceField label="Receipt Upload" onChangeValue={(value) => setPaymentForm((current) => ({ ...current, receipt_reference: value }))} placeholder="File name or receipt link" value={paymentForm.receipt_reference} />
            <VoiceField control="select" label="Payment Status" onChangeValue={(value) => setPaymentForm((current) => ({ ...current, payment_status: value }))} options={selectOptions.paymentStatus} value={paymentForm.payment_status} />
            <VoiceField appendVoice className="field field--full" control="textarea" label="Approval Workflow" onChangeValue={(value) => setPaymentForm((current) => ({ ...current, approval_note: value }))} placeholder="Approval step or manager note" rows={2} value={paymentForm.approval_note} />
            <VoiceField appendVoice className="field field--full" control="textarea" label="Notes" onChangeValue={(value) => setPaymentForm((current) => ({ ...current, notes: value }))} placeholder="Stage billing or payment purpose" rows={3} value={paymentForm.notes} />
            <button className="primary-button" type="submit">Save Payment</button>
          </form>
        ) : null}

        {activeEntry === "petty" ? (
          <form className="form-grid form-grid--two finance-entry-form" onSubmit={(event) => saveRecord(event, "petty")}>
            <VoiceField control="select" label="Entry Type" onChangeValue={(value) => setPettyForm((current) => ({ ...current, cash_type: value }))} options={selectOptions.pettyType} value={pettyForm.cash_type} />
            <VoiceField label="Date" onChangeValue={(value) => setPettyForm((current) => ({ ...current, entry_date: value }))} type="date" value={pettyForm.entry_date} />
            <VoiceField label="Issued To" onChangeValue={(value) => setPettyForm((current) => ({ ...current, issued_to: value }))} placeholder="Employee name" value={pettyForm.issued_to} />
            <VoiceField label="Issued By" onChangeValue={(value) => setPettyForm((current) => ({ ...current, issued_by: value }))} placeholder="Manager name" value={pettyForm.issued_by} />
            <VoiceField label="Amount" min="0" onChangeValue={(value) => setPettyForm((current) => ({ ...current, amount: value }))} step="0.01" type="number" value={pettyForm.amount} />
            <VoiceField label="Current Balance" min="0" onChangeValue={(value) => setPettyForm((current) => ({ ...current, current_balance: value }))} step="0.01" type="number" value={pettyForm.current_balance} />
            <VoiceField label="Category" onChangeValue={(value) => setPettyForm((current) => ({ ...current, expense_category: value }))} placeholder="Transport / tools / site welfare" value={pettyForm.expense_category} />
            <VoiceField label="Receipt Upload" onChangeValue={(value) => setPettyForm((current) => ({ ...current, receipt_reference: value }))} placeholder="File name or receipt link" value={pettyForm.receipt_reference} />
            <VoiceField control="select" label="Status" onChangeValue={(value) => setPettyForm((current) => ({ ...current, status: value }))} options={selectOptions.pettyStatus} value={pettyForm.status} />
            <VoiceField label="Approved By" onChangeValue={(value) => setPettyForm((current) => ({ ...current, approved_by: value }))} placeholder="Approver" value={pettyForm.approved_by} />
            <VoiceField label="Approved Date" onChangeValue={(value) => setPettyForm((current) => ({ ...current, approved_date: value }))} type="date" value={pettyForm.approved_date} />
            <VoiceField appendVoice className="field field--full" control="textarea" label="Description" onChangeValue={(value) => setPettyForm((current) => ({ ...current, description: value }))} placeholder="Cash purpose or settlement note" rows={3} value={pettyForm.description} />
            <button className="primary-button" type="submit">Save Petty Cash</button>
          </form>
        ) : null}

        {activeEntry === "collection" ? (
          <form className="form-grid form-grid--two finance-entry-form" onSubmit={(event) => saveRecord(event, "collection")}>
            <VoiceField label="Client Name" onChangeValue={(value) => setCollectionForm((current) => ({ ...current, client_name: value }))} placeholder="Client name" value={collectionForm.client_name} />
            <VoiceField label="Expected Date" onChangeValue={(value) => setCollectionForm((current) => ({ ...current, expected_date: value }))} type="date" value={collectionForm.expected_date} />
            <VoiceField label="Expected Amount" min="0" onChangeValue={(value) => setCollectionForm((current) => ({ ...current, expected_amount: value }))} step="0.01" type="number" value={collectionForm.expected_amount} />
            <VoiceField label="Forecast Amount" min="0" onChangeValue={(value) => setCollectionForm((current) => ({ ...current, forecast_amount: value }))} step="0.01" type="number" value={collectionForm.forecast_amount} />
            <VoiceField control="select" label="Status" onChangeValue={(value) => setCollectionForm((current) => ({ ...current, status: value }))} options={selectOptions.collectionStatus} value={collectionForm.status} />
            <VoiceField appendVoice className="field field--full" control="textarea" label="Follow-up Note" onChangeValue={(value) => setCollectionForm((current) => ({ ...current, follow_up_note: value }))} placeholder="Call note or next action" rows={3} value={collectionForm.follow_up_note} />
            <VoiceField appendVoice className="field field--full" control="textarea" label="Collection History" onChangeValue={(value) => setCollectionForm((current) => ({ ...current, history_note: value }))} placeholder="Previous follow-up result" rows={2} value={collectionForm.history_note} />
            <button className="primary-button" type="submit">Save Collection</button>
          </form>
        ) : null}

        {activeEntry === "cashFlow" ? (
          <form className="form-grid form-grid--two finance-entry-form" onSubmit={(event) => saveRecord(event, "cashFlow")}>
            <VoiceField control="select" label="Period" onChangeValue={(value) => setCashFlowForm((current) => ({ ...current, period_type: value }))} options={selectOptions.cashFlowPeriod} value={cashFlowForm.period_type} />
            <VoiceField label="Date" onChangeValue={(value) => setCashFlowForm((current) => ({ ...current, flow_date: value }))} type="date" value={cashFlowForm.flow_date} />
            <VoiceField label="Opening Balance" min="0" onChangeValue={(value) => setCashFlowForm((current) => ({ ...current, opening_balance: value }))} step="0.01" type="number" value={cashFlowForm.opening_balance} />
            <VoiceField label="Cash In" min="0" onChangeValue={(value) => setCashFlowForm((current) => ({ ...current, cash_in: value }))} step="0.01" type="number" value={cashFlowForm.cash_in} />
            <VoiceField label="Cash Out" min="0" onChangeValue={(value) => setCashFlowForm((current) => ({ ...current, cash_out: value }))} step="0.01" type="number" value={cashFlowForm.cash_out} />
            <VoiceField disabled label="Closing Balance" min="0" step="0.01" type="number" value={String(computedClosingBalance)} />
            <VoiceField appendVoice className="field field--full" control="textarea" label="Cash Flow Notes" onChangeValue={(value) => setCashFlowForm((current) => ({ ...current, notes: value }))} placeholder="Daily / weekly / monthly cash note" rows={3} value={cashFlowForm.notes} />
            <button className="primary-button" type="submit">Save Cash Flow</button>
          </form>
        ) : null}
      </section>

      <datalist id="expense-category-options">
        {expenseCategoryOptions.map((option) => <option key={option} value={option} />)}
      </datalist>
      <datalist id="budget-category-options">
        {budgetCategoryOptions.map((option) => <option key={option} value={option} />)}
      </datalist>

      <div className="split-layout split-layout--equal">
        <section className="panel">
          <div className="section-heading"><div><h3>Financial Alerts</h3></div></div>
          <div className="check-list">
            {generatedAlerts.length ? generatedAlerts.map((alert, index) => (
              <div className="check-item" key={`${alert.title}-${index}`}>
                <strong>{alert.title}</strong>
                <span>{alert.text}</span>
              </div>
            )) : (
              <div className="check-item">
                <strong>No alerts</strong>
                <span>Project finance is inside the current limits.</span>
              </div>
            )}
          </div>
        </section>

        <section className="panel">
          <div className="section-heading"><div><h3>Project-wise Summary</h3></div></div>
          <div className="finance-flow-grid">
            <div className="finance-flow-card"><span>Revenue Plan</span><strong>{formatCurrency(expectedRevenue)}</strong><small>Project estimated revenue</small></div>
            <div className="finance-flow-card"><span>Budget Variance</span><strong>{formatCurrency(activeBudget - totalSpend)}</strong><small>Budget - spend</small></div>
            <div className="finance-flow-card"><span>Collections</span><strong>{formatCurrency(pendingCollections)}</strong><small>Pending / forecasted</small></div>
            <div className={`finance-flow-card ${netProfitLoss < 0 ? "loss" : "profit"}`}><span>Actual Profit</span><strong>{formatCurrency(netProfitLoss)}</strong><small>{netProfitLoss < 0 ? "Loss" : "Profit"}</small></div>
          </div>
        </section>
      </div>

      <div className="finance-table-grid">
        <DataTable columns={budgetColumns} emptyText="No budget records for this project." rows={budgets} />
        <DataTable columns={expenseColumns} emptyText="No expenses recorded for this project." rows={expenses} />
        <DataTable columns={paymentColumns} emptyText="No payments recorded for this project." rows={payments} />
        <DataTable columns={pettyColumns} emptyText="No petty cash records for this project." rows={pettyCash} />
        <DataTable columns={collectionColumns} emptyText="No collection follow-ups for this project." rows={collections} />
        <DataTable columns={cashFlowColumns} emptyText="No cash flow records for this project." rows={cashFlowRows} />
      </div>
    </section>
  );
}
