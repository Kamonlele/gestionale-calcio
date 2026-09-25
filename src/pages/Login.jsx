import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import { notificaNuovaRegistrazione } from '../notifiche'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [modalita, setModalita] = useState('login') // 'login' o 'registrazione'
  const [form, setForm] = useState({ email: '', password: '', nome: '', cognome: '', telefono: '' })
  const [errore, setErrore] = useState('')
  const [successo, setSuccesso] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setErrore('')
    const { error } = await login(form.email, form.password)
    if (error) { setErrore('Email o password non corretti.'); setLoading(false) }
    else navigate('/dashboard')
  }

  async function handleRecupero(e) {
    e.preventDefault()
    setLoading(true)
    setErrore('')
    const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
      redirectTo: `${window.location.origin}/nuova-password`
    })
    setLoading(false)
    if (error) { setErrore('Invio non riuscito. Riprova tra qualche minuto.'); return }
    setSuccesso(`Se ${form.email} è registrata, riceverai una email con il link per scegliere una nuova password.`)
    setModalita('login')
  }

  async function handleRegistrazione(e) {
    e.preventDefault()
    setLoading(true)
    setErrore('')
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { nome: form.nome, cognome: form.cognome, telefono: form.telefono }
      }
    })
    if (error) { setErrore(error.message); setLoading(false); return }

    // Con conferma email attiva non c'è sessione: il telefono resta nei metadati
    if (data.session && form.telefono) {
      await supabase.from('profili').update({ telefono: form.telefono }).eq('id', data.user.id)
    }
    notificaNuovaRegistrazione()
    setSuccesso(data.session
      ? 'Registrazione completata! Ora puoi accedere.'
      : 'Registrazione completata! Controlla la tua email e clicca il link di conferma, poi accedi.')
    setModalita('login')
    setLoading(false)
  }

  return (
    <div className="login-page">
      <img src="/logo.png" alt="Dopolavoro 47" className="login-logo" />
      <div className="login-card">
        <h1>Dopolavoro 47</h1>
        <p className="sottotitolo">Gestionale della squadra</p>

        {/* Toggle login/registrazione */}
        <div style={{ display: 'flex', marginBottom: 24, borderRadius: 10, overflow: 'hidden', border: '1.5px solid var(--grigio-chiaro)' }}>
          {[['login','Accedi'],['registrazione','Registrati']].map(([v, l]) => (
            <button key={v} onClick={() => { setModalita(v); setErrore(''); setSuccesso('') }}
              style={{ flex: 1, padding: '10px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14,
                background: modalita === v ? 'var(--nero)' : 'white',
                color: modalita === v ? 'var(--oro)' : 'var(--grigio)' }}>
              {l}
            </button>
          ))}
        </div>

        {errore && <div className="alert alert-danger">{errore}</div>}
        {successo && <div className="alert alert-success">{successo}</div>}

        {modalita === 'login' ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="la-tua@email.com" required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••••" required />
            </div>
            <button type="submit" className="btn btn-primario" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={loading}>
              {loading ? 'Accesso in corso...' : 'Entra'}
            </button>
            <button type="button" onClick={() => { setModalita('recupero'); setErrore(''); setSuccesso('') }}
              style={{ display: 'block', margin: '14px auto 0', background: 'none', border: 'none', color: 'var(--oro-testo)', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
              Password dimenticata?
            </button>
          </form>
        ) : modalita === 'recupero' ? (
          <form onSubmit={handleRecupero}>
            <p style={{ fontSize: 14, color: 'var(--grigio)', marginBottom: 16 }}>
              Inserisci la tua email: ti mandiamo un link per scegliere una nuova password.
            </p>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="la-tua@email.com" required />
            </div>
            <button type="submit" className="btn btn-primario" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={loading}>
              {loading ? 'Invio in corso...' : 'Invia link'}
            </button>
            <button type="button" onClick={() => { setModalita('login'); setErrore('') }}
              style={{ display: 'block', margin: '14px auto 0', background: 'none', border: 'none', color: 'var(--grigio)', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
              ← Torna all'accesso
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegistrazione}>
            <div className="form-row">
              <div className="form-group">
                <label>Nome</label>
                <input value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Cognome</label>
                <input value={form.cognome} onChange={e => setForm({...form, cognome: e.target.value})} required />
              </div>
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="la-tua@email.com" required />
            </div>
            <div className="form-group">
              <label>Telefono</label>
              <input type="tel" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} placeholder="333 1234567" />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Minimo 6 caratteri" required minLength={6} />
            </div>
            <button type="submit" className="btn btn-primario" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={loading}>
              {loading ? 'Registrazione in corso...' : 'Crea account'}
            </button>
          </form>
        )}

        <p style={{ marginTop: 16, fontSize: 12, color: '#aaa', textAlign: 'center' }}>
          Tutti i nuovi account partono come Giocatore.<br/>Il ruolo può essere modificato dall'amministratore.
        </p>
      </div>
    </div>
  )
}