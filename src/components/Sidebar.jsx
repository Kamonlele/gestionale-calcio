import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Sidebar() {
  const { profilo, logout, isAdmin, isCassiere, isDirigente } = useAuth()

  return (
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
            <span>Amministrazione</span>
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
  )
}