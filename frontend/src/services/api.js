const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";
const AUTH_EXPIRED_EVENT = "charlescrm:auth-expired";
const API_NOTICE_EVENT = "charlescrm:api-notice";

function getStoredToken() {
  return window.localStorage.getItem("accessToken");
}

function decodeTokenPayload(token) {
  try {
    const payload = token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    return JSON.parse(window.atob(padded));
  } catch {
    return null;
  }
}

function isTokenExpired(token) {
  const payload = decodeTokenPayload(token);
  if (!payload?.exp) {
    return false;
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= nowInSeconds;
}

function getAuthHeaders() {
  const token = getStoredToken();
  if (!token) {
    return {};
  }

  if (isTokenExpired(token)) {
    clearAccessToken();
    window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
    return {};
  }

  return token ? { Authorization: `Bearer ${token}` } : {};
}

function flattenErrorMessages(value) {
  if (!value) {
    return [];
  }

  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => flattenErrorMessages(item));
  }

  if (typeof value === "object") {
    return Object.entries(value).flatMap(([field, messages]) => {
      const fieldLabel = field === "non_field_errors" ? "" : `${field.replaceAll("_", " ")}: `;
      return flattenErrorMessages(messages).map((message) => `${fieldLabel}${message}`);
    });
  }

  return [String(value)];
}

function dispatchApiNotice(detail) {
  window.dispatchEvent(new CustomEvent(API_NOTICE_EVENT, { detail }));
}

function getMutationVerb(method = "GET") {
  const normalizedMethod = method.toUpperCase();

  if (normalizedMethod === "POST") {
    return "Saved successfully";
  }
  if (normalizedMethod === "PATCH" || normalizedMethod === "PUT") {
    return "Updated successfully";
  }
  if (normalizedMethod === "DELETE") {
    return "Deleted successfully";
  }

  return "";
}

async function request(path, options = {}) {
  const method = options.method || "GET";
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearAccessToken();
      window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
    }

    let errorMessage = "Something went wrong while loading data.";

    try {
      const errorBody = await response.json();
      errorMessage =
        errorBody.detail ||
        flattenErrorMessages(errorBody).join(" ") ||
        errorBody.message ||
        errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }

    const error = new Error(errorMessage);
    error.status = response.status;
    dispatchApiNotice({
      type: "error",
      title: "Action failed",
      message: errorMessage,
    });
    throw error;
  }

  const mutationVerb = getMutationVerb(method);
  if (mutationVerb && !path.startsWith("/auth/login/")) {
    dispatchApiNotice({
      type: "success",
      title: mutationVerb,
      message: "The latest data has been saved and refreshed where this page supports it.",
    });
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export function login(credentials) {
  return request("/auth/login/", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export function fetchCurrentUser() {
  return request("/auth/me/");
}

export function fetchUsers() {
  return request("/auth/users/");
}

export function createUser(payload) {
  return request("/auth/users/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateUser(id, payload) {
  return request(`/auth/users/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function fetchDashboardOverview() {
  return request("/dashboard/overview/");
}

export function fetchSmartAlerts() {
  return request("/dashboard/alerts/");
}

export function sendProfitLossAlert() {
  return request("/dashboard/profit-loss-alert-email/", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function fetchProjects() {
  return request("/projects/");
}

export function createProject(payload) {
  return request("/projects/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchProjectSummary(projectId) {
  return request(`/projects/${projectId}/summary/`);
}

export function fetchDailyLogs(projectId) {
  return request(`/projects/${projectId}/daily-logs/`);
}

export function createDailyLog(projectId, payload) {
  return request(`/projects/${projectId}/daily-logs/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchPayments(projectId = "") {
  const query = projectId ? `?project=${projectId}` : "";
  return request(`/finance/payments/${query}`);
}

export function fetchFinanceBudgets(projectId = "") {
  const query = projectId ? `?project=${projectId}` : "";
  return request(`/finance/budgets/${query}`);
}

export function createFinanceBudget(payload) {
  return request("/finance/budgets/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchPettyCash(projectId = "") {
  const query = projectId ? `?project=${projectId}` : "";
  return request(`/finance/petty-cash/${query}`);
}

export function createPettyCash(payload) {
  return request("/finance/petty-cash/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchCollections(projectId = "") {
  const query = projectId ? `?project=${projectId}` : "";
  return request(`/finance/collections/${query}`);
}

export function createCollection(payload) {
  return request("/finance/collections/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchCashFlow(projectId = "") {
  const query = projectId ? `?project=${projectId}` : "";
  return request(`/finance/cash-flow/${query}`);
}

export function createCashFlow(payload) {
  return request("/finance/cash-flow/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchLaborEntries(projectId = "") {
  const query = projectId ? `?project=${projectId}` : "";
  return request(`/labor/${query}`);
}

export function createLaborEntry(payload) {
  return request("/labor/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchMaterials() {
  return request("/materials/");
}

export function createMaterial(payload) {
  return request("/materials/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchMaterialPurchases(projectId = "") {
  const query = projectId ? `?project=${projectId}` : "";
  return request(`/materials/purchases/${query}`);
}

export function createMaterialPurchase(payload) {
  return request("/materials/purchases/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchMaterialUsage(projectId = "") {
  const query = projectId ? `?project=${projectId}` : "";
  return request(`/materials/usage/${query}`);
}

export function createMaterialUsage(payload) {
  return request("/materials/usage/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createPayment(payload) {
  return request("/finance/payments/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchQuotations() {
  return request("/quotations/");
}

export function createQuotation(payload) {
  return request("/quotations/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteQuotation(id) {
  return request(`/quotations/${id}/`, {
    method: "DELETE",
  });
}

export function convertQuotationToProject(id) {
  return request(`/quotations/${id}/convert-to-project/`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function fetchExpenses(projectId = "") {
  const query = projectId ? `?project=${projectId}` : "";
  return request(`/expenses/${query}`);
}

export function createExpense(payload) {
  return request("/expenses/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchApprovals() {
  return request("/approvals/");
}

// BOQ

export function fetchBOQ(projectId = "") {
  const query = projectId ? `?project=${projectId}` : "";
  return request(`/boq/boq/${query}`);
}

export function createBOQ(payload) {
  return request("/boq/boq/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateBOQ(id, payload) {
  return request(`/boq/boq/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteBOQ(id) {
  return request(`/boq/boq/${id}/`, {
    method: "DELETE",
  });
}


// Vendors

export function fetchVendors() {
  return request("/vendors/vendors/");
}

export function createVendor(payload) {
  return request("/vendors/vendors/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateVendor(id, payload) {
  return request(`/vendors/vendors/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteVendor(id) {
  return request(`/vendors/vendors/${id}/`, {
    method: "DELETE",
  });
}


// Purchase Orders

export function fetchPurchaseOrders(projectId = "") {
  const query = projectId ? `?project=${projectId}` : "";
  return request(`/purchase_orders/purchase-orders/${query}`);
}

export function createPurchaseOrder(payload) {
  return request("/purchase_orders/purchase-orders/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updatePurchaseOrder(id, payload) {
  return request(`/purchase_orders/purchase-orders/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deletePurchaseOrder(id) {
  return request(`/purchase_orders/purchase-orders/${id}/`, {
    method: "DELETE",
  });
}


// Equipment

export function fetchEquipment(projectId = "") {
  const query = projectId ? `?project=${projectId}` : "";
  return request(`/equipment/equipment/${query}`);
}

export function createEquipment(payload) {
  return request("/equipment/equipment/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateEquipment(id, payload) {
  return request(`/equipment/equipment/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteEquipment(id) {
  return request(`/equipment/equipment/${id}/`, {
    method: "DELETE",
  });
}

export function updateApproval(id, action, remarks = "") {
  return request(`/approvals/${id}/${action}/`, {
    method: "POST",
    body: JSON.stringify({ remarks }),
  });
}

export function fetchProjectFiles(projectId = "") {
  const query = projectId ? `?project=${projectId}` : "";
  return request(`/uploads/files/${query}`);
}

export function uploadProjectFile(formData) {
  return request("/uploads/files/", {
    method: "POST",
    body: formData,
  });
}

export function resolveMediaUrl(path = "") {
  if (!path) {
    return "";
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const apiOrigin = new URL(API_BASE_URL).origin;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${apiOrigin}${normalizedPath}`;
}

export function setAccessToken(token) {
  window.localStorage.setItem("accessToken", token);
}

export function clearAccessToken() {
  window.localStorage.removeItem("accessToken");
}

export function hasAccessToken() {
  return Boolean(getStoredToken());
}

export function hasValidAccessToken() {
  const token = getStoredToken();
  if (!token) {
    return false;
  }

  if (isTokenExpired(token)) {
    clearAccessToken();
    return false;
  }

  return true;
}

export function onAuthExpired(listener) {
  window.addEventListener(AUTH_EXPIRED_EVENT, listener);
  return () => window.removeEventListener(AUTH_EXPIRED_EVENT, listener);
}

export function onApiNotice(listener) {
  window.addEventListener(API_NOTICE_EVENT, listener);
  return () => window.removeEventListener(API_NOTICE_EVENT, listener);
}
