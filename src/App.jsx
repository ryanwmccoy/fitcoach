import { useState } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth'
import AuthPage        from './pages/AuthPage'
import CalendarPage    from './pages/CalendarPage'
import ClientsPage     from './pages/ClientsPage'
import SuggestPage     from './pages/SuggestPage'
import ExportPage      from './pages/ExportPage'
import SettingsPage    from './pages/SettingsPage'
import AddSessionModal from './components/AddSessionModal'

function Shell() {
  const { user, loading } = useAuth()
  const [page, setPage]   = useState('calendar')
  const [addSession, setAddSession] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  if (loading) return <div className="loading" style={{ paddingTop: 80 }}>Loading…</div>
  if (!user)   return <AuthPage />

  const nav = [
    { id: 'calendar', label: 'Calendar',    icon: '▦' },
    { id: 'clients',  label: 'Clients',     icon: '◎' },
    { id: 'suggest',  label: 'Find a slot', icon: '◈' },
    { id: 'export',   label: 'Export week', icon: '↓' },
    { id: 'settings', label: 'Settings',    icon: '⚙' },
  ]

  return (
    <div className="app-shell">
      {/* Sidebar (desktop) */}
      <div className="sidebar">
        <div className="brand">FitCoach</div>

        <div className="nav-section">Schedule</div>
        {nav.slice(0, 4).map(n => (
          <button key={n.id} className={`nav-btn${page === n.id ? ' active' : ''}`} onClick={() => setPage(n.id)}>
            <span style={{ fontSize: 13 }}>{n.icon}</span> {n.label}
          </button>
        ))}

        <div className="nav-section">Add</div>
        <button className="nav-btn" onClick={() => setAddSession(true)}>+ Session</button>
        <button className="nav-btn" onClick={() => setPage('clients')}>+ Client</button>
        <button className="nav-btn" onClick={() => setPage('settings')}>+ Location</button>

        <div className="sidebar-footer">
          <button className={`nav-btn${page === 'settings' ? ' active' : ''}`} onClick={() => setPage('settings')}>
            <span style={{ fontSize: 13 }}>⚙</span> Settings
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="main">
        {page === 'calendar' && <CalendarPage onAddSession={() => setAddSession(true)} refreshKey={refreshKey} />}
        {page === 'clients'  && <ClientsPage />}
        {page === 'suggest'  && <SuggestPage />}
        {page === 'export'   && <ExportPage />}
        {page === 'settings' && <SettingsPage />}
      </div>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav">
        {nav.map(n => (
          <button key={n.id} className={`nav-btn${page === n.id ? ' active' : ''}`} onClick={() => setPage(n.id)}>
            <span style={{ fontSize: 16 }}>{n.icon}</span>
            {n.label}
          </button>
        ))}
      </nav>

      {addSession && (
        <AddSessionModal
          onClose={() => setAddSession(false)}
          onSaved={() => setRefreshKey(k => k + 1)}
        />
      )}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  )
}
