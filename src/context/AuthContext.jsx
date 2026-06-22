import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [utente, setUtente] = useState(null)
  const [profilo, setProfilo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUtente(session?.user ?? null)
      if (session?.user) caricaProfilo(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUtente(session?.user ?? null)
      if (session?.user) caricaProfilo(session.user.id)
      else { setProfilo(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function caricaProfilo(userId) {
    const { data } = await supabase
      .from('profili')
      .select('*')
      .eq('id', userId)
      .single()
    setProfilo(data)
    setLoading(false)
  }

  async function login(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  const ruolo = profilo?.ruolo ?? 'giocatore'
  const approvato = profilo?.approvato ?? false
  const isAdmin = ruolo === 'admin'
  const isCassiere = ruolo === 'cassiere' || isAdmin
  const isDirigente = ruolo === 'dirigente' || isAdmin
  const isPresidente = ruolo === 'presidente' || isAdmin
  const puoModificareGiocatori = ruolo === 'presidente' || ruolo === 'cassiere' || isAdmin
  const puoModificareCalendario = ruolo === 'dirigente' || ruolo === 'presidente' || ruolo === 'cassiere' || isAdmin
  const puoVedereFinanze = ruolo === 'cassiere' || ruolo === 'dirigente' || ruolo === 'presidente' || isAdmin

  return (
    <AuthContext.Provider value={{
      utente, profilo, loading, login, logout, ruolo, approvato,
      isAdmin, isCassiere, isDirigente, isPresidente,
      puoModificareGiocatori, puoModificareCalendario, puoVedereFinanze
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)