export function toNumber(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const normalized = String(value ?? "")
    .replace(/,/g, "")
    .match(/-?\d+(\.\d+)?/);

  return normalized ? Number(normalized[0]) : 0;
}

export function calculateLineTotal(quantity, unitRate) {
  return Number((toNumber(quantity) * toNumber(unitRate)).toFixed(2));
}

export function calculateLaborTotal(attendanceDays, wagePerDay, overtimeAmount = 0) {
  return Number((toNumber(attendanceDays) * toNumber(wagePerDay) + toNumber(overtimeAmount)).toFixed(2));
}

export function calculateClosingBalance(openingBalance, cashIn, cashOut) {
  return Number((toNumber(openingBalance) + toNumber(cashIn) - toNumber(cashOut)).toFixed(2));
}

export function formatCurrency(value) {
  const numericValue = toNumber(value);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(numericValue);
}

export function formatStatus(status) {
  if (!status) {
    return "Unknown";
  }

  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
