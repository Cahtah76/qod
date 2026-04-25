import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AppProvider } from './context/AppContext.jsx'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import Layout from './components/layout/Layout.jsx'
import LoginPage from './pages/Auth/LoginPage.jsx'
import ChangePasswordPage from './pages/Auth/ChangePasswordPage.jsx'

import Dashboard from './pages/Dashboard.jsx'
import EventsPage from './pages/Events/EventsPage.jsx'
import EventDetail from './pages/Events/EventDetail.jsx'
import ChecklistPage from './pages/Checklists/ChecklistPage.jsx'
import VenuesPage from './pages/Venues/VenuesPage.jsx'
import VenueDetail from './pages/Venues/VenueDetail.jsx'
import KitsPage from './pages/Kits/KitsPage.jsx'
import EmployeesPage from './pages/Employees/EmployeesPage.jsx'
import SchedulingPage from './pages/Scheduling/SchedulingPage.jsx'
import IssuesPage from './pages/Issues/IssuesPage.jsx'
import DocumentationPage from './pages/Documentation/DocumentationPage.jsx'
import ReportsPage, { ReportDetail, ReportForm } from './pages/Reports/ReportsPage.jsx'
import AdminPage from './pages/Admin/AdminPage.jsx'
import RoadmapPage from './pages/Roadmap/RoadmapPage.jsx'

// ─── Route guards ─────────────────────────────────────────────────────────────
function RequireAuth({ children }) {
  const { isAuthenticated, mustChangePassword } = useAuth()
  const location = useLocation()
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  if (mustChangePassword) {
    return <AppProvider><ChangePasswordPage /></AppProvider>
  }
  return <AppProvider>{children}</AppProvider>
}

function RequireAdmin({ children }) {
  const { can } = useAuth()
  if (!can('admin')) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected */}
            <Route element={<RequireAuth><Layout /></RequireAuth>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/:id" element={<EventDetail />} />
              <Route path="/events/:id/checklist/set-day" element={<ChecklistPage type="set-day" />} />
              <Route path="/events/:id/checklist/game-day" element={<ChecklistPage type="game-day" />} />
              <Route path="/events/:id/checklist/instance/:instanceId" element={<ChecklistPage type="instance" />} />
              <Route path="/venues" element={<VenuesPage />} />
              <Route path="/venues/:id" element={<VenueDetail />} />
              <Route path="/kits" element={<KitsPage />} />
              <Route path="/employees" element={<EmployeesPage />} />
              <Route path="/scheduling" element={<SchedulingPage />} />
              <Route path="/issues" element={<IssuesPage />} />
              <Route path="/documentation" element={<DocumentationPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/reports/new" element={<ReportForm />} />
              <Route path="/reports/:id" element={<ReportDetail />} />

              <Route path="/roadmap" element={<RoadmapPage />} />

              {/* Admin-only */}
              <Route path="/admin" element={<RequireAdmin><AdminPage /></RequireAdmin>} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
    </AuthProvider>
  )
}
