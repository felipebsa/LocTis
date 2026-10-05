'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, onUnauthorized, token, type User } from '@/lib/api'

type AuthValue = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Ao abrir o site: se já existe token guardado, descobre quem é o usuário.
  useEffect(() => {
    onUnauthorized(() => setUser(null))
    if (!token.get()) {
      setLoading(false)
      return () => onUnauthorized(null)
    }
    api<User>('/auth/me')
      .then(setUser)
      .catch(() => {}) // 401 já limpa o token dentro do api(); API fora do ar mantém o token
      .finally(() => setLoading(false))
    return () => onUnauthorized(null)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<{ access_token: string }>('/auth/login', {
      method: 'POST',
      form: { username: email, password }, // OAuth2PasswordRequestForm usa o campo "username"
      auth: false,
    })
    token.set(res.access_token)
    setUser(await api<User>('/auth/me'))
  }, [])

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      await api('/auth/register', { method: 'POST', json: { name, email, password }, auth: false })
      await login(email, password)
    },
    [login],
  )

  const logout = useCallback(() => {
    token.clear()
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}
