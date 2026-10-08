// Ogni mattina (cron Vercel): notifica alla squadra i compleanni del giorno
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const APP_ID = process.env.VITE_ONESIGNAL_APP_ID
const API_KEY = process.env.ONESIGNAL_API_KEY
const SITO = 'https://gestionale-calcio-gamma.vercel.app'

const db = (path, init = {}) => fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
  ...init,
  headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json', ...init.headers }
})

function oggiRoma() {
  const [anno, mese, giorno] = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(new Date()).split('-').map(Number)
  return { anno, mese, giorno, iso: `${anno}-${String(mese).padStart(2, '0')}-${String(giorno).padStart(2, '0')}` }
}

export default async function handler(req, res) {
  if (!SERVICE_KEY) return res.status(500).json({ errore: 'SUPABASE_SERVICE_ROLE_KEY mancante' })
  const oggi = oggiRoma()
  const bisestile = oggi.anno % 4 === 0 && (oggi.anno % 100 !== 0 || oggi.anno % 400 === 0)

  const r = await db('profili?select=nome,cognome,data_nascita&approvato=eq.true&attivo=eq.true&data_nascita=not.is.null')
  const festeggiati = (await r.json()).filter(p => {
    const [, m, g] = p.data_nascita.split('-').map(Number)
    // Nati il 29/02: negli anni non bisestili si festeggia il 28/02
    if (m === 2 && g === 29 && !bisestile) return oggi.mese === 2 && oggi.giorno === 28
    return m === oggi.mese && g === oggi.giorno
  })
  if (festeggiati.length === 0) return res.status(200).json({ ok: true, festeggiati: 0 })

  // Una sola notifica al giorno, anche se la funzione viene richiamata più volte
  const reg = await db('compleanni_notificati', { method: 'POST', body: JSON.stringify({ giorno: oggi.iso }) })
  if (reg.status === 409) return res.status(200).json({ ok: true, giaInviata: true })
  if (!reg.ok) return res.status(500).json({ errore: 'Registro non disponibile' })

  const nomi = festeggiati.map(p => `${p.nome} ${p.cognome}`)
  const elenco = nomi.length === 1 ? nomi[0] : `${nomi.slice(0, -1).join(', ')} e ${nomi.at(-1)}`
  const testo = `Oggi è il compleanno di ${elenco}! Fate gli auguri 🎉`

  const invio = await fetch('https://api.onesignal.com/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Key ${API_KEY}` },
    body: JSON.stringify({
      app_id: APP_ID,
      filters: [{ field: 'tag', key: 'approvato', relation: '=', value: 'si' }],
      headings: { en: '🎂 Buon compleanno!', it: '🎂 Buon compleanno!' },
      contents: { en: testo, it: testo },
      url: `${SITO}/dashboard`,
      chrome_web_icon: `${SITO}/logo.png`
    })
  })
  const esito = await invio.json().catch(() => ({}))
  res.status(200).json({ ok: invio.ok && !esito.errors, festeggiati: nomi.length, errori: esito.errors ?? null })
}
