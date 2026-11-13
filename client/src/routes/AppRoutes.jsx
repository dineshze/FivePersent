import { Navigate, Route, Routes } from "react-router-dom";
import { Dashboard } from "../pages/DashboardPage.jsx";
import { LoansPage } from "../pages/LoansPage.jsx";
import { CustomersPage } from "../pages/CustomersPage.jsx";
import { PaymentsPage } from "../pages/PaymentsPage.jsx";
import { ReportsPage } from "../pages/ReportsPage.jsx";
import { SettingsPage } from "../pages/SettingsPage.jsx";
import { NotificationsPage } from "../pages/NotificationsPage.jsx";
import { pagePaths } from "./pagePaths.js";

export default function AppRoutes({
  data,
  loading,
  user,
  onCreateLoan,
  onViewLoan,
  onEditLoan,
  onDeleteLoan,
  onPayLoan,
  onEditCustomer,
  onViewCustomer,
  onCreatePayment,
  onNavigate,
  onLogout,
}) {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={pagePaths.Dashboard} replace />} />
      <Route
        path={pagePaths.Dashboard}
        element={
          <Dashboard
            data={data}
            loading={loading}
            onCreate={onCreateLoan}
            onNavigate={onNavigate}
            onView={onViewLoan}
          />
        }
      />
      <Route
        path={pagePaths.Loans}
        element={
          <LoansPage
            loans={data.loans}
            customers={data.customers}
            loading={loading}
            onCreate={onCreateLoan}
            onView={onViewLoan}
            onEdit={onEditLoan}
            onDelete={onDeleteLoan}
            onPay={onPayLoan}
          />
        }
      />
      <Route
        path={pagePaths.Customers}
        element={
          <CustomersPage
            customers={data.customers}
            loans={data.loans}
            loading={loading}
            onEdit={onEditCustomer}
            onView={onViewCustomer}
          />
        }
      />
      <Route
        path={pagePaths.Payments}
        element={
          <PaymentsPage
            payments={data.payments}
            loans={data.loans}
            loading={loading}
            onCreate={onCreatePayment}
          />
        }
      />
      <Route
        path={pagePaths.Reports}
        element={<ReportsPage data={data} loading={loading} />}
      />
      <Route
        path={pagePaths.Settings}
        element={<SettingsPage user={user} onLogout={onLogout} />}
      />
      <Route
        path={pagePaths.Notifications}
        element={<NotificationsPage />}
      />
      <Route path="*" element={<Navigate to={pagePaths.Dashboard} replace />} />
    </Routes>
  );
}
