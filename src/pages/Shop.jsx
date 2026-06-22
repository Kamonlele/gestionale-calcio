import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { format, parseISO } from 'date-fns'

export default function Shop() {
  const { profilo, isAdmin } = useAuth()
  const [prodotti, setProdotti] = useState([])
  const [ordini, setOrdini] = useState([])
  const [vista, setVista] = useState('shop') // 'shop' | 'ordini'
  const [mostraModalProdotto, setMostraModalProdotto] = useState(false)
  const [mostraModalOrdine, setMostraModalOrdine] = useState(false)
  const [prodottoSelezionato, setProdottoSelezionato] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { caricaDati() }, [])

  async function caricaDati() {
    const [{ data: prod }, { data: ord }] = await Promise.all([
      supabase.from('prodotti').select('*').eq('disponibile', true).order('creato_il', { ascending: false }),
      supabase.from('ordini').select('*, prodotti(nome, prezzo), profili!ordini_giocatore_id_fkey(nome, cognome)').order('creato_il', { ascending: false })
    ])
    setProdotti(prod || [])
    setOrdini(ord || [])
    setLoading(false)
  }

  function apriOrdine(prodotto) {
    setProdottoSelezionato(prodotto)
    setMostraModalOrdine(true)
  }

  const ordiniPersonali = ordini.filter(o => o.giocatore_id === profilo?.id)
  const tuttiOrdini = ordini

  function statoColore(stato) {
    const colori = {
      in_attesa: { bg: '#fff3cd', color: '#856404' },
      confermato: { bg: '#d1ecf1', color: '#0c5460' },
      consegnato: { bg: '#d4edda', color: '#155724' },
      annullato: { bg: '#f8d7da', color: '#721c24' },
    }
    return colori[stato] || colori.in_attesa
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>🛍️ Shop</h2>
          <p>Prodotti e merchandise Dopolavoro 47</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primario" onClick={() => { setProdottoSelezionato(null); setMostraModalProdotto(true) }}>
            + Aggiungi prodotto
          </button>
        )}
      </div>

      {/* Toggle shop / ordini */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderRadius: 10, overflow: 'hidden', border: '1.5px solid var(--grigio-chiaro)', width: 'fit-content' }}>
        {[['shop', '🛍️ Prodotti'], ['ordini', `📦 ${isAdmin ? 'Tutti gli ordini' : 'I miei ordini'}`]].map(([v, l]) => (
          <button key={v} onClick={() => setVista(v)}
            style={{ padding: '10px 24px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14,
              background: vista === v ? 'var(--verde-scuro)' : 'white',
              color: vista === v ? 'white' : 'var(--grigio)' }}>
            {l}
          </button>
        ))}
      </div>

      {/* Vista prodotti */}
      {vista === 'shop' && (
        <>
          {loading ? (
            <p style={{ color: 'var(--grigio)' }}>Caricamento...</p>
          ) : prodotti.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 48 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🛍️</div>
              <p style={{ color: 'var(--grigio)' }}>Nessun prodotto disponibile al momento.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
              {prodotti.map(p => (
                <div key={p.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  {/* Foto prodotto */}
                  <div style={{ height: 200, background: 'var(--sfondo)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {p.foto_url ? (
                      <img src={p.foto_url} alt={p.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: 64 }}>👕</span>
                    )}
                  </div>
                  <div style={{ padding: 20 }}>
                    <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>{p.nome}</div>
                    {p.descrizione && <div style={{ fontSize: 13, color: 'var(--grigio)', marginBottom: 8 }}>{p.descrizione}</div>}
                    {p.taglie?.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                        {p.taglie.map(t => (
                          <span key={t} style={{ fontSize: 11, padding: '3px 8px', border: '1px solid var(--grigio-chiaro)', borderRadius: 4, fontWeight: 600 }}>{t}</span>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                      <span style={{ fontFamily: 'Barlow Condensed', fontSize: 28, fontWeight: 700, color: 'var(--verde)' }}>
                        €{Number(p.prezzo).toFixed(2)}
                      </span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {isAdmin && (
                          <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: 12 }}
                            onClick={() => { setProdottoSelezionato(p); setMostraModalProdotto(true) }}>
                            Modifica
                          </button>
                        )}
                        <button className="btn btn-primario" style={{ padding: '6px 16px', fontSize: 13 }}
                          onClick={() => apriOrdine(p)}>
                          Ordina
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Vista ordini */}
      {vista === 'ordini' && (
        <div className="card" style={{ padding: 0 }}>
          <div className="tabella-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  {isAdmin && <th>Giocatore</th>}
                  <th>Prodotto</th>
                  <th>Taglia</th>
                  <th>Qtà</th>
                  <th>Totale</th>
                  <th>Stato</th>
                  {isAdmin && <th>Azioni</th>}
                </tr>
              </thead>
              <tbody>
                {(isAdmin ? tuttiOrdini : ordiniPersonali).length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--grigio)' }}>Nessun ordine trovato.</td></tr>
                ) : (isAdmin ? tuttiOrdini : ordiniPersonali).map(o => {
                  const c = statoColore(o.stato)
                  return (
                    <tr key={o.id}>
                      <td style={{ fontSize: 13 }}>{format(parseISO(o.creato_il), 'dd/MM/yyyy')}</td>
                      {isAdmin && <td style={{ fontWeight: 500 }}>{o.profili?.nome} {o.profili?.cognome}</td>}
                      <td style={{ fontWeight: 500 }}>{o.prodotti?.nome}</td>
                      <td style={{ fontSize: 13 }}>{o.taglia || '—'}</td>
                      <td style={{ fontSize: 13 }}>{o.quantita}</td>
                      <td style={{ fontWeight: 700, fontFamily: 'Barlow Condensed', fontSize: 18 }}>
                        €{(Number(o.prodotti?.prezzo) * o.quantita).toFixed(2)}
                      </td>
                      <td>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: c.bg, color: c.color }}>
                          {o.stato.replace('_', ' ')}
                        </span>
                      </td>
                      {isAdmin && (
                        <td>
                          <select
                            value={o.stato}
                            onChange={e => cambiaStato(o.id, e.target.value)}
                            style={{ border: 'none', background: 'transparent', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
                          >
                            <option value="in_attesa">In attesa</option>
                            <option value="confermato">Confermato</option>
                            <option value="consegnato">Consegnato</option>
                            <option value="annullato">Annullato</option>
                          </select>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {mostraModalProdotto && (
        <ModalProdotto
          prodotto={prodottoSelezionato}
          profilo={profilo}
          onClose={() => setMostraModalProdotto(false)}
          onSalva={() => { setMostraModalProdotto(false); caricaDati() }}
        />
      )}

      {mostraModalOrdine && prodottoSelezionato && (
        <ModalOrdine
          prodotto={prodottoSelezionato}
          profilo={profilo}
          onClose={() => setMostraModalOrdine(false)}
          onSalva={() => { setMostraModalOrdine(false); caricaDati(); setVista('ordini') }}
        />
      )}
    </div>
  )

  async function cambiaStato(id, stato) {
    await supabase.from('ordini').update({ stato }).eq('id', id)
    caricaDati()
  }
}

// ─── Modal Prodotto ──────────────────────────────────────────────────────────

function ModalProdotto({ prodotto, profilo, onClose, onSalva }) {
  const isNuovo = !prodotto
  const TAGLIE_DEFAULT = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
  const [form, setForm] = useState({
    nome: prodotto?.nome || '',
    descrizione: prodotto?.descrizione || '',
    prezzo: prodotto?.prezzo || '',
    foto_url: prodotto?.foto_url || '',
    taglie: prodotto?.taglie || [],
    disponibile: prodotto?.disponibile ?? true,
  })
  const [saving, setSaving] = useState(false)

  function toggleTaglia(t) {
    setForm(f => ({
      ...f,
      taglie: f.taglie.includes(t) ? f.taglie.filter(x => x !== t) : [...f.taglie, t]
    }))
  }

  async function salva() {
    setSaving(true)
    const payload = { ...form, prezzo: parseFloat(form.prezzo), creato_da: profilo.id }
    if (isNuovo) {
      await supabase.from('prodotti').insert(payload)
    } else {
      await supabase.from('prodotti').update(payload).eq('id', prodotto.id)
    }
    setSaving(false)
    onSalva()
  }

  async function elimina() {
    if (!confirm('Eliminare questo prodotto?')) return
    await supabase.from('prodotti').update({ disponibile: false }).eq('id', prodotto.id)
    onSalva()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isNuovo ? 'Nuovo prodotto' : 'Modifica prodotto'}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="form-group">
          <label>Nome prodotto</label>
          <input value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} placeholder="Es: Maglia ufficiale 2024" />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Prezzo (€)</label>
            <input type="number" step="0.01" value={form.prezzo} onChange={e => setForm({...form, prezzo: e.target.value})} placeholder="0.00" />
          </div>
          <div className="form-group">
            <label>URL foto</label>
            <input value={form.foto_url} onChange={e => setForm({...form, foto_url: e.target.value})} placeholder="https://..." />
          </div>
        </div>

        <div className="form-group">
          <label>Descrizione</label>
          <textarea value={form.descrizione} onChange={e => setForm({...form, descrizione: e.target.value})} rows={2} />
        </div>

        <div className="form-group">
          <label>Taglie disponibili</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
            {TAGLIE_DEFAULT.map(t => (
              <button key={t} type="button"
                onClick={() => toggleTaglia(t)}
                style={{ padding: '6px 14px', borderRadius: 6, border: '1.5px solid',
                  borderColor: form.taglie.includes(t) ? 'var(--verde)' : 'var(--grigio-chiaro)',
                  background: form.taglie.includes(t) ? 'var(--verde)' : 'white',
                  color: form.taglie.includes(t) ? 'white' : 'var(--testo)',
                  fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', marginTop: 16 }}>
          <div>
            {!isNuovo && (
              <button className="btn btn-danger" onClick={elimina}>Rimuovi</button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline" onClick={onClose}>Annulla</button>
            <button className="btn btn-primario" onClick={salva} disabled={saving}>
              {saving ? 'Salvataggio...' : 'Salva'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Modal Ordine ────────────────────────────────────────────────────────────

function ModalOrdine({ prodotto, profilo, onClose, onSalva }) {
  const [taglia, setTaglia] = useState(prodotto.taglie?.[0] || '')
  const [quantita, setQuantita] = useState(1)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  async function ordina() {
    setSaving(true)
    await supabase.from('ordini').insert({
      giocatore_id: profilo.id,
      prodotto_id: prodotto.id,
      taglia: taglia || null,
      quantita,
      note: note || null,
    })
    setSaving(false)
    onSalva()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Ordina — {prodotto.nome}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* Riepilogo prodotto */}
        <div style={{ background: 'var(--sfondo)', borderRadius: 10, padding: 16, marginBottom: 20, display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ fontSize: 48 }}>{prodotto.foto_url ? <img src={prodotto.foto_url} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }} /> : '👕'}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{prodotto.nome}</div>
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: 28, fontWeight: 700, color: 'var(--verde)' }}>
              €{Number(prodotto.prezzo).toFixed(2)}
            </div>
          </div>
        </div>

        {prodotto.taglie?.length > 0 && (
          <div className="form-group">
            <label>Taglia</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
              {prodotto.taglie.map(t => (
                <button key={t} type="button" onClick={() => setTaglia(t)}
                  style={{ padding: '8px 16px', borderRadius: 6, border: '1.5px solid',
                    borderColor: taglia === t ? 'var(--verde)' : 'var(--grigio-chiaro)',
                    background: taglia === t ? 'var(--verde)' : 'white',
                    color: taglia === t ? 'white' : 'var(--testo)',
                    fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>Quantità</label>
            <input type="number" min={1} max={10} value={quantita} onChange={e => setQuantita(parseInt(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Totale</label>
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: 32, fontWeight: 700, color: 'var(--verde)', paddingTop: 8 }}>
              €{(Number(prodotto.prezzo) * quantita).toFixed(2)}
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>Note per l'admin</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Es: personalizzazione, numero maglia..." />
        </div>

        <div className="alert alert-warning" style={{ fontSize: 13 }}>
          ⚠️ L'ordine verrà inviato all'amministratore che ti contatterà per il pagamento.
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button className="btn btn-outline" onClick={onClose}>Annulla</button>
          <button className="btn btn-primario" onClick={ordina} disabled={saving}>
            {saving ? 'Invio ordine...' : '✓ Conferma ordine'}
          </button>
        </div>
      </div>
    </div>
  )
}
