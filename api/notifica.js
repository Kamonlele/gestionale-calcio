// Invio notifiche OneSignal lato server: la API key non finisce mai nel browser
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON = process.env.VITE_SUPABASE_ANON_KEY
const APP_ID = process.env.VITE_ONESIGNAL_APP_ID
const API_KEY = process.env.ONESIGNAL_API_KEY
const SITO = 'https://gestionale-calcio-gamma.vercel.app'
const RUOLI_CALENDARIO = ['dirigente', 'presidente', 'cassiere', 'admin']
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const RUOLI = ['giocatore', 'dirigente', 'cassiere', 'presidente', 'admin']
const PAGINE = ['/dashboard', '/calendario', '/shop', '/giocatori', '/finanze']
const UUID = /^[0-9a-f-]{36}$/

async function idDaToken(token) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${token}` }
  })
  return r.ok ? (await r.json()).id : null
}

async function ruoloDaToken(token) {
  const utente = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${token}` }
  })
  if (!utente.ok) return null
  const { id } = await utente.json()
  const r = await fetch(`${SUPABASE_URL}/rest/v1/profili?select=ruolo,approvato&id=eq.${id}`, {
    headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${token}` }
  })
  const [profilo] = await r.json()
  return profilo?.approvato ? profilo.ruolo : null
}

async function inviaOneSignal(payload) {
  const res = await fetch('https://api.onesignal.com/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Key ${API_KEY}` },
    body: JSON.stringify({ app_id: APP_ID, chrome_web_icon: `${SITO}/logo.png`, ...payload })
  })
  const risposta = await res.json().catch(() => ({}))
  if (!res.ok || risposta.errors) console.error('OneSignal:', res.status, JSON.stringify(risposta))
  return { ok: res.ok && !risposta.errors, destinatari: risposta.recipients ?? null, errori: risposta.errors ?? null }
}

// Profilo di chi chiama, letto con il suo token (valgono le regole del database)
async function profiloDaToken(token) {
  const uid = await idDaToken(token)
  if (!uid) return null
  const r = await fetch(`${SUPABASE_URL}/rest/v1/profili?select=id,nome,cognome,ruolo,approvato,invia_notifiche&id=eq.${uid}`, {
    headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${token}` }
  })
  const [p] = r.ok ? await r.json() : []
  return p?.approvato ? p : null
}

const puoInviare = p => p && (['admin', 'cassiere'].includes(p.ruolo) || (p.ruolo === 'dirigente' && p.invia_notifiche))

const db = (path, init = {}) => fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
  ...init,
  headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json', ...init.headers }
})

// Notifica scritta a mano dallo staff: a tutti, a uno o più ruoli, o a giocatori scelti
async function notificaManuale(req, res, token) {
  const mittente = token && await profiloDaToken(token)
  if (!puoInviare(mittente)) return res.status(403).json({ errore: 'Non autorizzato' })

  const { titolo = '', messaggio = '', pagina = '/dashboard', destinatari = {} } = req.body || {}
  const t = String(titolo).trim().slice(0, 60)
  const m = String(messaggio).trim().slice(0, 300)
  if (!t || !m) return res.status(400).json({ errore: 'Titolo e messaggio sono obbligatori' })
  const url = `${SITO}${PAGINE.includes(pagina) ? pagina : '/dashboard'}`

  let target, descrizione
  if (destinatari.tipo === 'ruoli') {
    const ruoli = (destinatari.ruoli || []).filter(r => RUOLI.includes(r))
    if (!ruoli.length) return res.status(400).json({ errore: 'Scegli almeno un ruolo' })
    target = { filters: ruoli.flatMap((r, i) => [...(i ? [{ operator: 'OR' }] : []), { field: 'tag', key: 'ruolo', relation: '=', value: r }]) }
    descrizione = `Ruoli: ${ruoli.join(', ')}`
  } else if (destinatari.tipo === 'giocatori') {
    const ids = [...new Set((destinatari.ids || []).filter(id => UUID.test(id)))].slice(0, 200)
    if (!ids.length) return res.status(400).json({ errore: 'Scegli almeno un giocatore' })
    target = { include_aliases: { external_id: ids }, target_channel: 'push' }
    const r = await db(`profili?select=nome,cognome&id=in.(${ids.join(',')})`)
    const nomi = r.ok ? (await r.json()).map(p => `${p.nome} ${p.cognome}`.trim()) : []
    descrizione = `${ids.length} giocator${ids.length === 1 ? 'e' : 'i'}: ${nomi.join(', ')}`
  } else {
    target = { filters: [{ field: 'tag', key: 'approvato', relation: '=', value: 'si' }] }
    descrizione = 'Tutta la squadra'
  }

  const esito = await inviaOneSignal({ ...target, headings: { en: t, it: t }, contents: { en: m, it: m }, url })
  if (SERVICE_KEY) {
    await db('notifiche_inviate', {
      method: 'POST',
      body: JSON.stringify({ titolo: t, messaggio: m, pagina, destinatari: descrizione, inviato_da: mittente.id, ok: esito.ok })
    })
  }
  return res.status(200).json(esito)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { tipo, titolo, messaggio, url = '/', ordineId } = req.body || {}
  const token = (req.headers.authorization || '').replace('Bearer ', '')

  if (tipo === 'manuale') return notificaManuale(req, res, token)

  if (tipo === 'annullato') {
    const uid = token && await idDaToken(token)
    if (!uid || !UUID.test(ordineId || '')) return res.status(403).json({ errore: 'Non autorizzato' })
    const r = await fetch(`${SUPABASE_URL}/rest/v1/ordini?id=eq.${ordineId}&select=giocatore_id,creato_da,stato,annullato_il,quantita,taglia,prodotti(nome),profili!ordini_giocatore_id_fkey(nome)`, {
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${token}` }
    })
    const [o] = r.ok ? await r.json() : []
    // Solo un ordine appena annullato da chi lo possiede o l'ha inserito
    if (!o || o.stato !== 'annullato' || !o.annullato_il || (o.giocatore_id !== uid && o.creato_da !== uid) ||
        Date.now() - new Date(o.annullato_il).getTime() > 120000) {
      return res.status(403).json({ errore: 'Non autorizzato' })
    }
    const testo = `${o.profili?.nome || ''} — ${o.quantita}× ${o.prodotti?.nome || 'prodotto'}${o.taglia ? ` (${o.taglia})` : ''}`.trim()
    const esito = await inviaOneSignal({
      filters: [
        { field: 'tag', key: 'ruolo', relation: '=', value: 'admin' },
        { operator: 'OR' },
        { field: 'tag', key: 'ruolo', relation: '=', value: 'cassiere' }
      ],
      headings: { en: '❌ Ordine annullato', it: '❌ Ordine annullato' },
      contents: { en: testo, it: testo },
      url: `${SITO}/shop`
    })
    return res.status(200).json(esito)
  }

  if (tipo === 'ordine') {
    const uid = token && await idDaToken(token)
    if (!uid || !/^[0-9a-f-]{36}$/.test(ordineId || '')) return res.status(403).json({ errore: 'Non autorizzato' })
    const r = await fetch(`${SUPABASE_URL}/rest/v1/ordini?id=eq.${ordineId}&select=giocatore_id,creato_da,quantita,taglia,note,creato_il,prodotti(nome),profili!ordini_giocatore_id_fkey(nome,cognome)`, {
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${token}` }
    })
    const [o] = r.ok ? await r.json() : []
    // Solo il proprio ordine, appena creato: niente notifiche ripetute a comando
    if (!o || (o.giocatore_id !== uid && o.creato_da !== uid) || Date.now() - new Date(o.creato_il).getTime() > 120000) {
      return res.status(403).json({ errore: 'Non autorizzato' })
    }
    const testo = `${o.profili?.nome || ''} ${o.profili?.cognome || ''} — ${o.quantita}× ${o.prodotti?.nome || 'prodotto'}${o.taglia ? ` (${o.taglia}${o.taglia === 'BABY' && o.note ? `, ${o.note.split(' — ')[0].replace('Età: ', '')}` : ''})` : ''}`.trim()
    const esito = await inviaOneSignal({
      filters: [
        { field: 'tag', key: 'ruolo', relation: '=', value: 'admin' },
        { operator: 'OR' },
        { field: 'tag', key: 'ruolo', relation: '=', value: 'cassiere' }
      ],
      headings: { en: '🛍️ Nuovo ordine', it: '🛍️ Nuovo ordine' },
      contents: { en: testo, it: testo },
      url: `${SITO}/shop`
    })
    return res.status(200).json(esito)
  }

  if (tipo === 'registrazione') {
    // Testo fisso: nessun contenuto arbitrario verso gli admin
    const esito = await inviaOneSignal({
      filters: [{ field: 'tag', key: 'ruolo', relation: '=', value: 'admin' }],
      headings: { en: '👤 Nuova registrazione', it: '👤 Nuova registrazione' },
      contents: { en: 'Un utente è in attesa di approvazione', it: 'Un utente è in attesa di approvazione' },
      url: `${SITO}/admin`
    })
    return res.status(200).json(esito)
  }

  if (tipo === 'evento') {
    const ruolo = token && await ruoloDaToken(token)
    if (!RUOLI_CALENDARIO.includes(ruolo)) return res.status(403).json({ errore: 'Non autorizzato' })
    const esito = await inviaOneSignal({
      filters: [{ field: 'tag', key: 'approvato', relation: '=', value: 'si' }],
      headings: { en: titolo, it: titolo },
      contents: { en: messaggio, it: messaggio },
      url: `${SITO}${url.startsWith('/') ? url : '/'}`
    })
    return res.status(200).json(esito)
  }

  res.status(400).json({ errore: 'Tipo non valido' })
}
