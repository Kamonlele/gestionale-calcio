import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { format, parseISO, isToday, isTomorrow } from 'date-fns'
import { it } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const { profilo, isCassiere, puoVedereFinanze, ruolo } = useAuth()
  const navigate = useNavigate()
  const isGiocatore = ruolo === 'giocatore'

  const [stats, setStats] = useState({ giocatori: 0, eventiMese: 0, saldo: 0, certInScadenza: 0 })
  const [prossimiEventi, setProssimiEventi] = useState([])
  const [compleanni, setCompleanni] = useState([])
  const [certScadenza, setCertScadenza] = useState([])
  const [mioCert, setMioCert] = useState(null)

  useEffect(() => { caricaDati() }, [])

  async function caricaDati() {
    const { count: giocatori } = await supabase
      .from('profili').select('*', { count: 'exact', head: true })
      .eq('attivo', true)

    const oggi = new Date().toISOString()
    const { data: eventi } = await supabase
      .from('eventi').select('*')
      .gte('data_inizio', oggi)
      .order('data_inizio', { ascending: true })
      .limit(5)

    let saldo = 0
    if (puoVedereFinanze) {
      const { data: movimenti } = await supabase.from('movimenti').select('tipo, importo')
      if (movimenti) {
        saldo = movimenti.reduce((acc, m) => m.tipo === 'entrata' ? acc + Number(m.importo) : acc - Number(m.importo), 0)
      }
    }

    const { data: comp } = await supabase.from('compleanni_mese').select('*')
    const { data: cert } = await supabase.from('certificati_in_scadenza').select('*')

    // Certificato del giocatore corrente
    if (profilo?.id) {
      const { data: mioCertData } = await supabase
        .from('certificati_medici')
        .select('*')
        .eq('giocatore_id', profilo.id)
        .order('data_scadenza', { ascending: false })
        .limit(1)
        .single()
      setMioCert(mioCertData || null)
    }

    setStats({ giocatori: giocatori || 0, eventiMese: eventi?.length || 0, saldo, certInScadenza: cert?.length || 0 })
    setProssimiEventi(eventi || [])
    setCompleanni(comp || [])
    setCertScadenza(cert || [])
  }

  function labelData(dataStr) {
    const d = parseISO(dataStr)
    if (isToday(d)) return 'Oggi'
    if (isTomorrow(d)) return 'Domani'
    return format(d, 'dd MMM', { locale: it })
  }

  function iconaTipo(tipo) {
    const icone = { partita: '⚽', allenamento: '🏃', riunione: '📋', scadenza: '⚠️', altro: '📌' }
    return icone[tipo] || '📌'
  }

  const cardStyle = (color) => ({
    background: 'var(--card)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    padding: 20,
    borderLeft: `4px solid ${color}`,
    cursor: 'pointer',
    transition: 'transform 0.15s, box-shadow 0.15s',
    marginBottom: 0,
  })

  const cardHover = (e) => {
    e.currentTarget.style.transform = 'translateY(-2px)'
    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)'
  }

  const cardLeave = (e) => {
    e.currentTarget.style.transform = 'translateY(0)'
    e.currentTarget.style.boxShadow = 'var(--shadow)'
  }

  // Calcola stato certificato giocatore
  function statoCert() {
    if (!mioCert) return { label: 'Mancante', color: 'var(--rosso)', giorni: null }
    const giorni = Math.ceil((new Date(mioCert.data_scadenza) - new Date()) / 86400000)
    if (giorni < 0) return { label: 'Scaduto', color: 'var(--rosso)', giorni }
    if (giorni <= 30) return { label: `Scade in ${giorni} giorni`, color: 'var(--oro)', giorni }
    return { label: `Valido fino al ${format(parseISO(mioCert.data_scadenza), 'dd/MM/yyyy')}`, color: 'var(--verde)', giorni }
  }

  const cert = statoCert()

  return (
    <div>
      <div className="page-header">
        <h2>Benvenuto, {profilo?.nome}!</h2>
        <p>{isGiocatore ? 'La tua area personale' : 'Riepilogo della squadra Dopolavoro 47'}</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">

        {/* BOX 1 — Giocatore vede sé stesso, altri vedono la rosa */}
        {isGiocatore ? (
          <div style={cardStyle('var(--verde)')} onClick={() => navigate('/giocatori')} onMouseEnter={cardHover} onMouseLeave={cardLeave}>
            <div className="stat-label">👤 Il tuo profilo</div>
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: 22, fontWeight: 700, lineHeight: 1.2, marginTop: 4 }}>
              {profilo?.nome} {profilo?.cognome}
            </div>
            <div style={{ fontSize: 12, color: 'var(--grigio)', marginTop: 6 }}>
              {profilo?.ruolo_campo || 'Ruolo non impostato'} {profilo?.numero_maglia ? `· #${profilo.numero_maglia}` : ''}
            </div>
            <div style={{ fontSize: 11, color: 'var(--grigio)', marginTop: 6 }}>Vedi profilo →</div>
          </div>
        ) : (
          <div style={cardStyle('var(--verde)')} onClick={() => navigate('/giocatori')} onMouseEnter={cardHover} onMouseLeave={cardLeave}>
            <div className="stat-label">👥 Giocatori</div>
            <div className="stat-valore">{stats.giocatori}</div>
            <div style={{ fontSize: 11, color: 'var(--grigio)', marginTop: 6 }}>Vedi rosa →</div>
          </div>
        )}

        {/* BOX 2 — Prossimi eventi (uguale per tutti) */}
        <div style={cardStyle('var(--oro)')} onClick={() => navigate('/calendario')} onMouseEnter={cardHover} onMouseLeave={cardLeave}>
          <div className="stat-label">📅 Prossimi eventi</div>
          <div className="stat-valore">{stats.eventiMese}</div>
          <div style={{ fontSize: 11, color: 'var(--grigio)', marginTop: 6 }}>Vai al calendario →</div>
        </div>

        {/* BOX 3 — Saldo cassa (solo chi può vedere finanze) o certificato giocatore */}
        {puoVedereFinanze ? (
          <div style={cardStyle(stats.saldo >= 0 ? 'var(--verde)' : 'var(--rosso)')} onClick={() => navigate('/finanze')} onMouseEnter={cardHover} onMouseLeave={cardLeave}>
            <div className="stat-label">💶 Saldo Cassa</div>
            <div className="stat-valore euro" style={{ color: stats.saldo >= 0 ? 'var(--verde)' : 'var(--rosso)' }}>
              {stats.saldo.toFixed(2)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--grigio)', marginTop: 6 }}>Vai alle finanze →</div>
          </div>
        ) : isGiocatore ? (
          <div style={cardStyle(cert.color)} onClick={() => navigate('/giocatori')} onMouseEnter={cardHover} onMouseLeave={cardLeave}>
            <div className="stat-label">📋 Certificato medico</div>
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: 20, fontWeight: 700, color: cert.color, marginTop: 4 }}>
              {mioCert ? (cert.giorni < 0 ? '⚠️ Scaduto' : cert.giorni <= 30 ? '⚠️ In scadenza' : '✓ Valido') : '⚠️ Mancante'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--grigio)', marginTop: 6 }}>{cert.label}</div>
          </div>
        ) : null}

        {/* BOX 4 — Cert. scadenza (admin/dirigente) o niente per giocatore */}
        {!isGiocatore && (
          <div style={cardStyle('var(--rosso)')} onClick={() => navigate('/giocatori')} onMouseEnter={cardHover} onMouseLeave={cardLeave}>
            <div className="stat-label">⚠️ Cert. in scadenza</div>
            <div className="stat-valore" style={{ color: stats.certInScadenza > 0 ? 'var(--rosso)' : 'var(--testo)' }}>
              {stats.certInScadenza}
            </div>
            <div style={{ fontSize: 11, color: 'var(--grigio)', marginTop: 6 }}>Vedi giocatori →</div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="dashboard-grid">

        {/* Prossimi eventi */}
        <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/calendario')}>
          <h3 style={{ fontSize: 20, color: 'var(--verde-scuro)', marginBottom: 16 }}>📅 Prossimi eventi</h3>
          {prossimiEventi.length === 0 ? (
            <p style={{ color: 'var(--grigio)', fontSize: 14 }}>Nessun evento in programma.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {prossimiEventi.map(e => (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 22 }}>{iconaTipo(e.tipo)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{e.titolo}</div>
                    <div style={{ fontSize: 12, color: 'var(--grigio)' }}>
                      {labelData(e.data_inizio)} — {e.luogo || 'Luogo da definire'}
                    </div>
                  </div>
                  <span className={`cal-evento ${e.tipo}`} style={{ fontSize: 11 }}>{e.tipo}</span>
                </div>
              ))}
              <div style={{ fontSize: 12, color: 'var(--verde)', fontWeight: 600, marginTop: 4 }}>
                Vedi tutto il calendario →
              </div>
            </div>
          )}
        </div>

        {/* Compleanni — tutti vedono la rosa */}
        <div className="card">
          <h3 style={{ fontSize: 20, color: 'var(--verde-scuro)', marginBottom: 16 }}>🎂 Compleanni del mese</h3>
          {compleanni.length === 0 ? (
            <p style={{ color: 'var(--grigio)', fontSize: 14 }}>Nessun compleanno questo mese.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {compleanni.map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--grigio-chiaro)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>🎂</span>
                    <span style={{ fontWeight: 500 }}>
                      {c.nome} {c.cognome}
                      {c.id === profilo?.id && <span style={{ fontSize: 11, color: 'var(--verde)', fontWeight: 700, marginLeft: 6 }}>sei tu! 🎉</span>}
                    </span>
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--grigio)', fontWeight: 600 }}>
                    {c.giorno}/{c.mese} — {c.prossima_eta} anni
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Certificati in scadenza */}
        {isGiocatore ? (
          // Giocatore vede solo il suo
          mioCert && cert.giorni !== null && cert.giorni <= 30 && (
            <div className="card" style={{ gridColumn: '1 / -1', borderLeft: `4px solid ${cert.color}` }}>
              <h3 style={{ fontSize: 20, color: cert.color, marginBottom: 12 }}>⚠️ Il tuo certificato medico</h3>
              <p style={{ fontSize: 15 }}>
                Il tuo certificato medico <strong>{cert.giorni < 0 ? 'è scaduto' : `scade tra ${cert.giorni} giorni`}</strong> ({format(parseISO(mioCert.data_scadenza), 'dd/MM/yyyy')}).
              </p>
              <p style={{ fontSize: 13, color: 'var(--grigio)', marginTop: 8 }}>Contatta il tuo dirigente per rinnovarlo.</p>
            </div>
          )
        ) : (
          // Admin/dirigente vede tutti
          certScadenza.length > 0 && (
            <div className="card" style={{ gridColumn: '1 / -1', cursor: 'pointer' }} onClick={() => navigate('/admin')}>
              <h3 style={{ fontSize: 20, color: 'var(--rosso)', marginBottom: 16 }}>⚠️ Certificati medici in scadenza</h3>
              <div className="tabella-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Giocatore</th>
                      <th>Tipo</th>
                      <th>Scadenza</th>
                      <th>Giorni rimasti</th>
                    </tr>
                  </thead>
                  <tbody>
                    {certScadenza.map((c, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 500 }}>{c.nome} {c.cognome}</td>
                        <td>{c.tipo}</td>
                        <td>{format(parseISO(c.data_scadenza), 'dd/MM/yyyy')}</td>
                        <td>
                          <span style={{ color: c.giorni_alla_scadenza <= 7 ? 'var(--rosso)' : 'var(--oro)', fontWeight: 600 }}>
                            {c.giorni_alla_scadenza} giorni
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ fontSize: 12, color: 'var(--rosso)', fontWeight: 600, marginTop: 12 }}>
                Gestisci certificati in Amministrazione →
              </div>
            </div>
          )
        )}
      </div>
    </div>
  )
}
