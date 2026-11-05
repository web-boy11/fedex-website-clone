import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

// Demo-only session: picks a role, never collects credentials. Stored in
// sessionStorage so it lasts for the browser tab, and read after hydration.
export type DemoRole = 'customer' | 'admin'

type Session = {
  role: DemoRole | null
  ready: boolean
  signIn: (role: DemoRole) => void
  signOut: () => void
}

const KEY = 'concept-demo-role'
const SessionContext = createContext<Session | null>(null)

export function DemoSessionProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<DemoRole | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const stored = window.sessionStorage.getItem(KEY)
    if (stored === 'customer' || stored === 'admin') setRole(stored)
    setReady(true)
  }, [])

  const signIn = useCallback((r: DemoRole) => {
    window.sessionStorage.setItem(KEY, r)
    setRole(r)
  }, [])
  const signOut = useCallback(() => {
    window.sessionStorage.removeItem(KEY)
    setRole(null)
  }, [])

  return (
    <SessionContext.Provider value={{ role, ready, signIn, signOut }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useDemoSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useDemoSession must be used inside DemoSessionProvider')
  return ctx
}
