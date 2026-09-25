import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import BottoneNotifiche from './BottoneNotifiche'
import Icona from './Icona'

export default function Sidebar() {
  const { profilo, logout, isAdmin, puoVedereFinanze } = useAuth()

  return (
    <>
      <div className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/logo.png" alt="" style={{ width: 34, height: 34, objectFit: 'contain' }} />
          <span style={{ color: 'var(--oro)', fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 20, whiteSpace: 'nowrap' }}>Dopolavoro 47</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BottoneNotifiche />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{profilo?.nome}</span>
          <button className="btn-logout" onClick={logout} style={{ padding: '6px 12px', fontSize: 12 }}>↩ Esci</button>
        </div>
      </div>

      <aside className="sidebar">
        <div className="sidebar-logo">
          <img src="/logo.png" alt="Dopolavoro 47" style={{ width: 64, height: 64, objectFit: 'contain', marginBottom: 12 }} />
          <h1>Dopolavoro 47</h1>
          <span>Gestionale</span>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            <span className="nav-icon"><Icona nome="dashboard" /></span>
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/giocatori" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            <span className="nav-icon"><Icona nome="giocatori" /></span>
            <span>Giocatori</span>
          </NavLink>

          <NavLink to="/calendario" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            <span className="nav-icon"><Icona nome="calendario" /></span>
            <span>Calendario</span>
          </NavLink>

          <NavLink to="/shop" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            <span className="nav-icon"><Icona nome="shop" /></span>
            <span>Shop</span>
          </NavLink>

          {puoVedereFinanze && (
            <NavLink to="/finanze" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
              <span className="nav-icon"><Icona nome="finanze" /></span>
              <span>Finanze</span>
            </NavLink>
          )}

          {isAdmin && (
            <NavLink to="/admin" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
              <span className="nav-icon"><Icona nome="admin" /></span>
              <span>Admin</span>
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-utente">
            <strong>{profilo?.nome} {profilo?.cognome}</strong>
            {profilo?.ruolo}
          </div>
          <BottoneNotifiche style={{ width: '100%', marginBottom: 8 }} />
          <button className="btn-logout" onClick={logout}>↩ Esci</button>
        </div>
      </aside>
    </>
  )
}