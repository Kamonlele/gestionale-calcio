import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { format, parseISO } from 'date-fns'

export default function Admin() {
  const { isAdmin } = useAuth()
  const [utenti, setUtenti] = useState([])
  const [loading, setLoading] = useState(true)
  const [mostraModalCert, setMostraModalCert] = useState(false)
  const [giocatoreSelezionato, setGiocatoreSelezionato] = useState(null)

  useEffect(() => { caricaUtenti() }, [])

  async function caricaUtenti() {
    const { data } = await supabase
      .from('profili') 
      .select('*, certificati_medici(*)')
      .order('cognome')
    setUtenti(data || [])
    setLoading(false)
  }

  async function cambiaRuolo(id, ruolo) {
    await supabase.from('profili').update({ ruolo }).eq('id', id)
    caricaUtenti()
  }

  async function toggleAttivo(id, attivo) {
    await supabase.from('profili').update({ attivo: !attivo }).eq('id', id)
    caricaUtenti()
  }

  async function approvaUtente(id) {
    await supabase.from('profili').update({ approvato: true }).eq('id', id)
    caricaUtenti()
  }

  if (!isAdmin) return (
    <div className="page-header">
      <h2>⛔ Accesso negato</h2>
      <p>Solo gli amministratori possono accedere a questa sezione.</p>
    </div>
  )

  const inAttesa = utenti.filter(u => !u.approvato)

  return (
    <div>
      <div className="page-header">
        <h2>⚙️ Amministrazione</h2>
        <p>Gestione utenti e certificati medici</p>
      </div>

      {/* Stats */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[
            ['Totale utenti', utenti.length, 'var(--verde)'],
            ['Approvati', utenti.filter(u => u.approvato).length, 'var(--verde)'],
            ['In attesa', inAttesa.length, 'var(--oro)'],
            ['Admin', utenti.filter(u => u.ruolo === 'admin').length, '#0c5460'],
          ].map(([label, val, color]) => (
            <div key={label} style={{ flex: 1, minWidth: 120, textAlign: 'center', padding: '16px 8px', background: 'var(--sfondo)', borderRadius: 8 }}>
              <div style={{ fontFamily: 'Barlow Condensed', fontSize: 32, fontWeight: 700, color }}>{val}</div>
              <div style={{ fontSize: 12, color: 'var(--grigio)', fontWeight: 600, textTransform: 'uppercase' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sezione in attesa di approvazione */}
      {inAttesa.length > 0 && (
        <div className="card" style={{ marginBottom: 20, borderLeft: '4px solid var(--oro)' }}>
          <h3 style={{ fontSize: 20, color: 'var(--oro)', marginBottom: 16 }}>
            ⏳ In attesa di approvazione ({inAttesa.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {inAttesa.map(u => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--sfondo)', borderRadius: 8 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{u.nome} {u.cognome}</div>
                  <div style={{ fontSize: 12, color: 'var(--grigio)' }}>{u.email}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-primario"
                    style={{ padding: '6px 16px', fontSize: 13, background: 'var(--oro)' }}
                    onClick={() => approvaUtente(u.id)}
                  >
                    ✓ Approva
                  </button>
                  <button
                    className="btn btn-outline"
                    style={{ padding: '6px 12px', fontSize: 13, color: 'var(--rosso)' }}
                    onClick={() => toggleAttivo(u.id, true)}
                  >
                    ✗ Rifiuta
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabella tutti gli utenti */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--grigio-chiaro)' }}>
          <h3 style={{ fontSize: 20, color: 'var(--verde-scuro)' }}>Tutti gli utenti</h3>
        </div>
        <div className="tabella-wrapper">
          <table>
            <thead>
              <tr>
                <th>Utente</th>
                <th>Ruolo</th>
                <th>Certificato medico</th>
                <th>Stato</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32 }}>Caricamento...</td></tr>
              ) : utenti.filter(u => u.approvato).map(u => {
                const ultimoCert = u.certificati_medici?.sort((a, b) => new Date(b.data_scadenza) - new Date(a.data_scadenza))[0]
                const certScaduto = ultimoCert && new Date(ultimoCert.data_scadenza) < new Date()
                return (
                  <tr key={u.id} style={{ opacity: u.attivo ? 1 : 0.5 }}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{u.cognome} {u.nome}</div>
                      <div style={{ fontSize: 12, color: 'var(--grigio)' }}>{u.email}</div>
                    </td>
                    <td>
                      <select
                        value={u.ruolo}
                        onChange={e => cambiaRuolo(u.id, e.target.value)}
                        style={{ border: 'none', background: 'transparent', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
                      >
                        <option value="giocatore">giocatore</option>
                        <option value="dirigente">dirigente</option>
                        <option value="cassiere">cassiere</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td>
                      {ultimoCert ? (
                        <span style={{ fontSize: 12, fontWeight: 600, color: certScaduto ? 'var(--rosso)' : 'var(--verde)' }}>
                          {certScaduto ? '⚠️ Scaduto' : '✓ Valido'} — {format(parseISO(ultimoCert.data_scadenza), 'dd/MM/yyyy')}
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--rosso)', fontWeight: 600 }}>⚠️ Mancante</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: 12, fontWeight: 600, color: u.attivo ? 'var(--verde)' : 'var(--grigio)' }}>
                        {u.attivo ? '● Attivo' : '○ Inattivo'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn btn-outline"
                          style={{ padding: '4px 10px', fontSize: 11 }}
                          onClick={() => { setGiocatoreSelezionato(u); setMostraModalCert(true) }}
                        >
                          + Certificato
                        </button>
                        <button
                          className="btn btn-outline"
                          style={{ padding: '4px 10px', fontSize: 11, color: u.attivo ? 'var(--rosso)' : 'var(--verde)' }}
                          onClick={() => toggleAttivo(u.id, u.attivo)}
                        >
                          {u.attivo ? 'Disattiva' : 'Attiva'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {mostraModalCert && giocatoreSelezionato && (
        <ModalCertificato
          giocatore={giocatoreSelezionato}
          onClose={() => setMostraModalCert(false)}
          onSalva={() => { setMostraModalCert(false); caricaUtenti() }}
        />
      )}
    </div>
  )
}

function ModalCertificato({ giocatore, onClose, onSalva }) {
  const [form, setForm] = useState({
    data_rilascio: '',
    data_scadenza: '',
    tipo: 'agonistico',
    note: '',
  })
  const [saving, setSaving] = useState(false)

  async function salva() {
    setSaving(true)
    await supabase.from('certificati_medici').insert({
      ...form,
      giocatore_id: giocatore.id,
    })
    setSaving(false)
    onSalva()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Certificato medico — {giocatore.nome} {giocatore.cognome}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Data rilascio</label>
            <input type="date" value={form.data_rilascio} onChange={e => setForm({...form, data_rilascio: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Data scadenza</label>
            <input type="date" value={form.data_scadenza} onChange={e => setForm({...form, data_scadenza: e.target.value})} />
          </div>
        </div>

        <div className="form-group">
          <label>Tipo</label>
          <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})}>
            <option value="agonistico">Agonistico</option>
            <option value="non_agonistico">Non agonistico</option>
          </select>
        </div>

        <div className="form-group">
          <label>Note</label>
          <textarea value={form.note} onChange={e => setForm({...form, note: e.target.value})} rows={2} />
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-outline" onClick={onClose}>Annulla</button>
          <button className="btn btn-primario" onClick={salva} disabled={saving}>
            {saving ? 'Salvataggio...' : 'Salva certificato'}
          </button>
        </div>
      </div>
    </div>
  )
}
