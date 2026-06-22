import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function Finanze() {
  const { profilo, isCassiere } = useAuth()
  const [movimenti, setMovimenti] = useState([])
  const [categorie, setCategorie] = useState([])
  const [saldo, setSaldo] = useState({ entrate: 0, uscite: 0, totale: 0 })
  const [mostraModal, setMostraModal] = useState(false)
  const [mostraReport, setMostraReport] = useState(false)
  const [filtroTipo, setFiltroTipo] = useState('tutti')
  const [loading, setLoading] = useState(true)

  useEffect(() => { caricaDati() }, [])

  async function caricaDati() {
    const [{ data: mov }, { data: cat }] = await Promise.all([
      supabase.from('movimenti')
        .select('*, categorie_finanziarie(nome), profili!movimenti_giocatore_id_fkey(nome, cognome)')
        .order('data_movimento', { ascending: false }),
      supabase.from('categorie_finanziarie').select('*').order('tipo').order('nome')
    ])
    const lista = mov || []
    setMovimenti(lista)
    setCategorie(cat || [])
    const entrate = lista.filter(m => m.tipo === 'entrata').reduce((s, m) => s + Number(m.importo), 0)
    const uscite = lista.filter(m => m.tipo === 'uscita').reduce((s, m) => s + Number(m.importo), 0)
    setSaldo({ entrate, uscite, totale: entrate - uscite })
    setLoading(false)
  }

  const filtrati = filtroTipo === 'tutti' ? movimenti : movimenti.filter(m => m.tipo === filtroTipo)

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>💶 Finanze</h2>
          <p>Gestione cassa e movimenti</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" onClick={() => setMostraReport(true)}>📄 Report PDF</button>
          {isCassiere && (
            <button className="btn btn-primario" onClick={() => setMostraModal(true)}>+ Registra movimento</button>
          )}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Totale entrate</div>
          <div className="stat-valore euro" style={{ color: 'var(--verde)' }}>{saldo.entrate.toFixed(2)}</div>
        </div>
        <div className="stat-card rosso">
          <div className="stat-label">Totale uscite</div>
          <div className="stat-valore euro" style={{ color: 'var(--rosso)' }}>{saldo.uscite.toFixed(2)}</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: saldo.totale >= 0 ? 'var(--verde)' : 'var(--rosso)' }}>
          <div className="stat-label">Saldo attuale</div>
          <div className="stat-valore euro" style={{ color: saldo.totale >= 0 ? 'var(--verde)' : 'var(--rosso)' }}>
            {saldo.totale.toFixed(2)}
          </div>
        </div>
        <div className="stat-card grigio">
          <div className="stat-label">Movimenti</div>
          <div className="stat-valore">{movimenti.length}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[['tutti','Tutti'],['entrata','Entrate'],['uscita','Uscite']].map(([v, l]) => (
          <button key={v} className={`btn ${filtroTipo === v ? 'btn-primario' : 'btn-outline'}`} onClick={() => setFiltroTipo(v)}>
            {l}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="tabella-wrapper">
          <table>
            <thead>
              <tr>
                <th>Data</th><th>Tipo</th><th>Descrizione</th><th>Categoria</th><th>Giocatore</th>
                <th style={{ textAlign: 'right' }}>Importo</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--grigio)' }}>Caricamento...</td></tr>
              ) : filtrati.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--grigio)' }}>Nessun movimento trovato.</td></tr>
              ) : filtrati.map(m => (
                <tr key={m.id}>
                  <td style={{ fontSize: 13, whiteSpace: 'nowrap' }}>{format(parseISO(m.data_movimento), 'dd/MM/yyyy')}</td>
                  <td>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
                      background: m.tipo === 'entrata' ? '#d4edda' : '#f8d7da',
                      color: m.tipo === 'entrata' ? '#155724' : '#721c24', textTransform: 'uppercase' }}>
                      {m.tipo === 'entrata' ? '↑' : '↓'} {m.tipo}
                    </span>
                  </td>
                  <td style={{ fontWeight: 500 }}>{m.descrizione}</td>
                  <td style={{ fontSize: 13, color: 'var(--grigio)' }}>{m.categorie_finanziarie?.nome || '—'}</td>
                  <td style={{ fontSize: 13 }}>{m.profili ? `${m.profili.nome} ${m.profili.cognome}` : '—'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18,
                    color: m.tipo === 'entrata' ? 'var(--verde)' : 'var(--rosso)' }}>
                    {m.tipo === 'entrata' ? '+' : '-'}€{Number(m.importo).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {mostraModal && <ModalMovimento categorie={categorie} profilo={profilo} onClose={() => setMostraModal(false)} onSalva={() => { setMostraModal(false); caricaDati() }} />}
      {mostraReport && <ModalReport movimenti={movimenti} onClose={() => setMostraReport(false)} />}
    </div>
  )
}

function ModalReport({ movimenti, onClose }) {
  const oggi = new Date()
  const primoMese = new Date(oggi.getFullYear(), oggi.getMonth(), 1)
  const [dal, setDal] = useState(format(primoMese, 'yyyy-MM-dd'))
  const [al, setAl] = useState(format(oggi, 'yyyy-MM-dd'))
  const [generando, setGenerando] = useState(false)

  const movimentiFiltrati = movimenti.filter(m => m.data_movimento >= dal && m.data_movimento <= al)
  const entrate = movimentiFiltrati.filter(m => m.tipo === 'entrata').reduce((s, m) => s + Number(m.importo), 0)
  const uscite = movimentiFiltrati.filter(m => m.tipo === 'uscita').reduce((s, m) => s + Number(m.importo), 0)
  const saldo = entrate - uscite

  const perCategoria = movimentiFiltrati.reduce((acc, m) => {
    const key = `${m.tipo}__${m.categorie_finanziarie?.nome || 'Senza categoria'}`
    if (!acc[key]) acc[key] = { cat: m.categorie_finanziarie?.nome || 'Senza categoria', tipo: m.tipo, totale: 0, count: 0 }
    acc[key].totale += Number(m.importo)
    acc[key].count++
    return acc
  }, {})

  function generaPDF() {
    setGenerando(true)
    const doc = new jsPDF()
    doc.setFillColor(26, 122, 60)
    doc.rect(0, 0, 210, 35, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text('DOPOLAVORO 47', 14, 16)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text('Report Finanziario', 14, 24)
    doc.text(`Periodo: ${format(parseISO(dal), 'dd/MM/yyyy')} — ${format(parseISO(al), 'dd/MM/yyyy')}`, 14, 31)
    doc.setTextColor(150, 150, 150)
    doc.setFontSize(9)
    doc.text(`Generato il ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 150, 31)

    doc.setTextColor(30, 30, 30)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Riepilogo', 14, 48)
    autoTable(doc, {
      startY: 52,
      head: [['', 'Importo']],
      body: [['Totale Entrate', `€ ${entrate.toFixed(2)}`], ['Totale Uscite', `€ ${uscite.toFixed(2)}`], ['Saldo', `€ ${saldo.toFixed(2)}`]],
      styles: { fontSize: 11 },
      headStyles: { fillColor: [26, 122, 60] },
      bodyStyles: { cellPadding: 5 },
      columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
      didParseCell: (data) => {
        if (data.row.index === 2) { data.cell.styles.textColor = saldo >= 0 ? [21, 87, 36] : [114, 28, 36]; data.cell.styles.fontStyle = 'bold' }
      }
    })

    const y1 = doc.lastAutoTable.finalY + 12
    doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.text('Dettaglio per categoria', 14, y1)
    autoTable(doc, {
      startY: y1 + 4,
      head: [['Tipo', 'Categoria', 'Movimenti', 'Totale']],
      body: Object.values(perCategoria).sort((a, b) => a.tipo.localeCompare(b.tipo)).map(r => [r.tipo === 'entrata' ? '↑ Entrata' : '↓ Uscita', r.cat, r.count.toString(), `€ ${r.totale.toFixed(2)}`]),
      styles: { fontSize: 10 }, headStyles: { fillColor: [26, 122, 60] }, columnStyles: { 3: { halign: 'right' } }
    })

    const y2 = doc.lastAutoTable.finalY + 12
    doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.text('Tutti i movimenti', 14, y2)
    autoTable(doc, {
      startY: y2 + 4,
      head: [['Data', 'Tipo', 'Descrizione', 'Categoria', 'Importo']],
      body: movimentiFiltrati.length > 0
        ? movimentiFiltrati.map(m => [format(parseISO(m.data_movimento), 'dd/MM/yyyy'), m.tipo === 'entrata' ? '↑ Entrata' : '↓ Uscita', m.descrizione, m.categorie_finanziarie?.nome || '—', `${m.tipo === 'entrata' ? '+' : '-'}€ ${Number(m.importo).toFixed(2)}`])
        : [['—', '—', 'Nessun movimento nel periodo', '—', '—']],
      styles: { fontSize: 9 }, headStyles: { fillColor: [26, 122, 60] }, columnStyles: { 4: { halign: 'right' } },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 4) {
          data.cell.styles.textColor = String(data.cell.raw).startsWith('+') ? [21, 87, 36] : [114, 28, 36]
          data.cell.styles.fontStyle = 'bold'
        }
      }
    })

    const pages = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pages; i++) { doc.setPage(i); doc.setFontSize(8); doc.setTextColor(150); doc.text(`Pagina ${i} di ${pages} — Dopolavoro 47`, 14, 290) }
    doc.save(`report-finanziario-${dal}-${al}.pdf`)
    setGenerando(false)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📄 Genera Report PDF</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Dal</label><input type="date" value={dal} onChange={e => setDal(e.target.value)} /></div>
          <div className="form-group"><label>Al</label><input type="date" value={al} onChange={e => setAl(e.target.value)} /></div>
        </div>
        <div style={{ background: 'var(--sfondo)', borderRadius: 10, padding: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--grigio)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Anteprima periodo</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {[['€'+entrate.toFixed(2),'Entrate','var(--verde)'],['€'+uscite.toFixed(2),'Uscite','var(--rosso)'],['€'+saldo.toFixed(2),'Saldo', saldo >= 0 ? 'var(--verde)' : 'var(--rosso)']].map(([val, label, color]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Barlow Condensed', fontSize: 28, fontWeight: 700, color }}>{val}</div>
                <div style={{ fontSize: 11, color: 'var(--grigio)' }}>{label}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, fontSize: 13, color: 'var(--grigio)', textAlign: 'center' }}>{movimentiFiltrati.length} movimenti nel periodo</div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-outline" onClick={onClose}>Annulla</button>
          <button className="btn btn-primario" onClick={generaPDF} disabled={generando}>{generando ? 'Generando...' : '⬇ Scarica PDF'}</button>
        </div>
      </div>
    </div>
  )
}

function ModalMovimento({ categorie, profilo, onClose, onSalva }) {
  const [form, setForm] = useState({ tipo: 'entrata', importo: '', descrizione: '', categoria_id: '', data_movimento: format(new Date(), 'yyyy-MM-dd'), note: '' })
  const [saving, setSaving] = useState(false)
  const [errore, setErrore] = useState('')
  const categorieFiltrate = categorie.filter(c => c.tipo === form.tipo)

  async function salva() {
    if (!form.importo || !form.descrizione) { setErrore('Importo e descrizione sono obbligatori.'); return }
    setSaving(true)
    const { error } = await supabase.from('movimenti').insert({ ...form, importo: parseFloat(form.importo), categoria_id: form.categoria_id || null, registrato_da: profilo.id })
    if (error) { setErrore(error.message); setSaving(false); return }
    setSaving(false); onSalva()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Registra movimento</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {errore && <div className="alert alert-danger">{errore}</div>}
        <div style={{ display: 'flex', marginBottom: 20, borderRadius: 10, overflow: 'hidden', border: '1.5px solid var(--grigio-chiaro)' }}>
          {['entrata','uscita'].map(t => (
            <button key={t} onClick={() => setForm({...form, tipo: t, categoria_id: ''})}
              style={{ flex: 1, padding: '12px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 15, textTransform: 'uppercase',
                background: form.tipo === t ? (t === 'entrata' ? 'var(--verde)' : 'var(--rosso)') : 'white',
                color: form.tipo === t ? 'white' : 'var(--grigio)' }}>
              {t === 'entrata' ? '↑ Entrata' : '↓ Uscita'}
            </button>
          ))}
        </div>
        <div className="form-row">
          <div className="form-group"><label>Importo (€)</label><input type="number" step="0.01" value={form.importo} onChange={e => setForm({...form, importo: e.target.value})} placeholder="0.00" /></div>
          <div className="form-group"><label>Data</label><input type="date" value={form.data_movimento} onChange={e => setForm({...form, data_movimento: e.target.value})} /></div>
        </div>
        <div className="form-group"><label>Descrizione</label><input value={form.descrizione} onChange={e => setForm({...form, descrizione: e.target.value})} placeholder="Es: Quota mensile Mario Rossi" /></div>
        <div className="form-group">
          <label>Categoria</label>
          <select value={form.categoria_id} onChange={e => setForm({...form, categoria_id: e.target.value})}>
            <option value="">— Seleziona categoria —</option>
            {categorieFiltrate.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
        <div className="form-group"><label>Note</label><textarea value={form.note} onChange={e => setForm({...form, note: e.target.value})} rows={2} /></div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button className="btn btn-outline" onClick={onClose}>Annulla</button>
          <button className="btn btn-primario" onClick={salva} disabled={saving}>{saving ? 'Salvataggio...' : 'Registra'}</button>
        </div>
      </div>
    </div>
  )
}