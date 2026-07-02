import React from "react";
import { Route, Routes } from "react-router-dom";

import AppShell from "./components/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";
import ApprovalsPage from "./pages/ApprovalsPage";
import DashboardPage from "./pages/DashboardPage";
import DeliveryRoadmapPage from "./pages/DeliveryRoadmapPage";
import FinancePage from "./pages/FinancePage";
import LaborPage from "./pages/LaborPage";
import LoginPage from "./pages/LoginPage";
import MaterialsPage from "./pages/MaterialsPage";
import ProjectsPage from "./pages/ProjectsPage";
import QuotationsPage from "./pages/QuotationsPage";
import ReportsPage from "./pages/ReportsPage";
import SiteOperationsPage from "./pages/SiteOperationsPage";
import UsersPage from "./pages/UsersPage";
import BOQPage from "./pages/BOQPage";
import VendorPage from "./pages/VendorPage";
import PurchaseOrdersPage from "./pages/PurchaseOrdersPage";
import EquipmentPage from "./pages/EquipmentPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="*"
        element={
          <ProtectedRoute>
            <AppShell>
              <Routes>
                <Route path="/" element={<ProtectedRoute accessKey="dashboard"><DashboardPage /></ProtectedRoute>} />
                <Route path="/delivery-roadmap" element={<ProtectedRoute accessKey="roadmap"><DeliveryRoadmapPage /></ProtectedRoute>} />
                <Route path="/projects" element={<ProtectedRoute accessKey="projects"><ProjectsPage /></ProtectedRoute>} />
                <Route path="/site-operations" element={<ProtectedRoute accessKey="siteOperations"><SiteOperationsPage /></ProtectedRoute>} />
                <Route path="/labor" element={<ProtectedRoute accessKey="labor"><LaborPage /></ProtectedRoute>} />
                <Route path="/materials" element={<ProtectedRoute accessKey="materials"><MaterialsPage /></ProtectedRoute>} />
                <Route path="/finance" element={<ProtectedRoute accessKey="finance"><FinancePage /></ProtectedRoute>} />
                <Route path="/quotations" element={<ProtectedRoute accessKey="quotations"><QuotationsPage /></ProtectedRoute>} />
                <Route path="/approvals" element={<ProtectedRoute accessKey="approvals"><ApprovalsPage /></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute accessKey="reports"><ReportsPage /></ProtectedRoute>} />
                <Route path="/users" element={<ProtectedRoute accessKey="userManagement"><UsersPage /></ProtectedRoute>} />
                <Route
  path="/boq"
  element={
    <ProtectedRoute accessKey="boq">
      <BOQPage />
    </ProtectedRoute>
  }
/>

<Route
  path="/vendors"
  element={
    <ProtectedRoute accessKey="vendors">
      <VendorPage />
    </ProtectedRoute>
  }
/>

<Route
  path="/purchase-orders"
  element={
    <ProtectedRoute accessKey="purchaseOrders">
      <PurchaseOrdersPage />
    </ProtectedRoute>
  }
/>

<Route
  path="/equipment"
  element={
    <ProtectedRoute accessKey="equipment">
      <EquipmentPage />
    </ProtectedRoute>
  }
/>
              </Routes>
            </AppShell>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
