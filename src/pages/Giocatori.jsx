import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { format, parseISO } from 'date-fns'

export default function Giocatori() {
  const { isAdmin, puoModificareGiocatori, profilo: profiloCorrente, ruolo } = useAuth()
  const [giocatori, setGiocatori] = useState([])
  const [loading, setLoading] = useState(true)
  const [mostraModal, setMostraModal] = useState(false)
  const [giocatoreSelezionato, setGiocatoreSelezionato] = useState(null)
  const [filtro, setFiltro] = useState('')

  useEffect(() => { caricaGiocatori() }, [])

  async function caricaGiocatori() {
    const { data } = await supabase
      .from('profili')
      .select('*, certificati_medici(data_scadenza, tipo)')
      .eq('attivo', true)
      .order('cognome')
    setGiocatori(data || [])
    setLoading(false)
  }

  function apriModifica(g) {
    setGiocatoreSelezionato(g)
    setMostraModal(true)
  }

  function apriNuovo() {
    setGiocatoreSelezionato(null)
    setMostraModal(true)
  }

  // Giocatore vede solo sé stesso, gli altri vedono tutti
  const visibili = ruolo === 'giocatore'
    ? giocatori.filter(g => g.id === profiloCorrente?.id)
    : giocatori

  const filtrati = visibili.filter(g =>
    `${g.nome} ${g.cognome} ${g.ruolo_campo || ''}`.toLowerCase().includes(filtro.toLowerCase())
  )

  function certColore(g) {
    const cert = g.certificati_medici?.[0]
    if (!cert) return 'var(--rosso)'
    const giorni = Math.ceil((new Date(cert.data_scadenza) - new Date()) / 86400000)
    if (giorni < 0) return 'var(--rosso)'
    if (giorni <= 30) return 'var(--oro)'
    return 'var(--verde)'
  }

  function certLabel(g) {
    const cert = g.certificati_medici?.[0]
    if (!cert) return 'Mancante'
    const giorni = Math.ceil((new Date(cert.data_scadenza) - new Date()) / 86400000)
    if (giorni < 0) return 'Scaduto'
    if (giorni <= 30) return `Scade in ${giorni}gg`
    return format(parseISO(cert.data_scadenza), 'dd/MM/yy')
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>👥 Giocatori</h2>
          <p>{ruolo === 'giocatore' ? 'Il tuo profilo' : `${visibili.length} giocatori registrati`}</p>
        </div>
        {puoModificareGiocatori && (
          <button className="btn btn-primario" onClick={apriNuovo}>+ Aggiungi giocatore</button>
        )}
      </div>

      {ruolo !== 'giocatore' && (
        <div className="card" style={{ marginBottom: 16, padding: '14px 20px' }}>
          <input
            type="text"
            placeholder="🔍 Cerca per nome, cognome o ruolo..."
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
            style={{ border: 'none', outline: 'none', width: '100%', fontSize: 15 }}
          />
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        <div className="tabella-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Giocatore</th>
                <th>Ruolo</th>
                <th>Data nascita</th>
                <th>Telefono</th>
                <th>Cert. medico</th>
                {puoModificareGiocatori && <th>Azioni</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--grigio)' }}>Caricamento...</td></tr>
              ) : filtrati.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--grigio)' }}>Nessun giocatore trovato.</td></tr>
              ) : filtrati.map(g => (
                <tr key={g.id}>
                  <td style={{ fontWeight: 700, color: 'var(--grigio)', width: 40 }}>
                    {g.numero_maglia ? `#${g.numero_maglia}` : '—'}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{g.cognome} {g.nome}</div>
                    <div style={{ fontSize: 12, color: 'var(--grigio)' }}>{g.email}</div>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--grigio)' }}>{g.ruolo_campo || '—'}</td>
                  <td style={{ fontSize: 13 }}>
                    {g.data_nascita ? format(parseISO(g.data_nascita), 'dd/MM/yyyy') : '—'}
                  </td>
                  <td style={{ fontSize: 13 }}>{g.telefono || '—'}</td>
                  <td>
                    <span style={{ fontSize: 12, fontWeight: 600, color: certColore(g) }}>
                      ● {certLabel(g)}
                    </span>
                  </td>
                  {puoModificareGiocatori && (
                    <td>
                      <button className="btn btn-outline" style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => apriModifica(g)}>
                        Modifica
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {mostraModal && (
        <ModalGiocatore
          giocatore={giocatoreSelezionato}
          onClose={() => setMostraModal(false)}
          onSalva={() => { setMostraModal(false); caricaGiocatori() }}
        />
      )}
    </div>
  )
}

function ModalGiocatore({ giocatore, onClose, onSalva }) {
  const isNuovo = !giocatore
  const [form, setForm] = useState({
    nome: giocatore?.nome || '',
    cognome: giocatore?.cognome || '',
    email: giocatore?.email || '',
    telefono: giocatore?.telefono || '',
    data_nascita: giocatore?.data_nascita || '',
    ruolo_campo: giocatore?.ruolo_campo || '',
    numero_maglia: giocatore?.numero_maglia || '',
    ruolo: giocatore?.ruolo || 'giocatore',
  })
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [errore, setErrore] = useState('')

  async function salva() {
    setSaving(true)
    setErrore('')

    if (isNuovo) {
      const { error } = await supabase.auth.admin?.createUser?.({
        email: form.email, password, email_confirm: true,
        user_metadata: { nome: form.nome, cognome: form.cognome, ruolo: form.ruolo }
      })
      if (error) {
        setErrore('Per creare nuovi utenti usa la sezione Amministrazione. Il giocatore dovrà registrarsi con questa email.')
        setSaving(false)
        return
      }
    } else {
      const { error } = await supabase.from('profili').update({
        nome: form.nome,
        cognome: form.cognome,
        telefono: form.telefono,
        data_nascita: form.data_nascita || null,
        ruolo_campo: form.ruolo_campo,
        numero_maglia: form.numero_maglia ? parseInt(form.numero_maglia) : null,
        ruolo: form.ruolo,
      }).eq('id', giocatore.id)

      if (error) { setErrore(error.message); setSaving(false); return }
    }

    setSaving(false)
    onSalva()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isNuovo ? 'Nuovo giocatore' : `Modifica ${giocatore.nome}`}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {errore && <div className="alert alert-warning">{errore}</div>}

        <div className="form-row">
          <div className="form-group">
            <label>Nome</label>
            <input value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Cognome</label>
            <input value={form.cognome} onChange={e => setForm({...form, cognome: e.target.value})} />
          </div>
        </div>

        <div className="form-group">
          <label>Email</label>
          <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} disabled={!isNuovo} />
        </div>

        {isNuovo && (
          <div className="form-group">
            <label>Password iniziale</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>Data di nascita</label>
            <input type="date" value={form.data_nascita} onChange={e => setForm({...form, data_nascita: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Telefono</label>
            <input value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Ruolo in campo</label>
            <select value={form.ruolo_campo} onChange={e => setForm({...form, ruolo_campo: e.target.value})}>
              <option value="">— Seleziona —</option>
              <option>Portiere</option>
              <option>Difensore</option>
              <option>Centrocampista</option>
              <option>Attaccante</option>
            </select>
          </div>
          <div className="form-group">
            <label>Numero maglia</label>
            <input type="number" value={form.numero_maglia} onChange={e => setForm({...form, numero_maglia: e.target.value})} />
          </div>
        </div>

        <div className="form-group">
          <label>Ruolo nel gestionale</label>
          <select value={form.ruolo} onChange={e => setForm({...form, ruolo: e.target.value})}>
            <option value="giocatore">Giocatore</option>
            <option value="dirigente">Dirigente</option>
            <option value="presidente">Presidente</option>
            <option value="cassiere">Cassiere</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button className="btn btn-outline" onClick={onClose}>Annulla</button>
          <button className="btn btn-primario" onClick={salva} disabled={saving}>
            {saving ? 'Salvataggio...' : 'Salva'}
          </button>
        </div>
      </div>
    </div>
  )
}
