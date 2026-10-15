import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { inviaNotificaManuale } from '../notifiche'

const RUOLI = [['giocatore', 'Giocatori'], ['dirigente', 'Dirigenti'], ['cassiere', 'Tesoriere'], ['presidente', 'Presidente'], ['admin', 'Admin']]
const PAGINE = [['/dashboard', 'Dashboard'], ['/calendario', 'Calendario'], ['/shop', 'Shop'], ['/giocatori', 'Giocatori'], ['/finanze', 'Finanze']]
const VUOTO = { titolo: '', messaggio: '', pagina: '/dashboard', tipo: 'tutti', ruoli: [], ids: [] }

export default function Notifiche() {
  const { puoInviareNotifiche } = useAuth()
  const [form, setForm] = useState(VUOTO)
  const [persone, setPersone] = useState([])
  const [cerca, setCerca] = useState('')
  const [storico, setStorico] = useState([])
  const [stato, setStato] = useState({ invio: false, errore: '', ok: '' })

  useEffect(() => {
    if (!puoInviareNotifiche) return
    supabase.from('profili').select('id, nome, cognome, ruolo').eq('approvato', true).eq('attivo', true).order('cognome')
      .then(({ data }) => setPersone(data || []))
    caricaStorico()
  }, [puoInviareNotifiche])

  async function caricaStorico() {
    const { data } = await supabase.from('notifiche_inviate')
      .select('*, mittente:profili!notifiche_inviate_inviato_da_fkey(nome, cognome)')
      .order('creato_il', { ascending: false }).limit(30)
    setStorico(data || [])
  }

  if (!puoInviareNotifiche) return <Navigate to="/dashboard" replace />

  const set = campo => e => setForm({ ...form, [campo]: e.target.value })
  const alterna = (campo, valore) => setForm({
    ...form, [campo]: form[campo].includes(valore) ? form[campo].filter(v => v !== valore) : [...form[campo], valore]
  })

  // Quante persone dovrebbero riceverla (solo chi ha attivato le notifiche la riceve davvero)
  const quanti = form.tipo === 'tutti' ? persone.length
    : form.tipo === 'ruoli' ? persone.filter(p => form.ruoli.includes(p.ruolo)).length
    : form.ids.length

  async function invia(e) {
    e.preventDefault()
    if (!form.titolo.trim() || !form.messaggio.trim()) return setStato({ errore: 'Scrivi titolo e messaggio.' })
    if (quanti === 0) return setStato({ errore: 'Scegli almeno un destinatario.' })
    if (!confirm(`Inviare la notifica a ${quanti} ${quanti === 1 ? 'persona' : 'persone'}?`)) return
    setStato({ invio: true })
    const esito = await inviaNotificaManuale({
      titolo: form.titolo, messaggio: form.messaggio, pagina: form.pagina,
      destinatari: { tipo: form.tipo, ruoli: form.ruoli, ids: form.ids }
    })
    if (esito?.ok) {
      setStato({ ok: 'Notifica inviata.' })
      setForm(VUOTO)
    } else {
      setStato({ errore: 'Invio non riuscito: probabilmente nessuno dei destinatari ha attivato le notifiche.' })
    }
    caricaStorico()
  }

  const filtrate = persone.filter(p => `${p.nome} ${p.cognome}`.toLowerCase().includes(cerca.toLowerCase()))

  return (
    <div>
      <div className="page-header">
        <h2>📣 Notifiche</h2>
        <p>Scrivi un avviso e mandalo sul telefono della squadra</p>
      </div>

      <form className="card" onSubmit={invia}>
        {stato.errore && <div className="alert alert-danger">{stato.errore}</div>}
        {stato.ok && <div className="alert alert-success">{stato.ok}</div>}

        <div className="form-group">
          <label>Titolo</label>
          <input value={form.titolo} onChange={set('titolo')} maxLength={60} placeholder="Es: Allenamento spostato" />
        </div>
        <div className="form-group">
          <label>Messaggio <span style={{ textTransform: 'none', fontWeight: 400 }}>({form.messaggio.length}/300)</span></label>
          <textarea value={form.messaggio} onChange={set('messaggio')} maxLength={300} rows={3} placeholder="Es: Giovedì ci alleniamo alle 21:00 invece che alle 20:00" />
        </div>
        <div className="form-group">
          <label>Toccandola si apre</label>
          <select value={form.pagina} onChange={set('pagina')}>
            {PAGINE.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>Destinatari</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[['tutti', 'Tutta la squadra'], ['ruoli', 'Per ruolo'], ['giocatori', 'Persone scelte']].map(([v, l]) => (
              <button key={v} type="button" className={`btn ${form.tipo === v ? 'btn-primario' : 'btn-outline'}`}
                onClick={() => setForm({ ...form, tipo: v })}>{l}</button>
            ))}
          </div>
        </div>

        {form.tipo === 'ruoli' && (
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 18 }}>
            {RUOLI.map(([v, l]) => (
              <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.ruoli.includes(v)} onChange={() => alterna('ruoli', v)} /> {l}
              </label>
            ))}
          </div>
        )}

        {form.tipo === 'giocatori' && (
          <div className="form-group">
            <input value={cerca} onChange={e => setCerca(e.target.value)} placeholder="Cerca per nome…" style={{ marginBottom: 8 }} />
            <div style={{ maxHeight: 240, overflowY: 'auto', border: '1px solid var(--linea)', borderRadius: 8, padding: '6px 12px' }}>
              {filtrate.map(p => (
                <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.ids.includes(p.id)} onChange={() => alterna('ids', p.id)} style={{ width: 'auto', minHeight: 0 }} />
                  {p.cognome} {p.nome}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Anteprima come appare sul telefono */}
        {(form.titolo || form.messaggio) && (
          <div style={{ background: 'var(--sfondo)', borderRadius: 14, padding: 12, display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 18 }}>
            <img src="/logo.png" alt="" style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--nero)' }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{form.titolo || 'Titolo'}</div>
              <div style={{ fontSize: 13, color: 'var(--grigio)', overflowWrap: 'anywhere' }}>{form.messaggio || 'Messaggio'}</div>
            </div>
          </div>
        )}

        <button className="btn btn-primario" style={{ width: '100%' }} disabled={stato.invio}>
          {stato.invio ? 'Invio in corso…' : `📣 Invia a ${quanti} ${quanti === 1 ? 'persona' : 'persone'}`}
        </button>
        <p style={{ fontSize: 12, color: 'var(--grigio)', marginTop: 8, textAlign: 'center' }}>
          La ricevono solo quelli che hanno attivato le notifiche nell'app.
        </p>
      </form>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--linea)' }}><h3 style={{ fontSize: 20 }}>Inviate di recente</h3></div>
        <div className="tabella-wrapper">
          <table>
            <thead><tr><th>Data</th><th>Notifica</th><th>Destinatari</th><th>Da</th></tr></thead>
            <tbody>
              {storico.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--grigio)' }}>Nessuna notifica inviata.</td></tr>
              ) : storico.map(n => (
                <tr key={n.id}>
                  <td style={{ fontSize: 13, whiteSpace: 'nowrap' }}>{format(parseISO(n.creato_il), 'dd/MM HH:mm')}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{n.ok === false ? '⚠️ ' : ''}{n.titolo}</div>
                    <div style={{ fontSize: 12, color: 'var(--grigio)' }}>{n.messaggio}</div>
                  </td>
                  <td style={{ fontSize: 13 }}>{n.destinatari}</td>
                  <td style={{ fontSize: 13 }}>{n.mittente?.nome || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
