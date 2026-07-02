const ROLE_LABELS = {
  owner: "Owner",
  manager: "Manager",
  site_engineer: "Site Engineer",
  accountant: "Accountant",
  viewer: "Viewer",
};

const ACCESS_RULES = {
  dashboard: ["owner", "manager", "site_engineer", "accountant", "viewer"],

  roadmap: ["owner", "manager"],

  projects: ["owner", "manager", "site_engineer", "accountant", "viewer"],

  boq: ["owner", "manager", "site_engineer", "accountant"],

  siteOperations: [
    "owner",
    "manager",
    "site_engineer",
    "accountant",
    "viewer",
  ],

  labor: [
    "owner",
    "manager",
    "site_engineer",
    "accountant",
  ],

  materials: [
    "owner",
    "manager",
    "site_engineer",
    "accountant",
  ],

  equipment: [
    "owner",
    "manager",
    "site_engineer",
    "accountant",
  ],

  vendors: [
    "owner",
    "manager",
    "accountant",
  ],

  purchaseOrders: [
    "owner",
    "manager",
    "accountant",
  ],

  finance: [
    "owner",
    "manager",
    "accountant",
  ],

  quotations: [
    "owner",
    "manager",
    "accountant",
  ],

  approvals: [
    "owner",
    "manager",
    "accountant",
  ],

  reports: [
    "owner",
    "manager",
    "site_engineer",
    "accountant",
    "viewer",
  ],

  userManagement: ["owner"],
};

export function getRoleLabel(role) {
  return ROLE_LABELS[role] || "User";
}

export function hasAccess(user, accessKey) {
  if (!accessKey) {
    return Boolean(user);
  }

  if (!user) {
    return false;
  }

  if (user.is_superuser || user.is_staff) {
    return true;
  }

  const allowedRoles = ACCESS_RULES[accessKey] || [];
  return allowedRoles.includes(user.role);
}
