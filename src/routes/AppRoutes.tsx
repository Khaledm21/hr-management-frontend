import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/layout/AppLayout';
// Helper for lazy loading named exports
const lazyLoad = <T extends Record<string, React.ComponentType<any>>, K extends keyof T>(
  loader: () => Promise<T>,
  key: K
) => React.lazy(() => loader().then(m => ({ default: m[key] })));

// Lazy-loaded route components (Code Splitting)
const LoginPage = lazyLoad(() => import('../features/auth/LoginPage'), 'LoginPage');
const DashboardPage = lazyLoad(() => import('../features/dashboard/DashboardPage'), 'DashboardPage');
const EmployeesListPage = lazyLoad(() => import('../features/employees/EmployeesListPage'), 'EmployeesListPage');
const EmployeeProfilePage = lazyLoad(() => import('../features/employees/EmployeeProfilePage'), 'EmployeeProfilePage');
const DepartmentsPage = lazyLoad(() => import('../features/departments/DepartmentsPage'), 'DepartmentsPage');
const PositionsPage = lazyLoad(() => import('../features/positions/PositionsPage'), 'PositionsPage');
const DocumentsPage = lazyLoad(() => import('../features/documents/DocumentsPage'), 'DocumentsPage');
const FormsTemplatesPage = lazyLoad(() => import('../features/documents/FormsTemplatesPage'), 'FormsTemplatesPage');
const InsurancePage = lazyLoad(() => import('../features/insurance/InsurancePage'), 'InsurancePage');
const ContractsPage = lazyLoad(() => import('../features/contracts/ContractsPage'), 'ContractsPage');
const EmploymentHistoryPage = lazyLoad(() => import('../features/employmentHistory/EmploymentHistoryPage'), 'EmploymentHistoryPage');
const AttendancePage = lazyLoad(() => import('../features/attendance/AttendancePage'), 'AttendancePage');
const LeavePage = lazyLoad(() => import('../features/leave/LeavePage'), 'LeavePage');
const ApprovalsPage = lazyLoad(() => import('../features/approvals/ApprovalsPage'), 'ApprovalsPage');
const PayrollPage = lazyLoad(() => import('../features/payroll/PayrollPage'), 'PayrollPage');
const PayrollPeriodDetailsPage = lazyLoad(() => import('../features/payroll/PayrollPeriodDetailsPage'), 'PayrollPeriodDetailsPage');
const AdvancesPage = lazyLoad(() => import('../features/advances/AdvancesPage'), 'AdvancesPage');
const DriverPayoutsPage = lazyLoad(() => import('../features/drivers/DriverPayoutsPage'), 'DriverPayoutsPage');
const ReportsPage = lazyLoad(() => import('../features/reports/ReportsPage'), 'ReportsPage');
const NotificationsPage = lazyLoad(() => import('../features/notifications/NotificationsPage'), 'NotificationsPage');
const UsersPage = lazyLoad(() => import('../features/users/UsersPage'), 'UsersPage');
const RolesPermissionsPage = lazyLoad(() => import('../features/users/RolesPermissionsPage'), 'RolesPermissionsPage');
const AuditLogsPage = lazyLoad(() => import('../features/audit/AuditLogsPage'), 'AuditLogsPage');
const SettingsPage = lazyLoad(() => import('../features/settings/SettingsPage'), 'SettingsPage');

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0B0F19]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">جاري التحقق من صلاحيات الدخول...</span>
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
  const { can, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!can(module, 'view')) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0B0F19]">
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
            <React.Suspense
              fallback={
                <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0B0F19]">
                  <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
                </div>
              }
            >
              <LoginPage />
            </React.Suspense>
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
