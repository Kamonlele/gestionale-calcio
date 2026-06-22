import { inviaNotifica } from '../notifiche'
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameMonth, isToday, parseISO, isSameDay
} from 'date-fns'
import { it } from 'date-fns/locale'

const GIORNI = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

export default function Calendario() {
  const { puoModificareCalendario } = useAuth()
  const [meseCorrente, setMeseCorrente] = useState(new Date())
  const [eventi, setEventi] = useState([])
  const [eventoSelezionato, setEventoSelezionato] = useState(null)
  const [mostraModal, setMostraModal] = useState(false)
  const [nuovoEvento, setNuovoEvento] = useState(false)

  useEffect(() => { caricaEventi() }, [meseCorrente])

  async function caricaEventi() {
    const inizio = startOfMonth(meseCorrente).toISOString()
    const fine = endOfMonth(meseCorrente).toISOString()
    const { data } = await supabase
      .from('eventi').select('*')
      .gte('data_inizio', inizio).lte('data_inizio', fine)
      .order('data_inizio')
    setEventi(data || [])
  }

  function eventiDelGiorno(giorno) {
    return eventi.filter(e => isSameDay(parseISO(e.data_inizio), giorno))
  }

  function generaGiorni() {
    const start = startOfWeek(startOfMonth(meseCorrente), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(meseCorrente), { weekStartsOn: 1 })
    const giorni = []
    let current = start
    while (current <= end) {
      giorni.push(current)
      current = addDays(current, 1)
    }
    return giorni
  }

  function apriEvento(e) {
    setEventoSelezionato(e)
    setNuovoEvento(false)
    setMostraModal(true)
  }

  function apriNuovo() {
    setEventoSelezionato(null)
    setNuovoEvento(true)
    setMostraModal(true)
  }

  const giorni = generaGiorni()

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>📅 Calendario</h2>
          <p>Partite, allenamenti e scadenze</p>
        </div>
        {puoModificareCalendario && (
          <button className="btn btn-primario" onClick={apriNuovo}>+ Aggiungi evento</button>
        )}
      </div>

      <div className="card" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button className="btn btn-outline" onClick={() => setMeseCorrente(subMonths(meseCorrente, 1))}>←</button>
        <h3 style={{ fontSize: 24, color: 'var(--verde-scuro)', textTransform: 'capitalize' }}>
          {format(meseCorrente, 'MMMM yyyy', { locale: it })}
        </h3>
        <button className="btn btn-outline" onClick={() => setMeseCorrente(addMonths(meseCorrente, 1))}>→</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        {[['partita','⚽ Partita'],['allenamento','🏃 Allenamento'],['riunione','📋 Riunione'],['scadenza','⚠️ Scadenza']].map(([t, l]) => (
          <span key={t} className={`cal-evento ${t}`} style={{ padding: '4px 10px', borderRadius: 6 }}>{l}</span>
        ))}
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div className="calendario-grid">
          {GIORNI.map(g => (
            <div key={g} className="cal-header-giorno">{g}</div>
          ))}
          {giorni.map((giorno, i) => {
            const evGiorno = eventiDelGiorno(giorno)
            return (
              <div
                key={i}
                className={`cal-giorno ${isToday(giorno) ? 'oggi' : ''} ${!isSameMonth(giorno, meseCorrente) ? 'altro-mese' : ''}`}
              >
                <div className="cal-numero" style={{ color: isToday(giorno) ? 'var(--verde)' : undefined }}>
                  {format(giorno, 'd')}
                </div>
                {evGiorno.slice(0, 3).map(e => (
                  <div
                    key={e.id}
                    className={`cal-evento ${e.tipo}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => apriEvento(e)}
                    title={e.titolo}
                  >
                    {e.titolo}
                  </div>
                ))}
                {evGiorno.length > 3 && (
                  <div style={{ fontSize: 10, color: 'var(--grigio)', marginTop: 2 }}>+{evGiorno.length - 3} altri</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ fontSize: 20, color: 'var(--verde-scuro)', marginBottom: 16 }}>
          Tutti gli eventi — {format(meseCorrente, 'MMMM', { locale: it })}
        </h3>
        {eventi.length === 0 ? (
          <p style={{ color: 'var(--grigio)', fontSize: 14 }}>Nessun evento questo mese.</p>
        ) : (
          <div className="tabella-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Evento</th>
                  <th>Tipo</th>
                  <th>Luogo</th>
                  {puoModificareCalendario && <th>Azioni</th>}
                </tr>
              </thead>
              <tbody>
                {eventi.map(e => (
                  <tr key={e.id}>
                    <td style={{ fontWeight: 600, width: 100 }}>
                      {format(parseISO(e.data_inizio), 'dd/MM HH:mm')}
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{e.titolo}</div>
                      {e.avversario && <div style={{ fontSize: 12, color: 'var(--grigio)' }}>vs {e.avversario} ({e.casa_trasferta})</div>}
                      {e.risultato && <div style={{ fontSize: 12, color: 'var(--verde)', fontWeight: 600 }}>Risultato: {e.risultato}</div>}
                    </td>
                    <td><span className={`cal-evento ${e.tipo}`}>{e.tipo}</span></td>
                    <td style={{ fontSize: 13 }}>{e.luogo || '—'}</td>
                    {puoModificareCalendario && (
                      <td>
                        <button className="btn btn-outline" style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => apriEvento(e)}>
                          Dettagli
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {mostraModal && (
        <ModalEvento
          evento={eventoSelezionato}
          isNuovo={nuovoEvento}
          onClose={() => setMostraModal(false)}
          onSalva={() => { setMostraModal(false); caricaEventi() }}
        />
      )}
    </div>
  )
}

function ModalEvento({ evento, isNuovo, onClose, onSalva }) {
  const { puoModificareCalendario, profilo } = useAuth()
  const [form, setForm] = useState({
    titolo: evento?.titolo || '',
    tipo: evento?.tipo || 'allenamento',
    data_inizio: evento?.data_inizio ? format(parseISO(evento.data_inizio), "yyyy-MM-dd'T'HH:mm") : '',
    luogo: evento?.luogo || '',
    descrizione: evento?.descrizione || '',
    avversario: evento?.avversario || '',
    casa_trasferta: evento?.casa_trasferta || 'casa',
    risultato: evento?.risultato || '',
  })
  const [saving, setSaving] = useState(false)

  async function salva() {
    setSaving(true)
    const payload = { ...form, creato_da: profilo.id }
    if (isNuovo) {
      await supabase.from('eventi').insert(payload)
      await inviaNotifica({
        titolo: `📅 Nuovo evento: ${form.titolo}`,
        messaggio: `${form.data_inizio ? format(parseISO(form.data_inizio), 'dd/MM HH:mm') : ''} ${form.luogo ? '· ' + form.luogo : ''}`,
        url: '/calendario'
      })
    } else {
      await supabase.from('eventi').update(payload).eq('id', evento.id)
    }
    setSaving(false)
    onSalva()
  }

  async function elimina() {
    if (!confirm('Eliminare questo evento?')) return
    await supabase.from('eventi').delete().eq('id', evento.id)
    onSalva()
  }

  const isPartita = form.tipo === 'partita'

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isNuovo ? 'Nuovo evento' : evento.titolo}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="form-group">
          <label>Titolo</label>
          <input value={form.titolo} onChange={e => setForm({...form, titolo: e.target.value})} disabled={!puoModificareCalendario} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Tipo</label>
            <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})} disabled={!puoModificareCalendario}>
              <option value="allenamento">Allenamento</option>
              <option value="partita">Partita</option>
              <option value="riunione">Riunione</option>
              <option value="scadenza">Scadenza</option>
              <option value="altro">Altro</option>
            </select>
          </div>
          <div className="form-group">
            <label>Data e ora</label>
            <input type="datetime-local" value={form.data_inizio} onChange={e => setForm({...form, data_inizio: e.target.value})} disabled={!puoModificareCalendario} />
          </div>
        </div>

        <div className="form-group">
          <label>Luogo</label>
          <input value={form.luogo} onChange={e => setForm({...form, luogo: e.target.value})} placeholder="Es: Campo sportivo comunale" disabled={!puoModificareCalendario} />
        </div>

        {isPartita && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>Avversario</label>
                <input value={form.avversario} onChange={e => setForm({...form, avversario: e.target.value})} disabled={!puoModificareCalendario} />
              </div>
              <div className="form-group">
                <label>Casa / Trasferta</label>
                <select value={form.casa_trasferta} onChange={e => setForm({...form, casa_trasferta: e.target.value})} disabled={!puoModificareCalendario}>
                  <option value="casa">Casa</option>
                  <option value="trasferta">Trasferta</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Risultato</label>
              <input value={form.risultato} onChange={e => setForm({...form, risultato: e.target.value})} placeholder="Es: 2-1" disabled={!puoModificareCalendario} />
            </div>
          </>
        )}

        <div className="form-group">
          <label>Note</label>
          <textarea value={form.descrizione} onChange={e => setForm({...form, descrizione: e.target.value})} rows={3} disabled={!puoModificareCalendario} />
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', marginTop: 8 }}>
          <div>
            {!isNuovo && puoModificareCalendario && (
              <button className="btn btn-danger" onClick={elimina}>Elimina</button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline" onClick={onClose}>Chiudi</button>
            {puoModificareCalendario && (
              <button className="btn btn-primario" onClick={salva} disabled={saving}>
                {saving ? 'Salvataggio...' : 'Salva'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
