import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Sidebar() {
  const { profilo, logout, isAdmin, isCassiere, isDirigente } = useAuth()

  return (
    <>
      {/* Header mobile con logout */}
      <div className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/logo.png" alt="D47" style={{ width: 32, height: 32, objectFit: 'contain' }} />
          <span style={{ color: '#F5C800', fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 18 }}>Dopolavoro 47</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{profilo?.nome}</span>
          <button className="btn-logout" onClick={logout} style={{ padding: '6px 12px', fontSize: 12 }}>↩ Esci</button>
        </div>
      </div>

      <aside className="sidebar">
        <div className="sidebar-logo">
          <img src="/logo.png" alt="Dopolavoro 47" style={{ width: 72, height: 72, objectFit: 'contain', marginBottom: 6 }} />
          <h1 style={{ fontSize: 16, color: '#F5C800', lineHeight: 1.1 }}>Dopolavoro 47</h1>
          <span>Gestionale</span>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            <span className="nav-icon">🏠</span>
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/giocatori" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            <span className="nav-icon">👥</span>
            <span>Giocatori</span>
          </NavLink>

          <NavLink to="/calendario" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            <span className="nav-icon">📅</span>
            <span>Calendario</span>
          </NavLink>

          <NavLink to="/shop" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            <span className="nav-icon">🛍️</span>
            <span>Shop</span>
          </NavLink>

          {isCassiere && (
            <NavLink to="/finanze" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
              <span className="nav-icon">💶</span>
              <span>Finanze</span>
            </NavLink>
          )}

          {isAdmin && (
            <NavLink to="/admin" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
              <span className="nav-icon">⚙️</span>
              <span>Amm.</span>
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-utente">
            <strong>{profilo?.nome} {profilo?.cognome}</strong>
            {profilo?.ruolo}
          </div>
          <button className="btn-logout" onClick={logout}>↩ Esci</button>
        </div>
      </aside>
    </>
  )
}