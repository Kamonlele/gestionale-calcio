const APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID
const API_KEY = import.meta.env.VITE_ONESIGNAL_API_KEY

export async function inviaNotifica({ titolo, messaggio, url = '/' }) {
  try {
    await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${API_KEY}`
      },
      body: JSON.stringify({
        app_id: APP_ID,
        included_segments: ['All'],
        headings: { en: titolo, it: titolo },
        contents: { en: messaggio, it: messaggio },
        url: `https://gestionale-calcio-gamma.vercel.app${url}`,
        chrome_web_icon: 'https://gestionale-calcio-gamma.vercel.app/logo.png',
      })
    })
  } catch (err) {
    console.error('Errore notifica:', err)
  }
}