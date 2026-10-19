import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/layout/AppLayout';
import { LoginPage } from '../features/auth/LoginPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { EmployeesListPage } from '../features/employees/EmployeesListPage';
import { EmployeeProfilePage } from '../features/employees/EmployeeProfilePage';
import { DepartmentsPage } from '../features/departments/DepartmentsPage';
import { PositionsPage } from '../features/positions/PositionsPage';
import { DocumentsPage } from '../features/documents/DocumentsPage';
import { InsurancePage } from '../features/insurance/InsurancePage';
import { ContractsPage } from '../features/contracts/ContractsPage';
import { EmploymentHistoryPage } from '../features/employmentHistory/EmploymentHistoryPage';
import { AttendancePage } from '../features/attendance/AttendancePage';
import { LeavePage } from '../features/leave/LeavePage';
import { ApprovalsPage } from '../features/approvals/ApprovalsPage';
import { PayrollPage } from '../features/payroll/PayrollPage';
import { PayrollPeriodDetailsPage } from '../features/payroll/PayrollPeriodDetailsPage';
import { AdvancesPage } from '../features/advances/AdvancesPage';
import { DriverPayoutsPage } from '../features/drivers/DriverPayoutsPage';
import { ReportsPage } from '../features/reports/ReportsPage';
import { NotificationsPage } from '../features/notifications/NotificationsPage';
import { UsersPage } from '../features/users/UsersPage';
import { RolesPermissionsPage } from '../features/users/RolesPermissionsPage';
import { AuditLogsPage } from '../features/audit/AuditLogsPage';
import { SettingsPage } from '../features/settings/SettingsPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Auth Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected App Layout Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />

        {/* People */}
        <Route path="employees" element={<EmployeesListPage />} />
        <Route path="employees/:id" element={<EmployeeProfilePage />} />
        <Route path="departments" element={<DepartmentsPage />} />
        <Route path="positions" element={<PositionsPage />} />

        {/* Documents & Insurance */}
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="insurance" element={<InsurancePage />} />

        {/* Employment */}
        <Route path="contracts" element={<ContractsPage />} />
        <Route path="employment-history" element={<EmploymentHistoryPage />} />

        {/* Attendance & Leave */}
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="leave" element={<LeavePage />} />
        <Route path="leave/requests" element={<LeavePage />} />
        <Route path="leave/balances" element={<LeavePage />} />

        {/* Payroll & Advances & Driver Payouts */}
        <Route path="payroll" element={<PayrollPage />} />
        <Route path="payroll/:period" element={<PayrollPeriodDetailsPage />} />
        <Route path="advances" element={<AdvancesPage />} />
        <Route path="driver-payouts" element={<DriverPayoutsPage />} />

        {/* Workflow & Approvals */}
        <Route path="approvals" element={<ApprovalsPage />} />

        {/* Reports & Analytics */}
        <Route path="reports" element={<ReportsPage />} />

        {/* Notifications */}
        <Route path="notifications" element={<NotificationsPage />} />

        {/* Administration */}
        <Route path="users" element={<UsersPage />} />
        <Route path="roles" element={<RolesPermissionsPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
