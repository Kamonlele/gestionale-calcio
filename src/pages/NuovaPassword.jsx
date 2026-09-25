import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

// Pagina raggiunta dal link nella email di recupero: Supabase apre una sessione temporanea
export default function NuovaPassword() {
  const navigate = useNavigate()
  const [pronto, setPronto] = useState(false)
  const [linkScaduto, setLinkScaduto] = useState(false)
  const [password, setPassword] = useState('')
  const [conferma, setConferma] = useState('')
  const [errore, setErrore] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((evento, session) => {
      if (evento === 'PASSWORD_RECOVERY' || session) setPronto(true)
    })
    supabase.auth.getSession().then(({ data: { session } }) => { if (session) setPronto(true) })
    // Link scaduto o già usato: Supabase lo segnala nell'URL
    if (window.location.hash.includes('error') || window.location.search.includes('error')) setLinkScaduto(true)
    return () => subscription.unsubscribe()
  }, [])

  async function salva(e) {
    e.preventDefault()
    if (password !== conferma) { setErrore('Le due password non coincidono.'); return }
    setLoading(true)
    setErrore('')
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setErrore('Non è stato possibile salvare la password. Richiedi un nuovo link.'); return }
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="login-page">
      <img src="/logo.png" alt="Dopolavoro 47" className="login-logo" />
      <div className="login-card">
        <h1>Nuova password</h1>
        <p className="sottotitolo">Scegli la password per il tuo account</p>

        {linkScaduto ? (
          <>
            <div className="alert alert-danger">Il link è scaduto o è già stato usato.</div>
            <button className="btn btn-primario" style={{ width: '100%' }} onClick={() => navigate('/login')}>
              Richiedi un nuovo link
            </button>
          </>
        ) : !pronto ? (
          <p style={{ color: 'var(--grigio)', fontSize: 14 }}>Verifica del link in corso…</p>
        ) : (
          <form onSubmit={salva}>
            {errore && <div className="alert alert-danger">{errore}</div>}
            <div className="form-group">
              <label>Nuova password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimo 6 caratteri" required minLength={6} autoComplete="new-password" />
            </div>
            <div className="form-group">
              <label>Ripeti password</label>
              <input type="password" value={conferma} onChange={e => setConferma(e.target.value)} required minLength={6} autoComplete="new-password" />
            </div>
            <button type="submit" className="btn btn-primario" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
              {loading ? 'Salvataggio...' : 'Salva e entra'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
