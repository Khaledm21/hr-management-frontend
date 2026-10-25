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
import { FormsTemplatesPage } from '../features/documents/FormsTemplatesPage';
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
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-500">Checking authentication...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const PermissionRoute: React.FC<{ module: string; children: React.ReactNode }> = ({ module, children }) => {
  const { can } = useAuth();

  if (!can(module, 'view')) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Auth Route */}
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />

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
        <Route
          path="employees"
          element={
            <PermissionRoute module="employees">
              <EmployeesListPage />
            </PermissionRoute>
          }
        />
        <Route
          path="employees/:id"
          element={
            <PermissionRoute module="employees">
              <EmployeeProfilePage />
            </PermissionRoute>
          }
        />
        <Route
          path="departments"
          element={
            <PermissionRoute module="employees">
              <DepartmentsPage />
            </PermissionRoute>
          }
        />
        <Route
          path="positions"
          element={
            <PermissionRoute module="employees">
              <PositionsPage />
            </PermissionRoute>
          }
        />

        {/* Documents & Insurance */}
        <Route
          path="documents"
          element={
            <PermissionRoute module="documents">
              <DocumentsPage />
            </PermissionRoute>
          }
        />
        <Route
          path="forms-templates"
          element={
            <PermissionRoute module="documents">
              <FormsTemplatesPage />
            </PermissionRoute>
          }
        />
        <Route
          path="insurance"
          element={
            <PermissionRoute module="insurance">
              <InsurancePage />
            </PermissionRoute>
          }
        />

        {/* Employment */}
        <Route
          path="contracts"
          element={
            <PermissionRoute module="contracts">
              <ContractsPage />
            </PermissionRoute>
          }
        />
        <Route
          path="employment-history"
          element={
            <PermissionRoute module="contracts">
              <EmploymentHistoryPage />
            </PermissionRoute>
          }
        />

        {/* Attendance & Leave */}
        <Route
          path="attendance"
          element={
            <PermissionRoute module="attendance">
              <AttendancePage />
            </PermissionRoute>
          }
        />
        <Route
          path="leave"
          element={
            <PermissionRoute module="leave">
              <LeavePage />
            </PermissionRoute>
          }
        />
        <Route
          path="leave/requests"
          element={
            <PermissionRoute module="leave">
              <LeavePage />
            </PermissionRoute>
          }
        />
        <Route
          path="leave/balances"
          element={
            <PermissionRoute module="leave">
              <LeavePage />
            </PermissionRoute>
          }
        />

        {/* Payroll & Advances & Driver Payouts */}
        <Route
          path="payroll"
          element={
            <PermissionRoute module="payroll">
              <PayrollPage />
            </PermissionRoute>
          }
        />
        <Route
          path="payroll/:period"
          element={
            <PermissionRoute module="payroll">
              <PayrollPeriodDetailsPage />
            </PermissionRoute>
          }
        />
        <Route
          path="advances"
          element={
            <PermissionRoute module="advances">
              <AdvancesPage />
            </PermissionRoute>
          }
        />
        <Route
          path="driver-payouts"
          element={
            <PermissionRoute module="payroll">
              <DriverPayoutsPage />
            </PermissionRoute>
          }
        />

        {/* Workflow & Approvals */}
        <Route
          path="approvals"
          element={
            <PermissionRoute module="approvals">
              <ApprovalsPage />
            </PermissionRoute>
          }
        />

        {/* Reports & Analytics */}
        <Route
          path="reports"
          element={
            <PermissionRoute module="reports">
              <ReportsPage />
            </PermissionRoute>
          }
        />

        {/* Notifications */}
        <Route path="notifications" element={<NotificationsPage />} />

        {/* Administration */}
        <Route
          path="users"
          element={
            <PermissionRoute module="users">
              <UsersPage />
            </PermissionRoute>
          }
        />
        <Route
          path="roles"
          element={
            <PermissionRoute module="users">
              <RolesPermissionsPage />
            </PermissionRoute>
          }
        />
        <Route
          path="audit-logs"
          element={
            <PermissionRoute module="audit_logs">
              <AuditLogsPage />
            </PermissionRoute>
          }
        />
        <Route
          path="settings"
          element={
            <PermissionRoute module="settings">
              <SettingsPage />
            </PermissionRoute>
          }
        />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
