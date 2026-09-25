import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { collegaOneSignal } from '../notifiche'

// Su iPhone il permesso si può chiedere solo dopo un tocco dell'utente
function conOneSignal(fn) {
  window.OneSignalDeferred = window.OneSignalDeferred || []
  window.OneSignalDeferred.push(fn)
}

export default function BottoneNotifiche({ style }) {
  const { profilo } = useAuth()
  const [stato, setStato] = useState('caricamento') // attive | da-attivare | non-supportate | bloccate

  function aggiornaStato(OneSignal) {
    if (!OneSignal.Notifications.isPushSupported()) return setStato('non-supportate')
    if (Notification.permission === 'denied') return setStato('bloccate')
    setStato(OneSignal.Notifications.permission && OneSignal.User.PushSubscription.optedIn ? 'attive' : 'da-attivare')
  }

  useEffect(() => { conOneSignal(aggiornaStato) }, [])

  function attiva() {
    conOneSignal(async OneSignal => {
      try {
        await OneSignal.Notifications.requestPermission()
        await OneSignal.User.PushSubscription.optIn()
        collegaOneSignal(profilo)
      } catch (err) {
        console.error('Errore attivazione notifiche:', err)
      }
      aggiornaStato(OneSignal)
    })
  }

  if (stato === 'attive' || stato === 'caricamento') return null

  const testi = {
    'da-attivare': '🔔 Attiva notifiche',
    'non-supportate': '📲 Per le notifiche: Condividi → Aggiungi a Home',
    'bloccate': '🔕 Notifiche bloccate nelle impostazioni',
  }

  return (
    <button className="btn-logout" onClick={stato === 'da-attivare' ? attiva : undefined}
      style={{ padding: '6px 12px', fontSize: 12, ...style }}>
      {testi[stato]}
    </button>
  )
}
