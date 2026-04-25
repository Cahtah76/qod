import React, { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import Header from './Header.jsx'

const pageTitles = {
  '/': 'Dashboard',
  '/events': 'Events',
  '/scheduling': 'Scheduling',
  '/issues': 'Issue Tracking',
  '/reports': 'Reports',
  '/venues': 'Venues',
  '/kits': 'Kits',
  '/employees': 'Employees',
  '/documentation': 'Documentation & Training',
  '/admin': 'Admin Dashboard',
  '/roadmap': 'Project Management',
}

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  const path = '/' + location.pathname.split('/')[1]
  const title = pageTitles[path] || 'QOD'

  return (
    <div className="flex" style={{ minHeight: '100vh' }}>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className="flex flex-col flex-1 min-w-0">
        <Header title={title} />
        <main className="flex-1 overflow-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
