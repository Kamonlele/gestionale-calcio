import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function ModalCertificato({ giocatore, onClose, onSalva }) {
  const [form, setForm] = useState({
    data_rilascio: '',
    data_scadenza: '',
    tipo: 'agonistico',
    note: '',
  })
  const [saving, setSaving] = useState(false)
  const [errore, setErrore] = useState('')

  async function salva() {
    if (!form.data_scadenza) { setErrore('Inserisci la data di scadenza.'); return }
    setSaving(true)
    setErrore('')
    const { error } = await supabase.from('certificati_medici').insert({
      ...form,
      data_rilascio: form.data_rilascio || null,
      giocatore_id: giocatore.id,
    })
    setSaving(false)
    if (error) { setErrore('Salvataggio non riuscito: non hai il permesso o c\'è un problema di connessione.'); return }
    onSalva()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Certificato medico — {giocatore.nome} {giocatore.cognome}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {errore && <div className="alert alert-danger">{errore}</div>}
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
