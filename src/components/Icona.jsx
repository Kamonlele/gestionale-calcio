// Icone a tratto uniforme (1.8px) per la navigazione
const PERCORSI = {
  dashboard: <><path d="M3 10.5 12 4l9 6.5" /><path d="M5 9.5V20h5v-6h4v6h5V9.5" /></>,
  giocatori: <><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19.5c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5" /><path d="M15.5 5.3a3 3 0 0 1 0 5.4" /><path d="M17 14.6c1.9.5 3.1 2.2 3.5 4.9" /></>,
  calendario: <><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /><circle cx="12" cy="15" r="1.3" fill="currentColor" stroke="none" /></>,
  shop: <><path d="M5 8h14l-1.2 11.2a1.5 1.5 0 0 1-1.5 1.3H7.7a1.5 1.5 0 0 1-1.5-1.3L5 8Z" /><path d="M9 10V7a3 3 0 0 1 6 0v3" /></>,
  finanze: <><rect x="3" y="6" width="18" height="13" rx="2.5" /><path d="M3 10h18" /><path d="M16 14.5h2" /></>,
  admin: <><path d="M12 3.5 19 6v5.5c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6l7-2.5Z" /><path d="m9 12 2 2 4-4" /></>,
}

export default function Icona({ nome }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PERCORSI[nome]}
    </svg>
  )
}
