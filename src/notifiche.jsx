import { supabase } from './supabaseClient'

// Le notifiche passano da /api/notifica (Vercel): la API key OneSignal resta sul server
async function chiamaApi(body) {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    await fetch('/api/notifica', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {})
      },
      body: JSON.stringify(body)
    })
  } catch (err) {
    console.error('Errore notifica:', err)
  }
}

export function inviaNotifica({ titolo, messaggio, url = '/' }) {
  return chiamaApi({ tipo: 'evento', titolo, messaggio, url })
}

// Notifica scritta a mano dallo staff: restituisce l'esito di OneSignal
export async function inviaNotificaManuale(dati) {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const r = await fetch('/api/notifica', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ tipo: 'manuale', ...dati })
    })
    return await r.json()
  } catch (err) {
    console.error('Errore notifica:', err)
    return { ok: false }
  }
}

export function notificaOrdineAnnullato(ordineId) {
  return chiamaApi({ tipo: 'annullato', ordineId })
}

export function notificaNuovoOrdine(ordineId) {
  return chiamaApi({ tipo: 'ordine', ordineId })
}

export function notificaNuovaRegistrazione() {
  return chiamaApi({ tipo: 'registrazione' })
}

// Collega il dispositivo all'utente e salva ruolo/approvazione come tag OneSignal
export function collegaOneSignal(profilo) {
  if (!profilo) return
  window.OneSignalDeferred = window.OneSignalDeferred || []
  window.OneSignalDeferred.push(async OneSignal => {
    try {
      await OneSignal.login(profilo.id)
      await OneSignal.User.addTags({ ruolo: profilo.ruolo, approvato: profilo.approvato ? 'si' : 'no' })
    } catch (err) {
      console.error('Errore OneSignal:', err)
    }
  })
}
