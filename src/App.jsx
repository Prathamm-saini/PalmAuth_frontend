import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import EnrollPage from './pages/EnrollPage.jsx'
import VerifyPage from './pages/VerifyPage.jsx'
import SessionPage from './pages/SessionPage.jsx'
import HomePage from './pages/HomePage.jsx'
import DocsPage from './pages/DocsPage.jsx'
import AdminPage from './pages/AdminPage.jsx'

// Clean minimal layout
export default function App() {
  const location = useLocation();
  const isFullScreen = location.pathname === '/' || location.pathname === '/docs';
  const showSidebar = !isFullScreen;

  return (
    <>
      <div style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--bg-void)',
      }}>
        {!isFullScreen && <Sidebar />}

        {/* Main content area */}
        <main style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          background: isFullScreen ? 'var(--bg-void)' : 'var(--bg-surface)',
          position: 'relative',
        }}>

          {/* Page content */}
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/docs" element={<DocsPage />} />
            <Route path="/enroll" element={<EnrollPage />} />
            <Route path="/verify" element={<VerifyPage />} />
            <Route path="/session" element={<SessionPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </main>
      </div>
    </>
  )
}