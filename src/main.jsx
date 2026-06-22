import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// Inizializza OneSignal
window.OneSignalDeferred = window.OneSignalDeferred || []
window.OneSignalDeferred.push(async function(OneSignal) {
  await OneSignal.init({
    appId: import.meta.env.VITE_ONESIGNAL_APP_ID,
    safari_web_id: 'web.onesignal.auto',
    notifyButton: { enable: true },
    allowLocalhostAsSecureOrigin: true,
  })
})

const script = document.createElement('script')
script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js'
script.defer = true
document.head.appendChild(script)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)