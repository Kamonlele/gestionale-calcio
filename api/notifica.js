// Invio notifiche OneSignal lato server: la API key non finisce mai nel browser
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON = process.env.VITE_SUPABASE_ANON_KEY
const APP_ID = process.env.VITE_ONESIGNAL_APP_ID
const API_KEY = process.env.ONESIGNAL_API_KEY
const SITO = 'https://gestionale-calcio-gamma.vercel.app'
const RUOLI_CALENDARIO = ['dirigente', 'presidente', 'cassiere', 'admin']

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

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { tipo, titolo, messaggio, url = '/' } = req.body || {}

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
    const token = (req.headers.authorization || '').replace('Bearer ', '')
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
