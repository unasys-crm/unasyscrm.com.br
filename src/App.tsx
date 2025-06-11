import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { CompanyProvider } from './contexts/CompanyContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import PublicRoute from './components/auth/PublicRoute'
import Layout from './components/layout/Layout'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import ClientsPage from './pages/clients/ClientsPage'
import ProposalsPage from './pages/proposals/ProposalsPage'
import SalesPage from './pages/sales/SalesPage'
import TasksPage from './pages/tasks/TasksPage'
import MessagesPage from './pages/messages/MessagesPage'
import ReportsPage from './pages/reports/ReportsPage'
import NotificationsPage from './pages/notifications/NotificationsPage'
import IntegrationsPage from './pages/integrations/IntegrationsPage'
import AdminPage from './pages/admin/AdminPage'
import ProfilePage from './pages/profile/ProfilePage'
import SettingsPage from './pages/settings/SettingsPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CompanyProvider>
          <div className="min-h-screen bg-background text-foreground">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              } />
              <Route path="/register" element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              } />

              {/* Protected Routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="clients/*" element={<ClientsPage />} />
                <Route path="proposals/*" element={<ProposalsPage />} />
                <Route path="sales/*" element={<SalesPage />} />
                <Route path="tasks/*" element={<TasksPage />} />
                <Route path="messages/*" element={<MessagesPage />} />
                <Route path="reports/*" element={<ReportsPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="integrations/*" element={<IntegrationsPage />} />
                <Route path="admin/*" element={<AdminPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="settings/*" element={<SettingsPage />} />
              </Route>

              {/* 404 Page */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </div>
        </CompanyProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App