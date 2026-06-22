import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { format, parseISO, isToday, isTomorrow } from 'date-fns'
import { it } from 'date-fns/locale'

export default function Dashboard() {
  const { profilo, isCassiere } = useAuth()
  const [stats, setStats] = useState({ giocatori: 0, eventiMese: 0, saldo: 0, certInScadenza: 0 })
  const [prossimiEventi, setProssimiEventi] = useState([])
  const [compleanni, setCompleanni] = useState([])
  const [certScadenza, setCertScadenza] = useState([])

  useEffect(() => {
    caricaDati()
  }, [])

  async function caricaDati() {
    // Giocatori attivi
    const { count: giocatori } = await supabase
      .from('profili').select('*', { count: 'exact', head: true })
      .eq('attivo', true)

    // Prossimi eventi
    const oggi = new Date().toISOString()
    const { data: eventi } = await supabase
      .from('eventi').select('*')
      .gte('data_inizio', oggi)
      .order('data_inizio', { ascending: true })
      .limit(5)

    // Saldo cassa
    let saldo = 0
    if (isCassiere) {
      const { data: movimenti } = await supabase.from('movimenti').select('tipo, importo')
      if (movimenti) {
        saldo = movimenti.reduce((acc, m) => m.tipo === 'entrata' ? acc + Number(m.importo) : acc - Number(m.importo), 0)
      }
    }

    // Compleanni del mese
    const { data: comp } = await supabase.from('compleanni_mese').select('*')

    // Certificati in scadenza
    const { data: cert } = await supabase.from('certificati_in_scadenza').select('*')

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

  return (
    <div>
      <div className="page-header">
        <h2>Benvenuto, {profilo?.nome}!</h2>
        <p>Riepilogo della squadra Dopolavoro 47</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Giocatori</div>
          <div className="stat-valore">{stats.giocatori}</div>
        </div>
        <div className="stat-card oro">
          <div className="stat-label">Prossimi eventi</div>
          <div className="stat-valore">{stats.eventiMese}</div>
        </div>
        {isCassiere && (
          <div className="stat-card" style={{ borderLeftColor: stats.saldo >= 0 ? 'var(--verde)' : 'var(--rosso)' }}>
            <div className="stat-label">Saldo Cassa</div>
            <div className="stat-valore euro">{stats.saldo.toFixed(2)}</div>
          </div>
        )}
        <div className="stat-card rosso">
          <div className="stat-label">Cert. in scadenza</div>
          <div className="stat-valore">{stats.certInScadenza}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Prossimi eventi */}
        <div className="card">
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
            </div>
          )}
        </div>

        {/* Compleanni */}
        <div className="card">
          <h3 style={{ fontSize: 20, color: 'var(--verde-scuro)', marginBottom: 16 }}>🎂 Compleanni del mese</h3>
          {compleanni.length === 0 ? (
            <p style={{ color: 'var(--grigio)', fontSize: 14 }}>Nessun compleanno questo mese.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {compleanni.map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 500 }}>{c.nome} {c.cognome}</span>
                  <span style={{ fontSize: 13, color: 'var(--grigio)' }}>
                    {c.giorno}/{c.mese} — {c.prossima_eta} anni
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Certificati in scadenza */}
        {certScadenza.length > 0 && (
          <div className="card" style={{ gridColumn: '1 / -1' }}>
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
          </div>
        )}
      </div>
    </div>
  )
}
