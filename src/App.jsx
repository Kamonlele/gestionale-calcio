import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Giocatori from './pages/Giocatori'
import Calendario from './pages/Calendario'
import Finanze from './pages/Finanze'
import Admin from './pages/Admin'
import Shop from './pages/Shop'

function InAttesa() {
  const { logout, profilo } = useAuth()
  return (
    <div className="login-page">
      <div className="login-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>Account in attesa</h1>
        <p style={{ color: 'var(--grigio)', marginBottom: 24 }}>
          Ciao <strong>{profilo?.nome}</strong>! La tua registrazione è stata ricevuta.<br/>
          L'amministratore deve ancora approvarti. Riprova più tardi.
        </p>
        <button className="btn btn-outline" onClick={logout} style={{ width: '100%', justifyContent: 'center' }}>
          ↩ Esci
        </button>
      </div>
    </div>
  )
}

function AppLayout() {
  const { utente, profilo, loading, approvato } = useAuth()

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--verde-scuro)', color: 'white', fontFamily: 'Barlow Condensed', fontSize: 28 }}>
      Dopolavoro 47...
    </div>
  )

  if (!utente) return <Navigate to="/login" replace />
  if (!approvato) return <InAttesa />

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/giocatori" element={<Giocatori />} />
          <Route path="/calendario" element={<Calendario />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/finanze" element={<Finanze />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<AppLayout />} />
      </Routes>
    </AuthProvider>
  )
}