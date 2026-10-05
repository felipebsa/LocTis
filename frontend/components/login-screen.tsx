'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth'

const inputClass =
  'h-10 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-[#d4a72c] focus:ring-2 focus:ring-[#d4a72c]/10'

export function LoginScreen() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')

  // A landing page abre o app com ?modo=cadastro no botão "Começar agora".
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('modo') === 'cadastro') setMode('register')
  }, [])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (mode === 'login') await login(email, password)
      else await register(name, email, password)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro inesperado')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="loctis-shell flex min-h-screen items-center justify-center p-5 text-slate-100">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#0b0e22] p-7 shadow-2xl">
        <img src="/loctis-logo-new.png" alt="LocTis" className="mb-6 h-auto w-[150px] object-contain object-left" />
        <h1 className="font-serif text-2xl text-white">{mode === 'login' ? 'Entrar' : 'Criar conta'}</h1>
        <p className="mt-1 text-xs text-slate-500">
          {mode === 'login' ? 'Acesse o painel do seu portfólio.' : 'Cada conta tem seus próprios dados, isolados.'}
        </p>

        <div className="mt-6 flex flex-col gap-4">
          {mode === 'register' && (
            <label className="flex flex-col gap-2 text-xs text-slate-400">
              Nome
              <input required value={name} onChange={e => setName(e.target.value)} className={inputClass} autoComplete="name" />
            </label>
          )}
          <label className="flex flex-col gap-2 text-xs text-slate-400">
            E-mail
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} autoComplete="email" />
          </label>
          <label className="flex flex-col gap-2 text-xs text-slate-400">
            Senha
            <input
              required
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={inputClass}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </label>
        </div>

        {error && <p role="alert" className="mt-4 rounded-lg border border-[#bd6870]/30 bg-[#bd6870]/10 px-3 py-2 text-xs text-[#e29aa1]">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="mt-6 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#5146d8] text-xs font-semibold text-white shadow-lg shadow-[#5146d8]/30 transition hover:bg-[#635bff] disabled:opacity-60"
        >
          {busy && <Loader2 className="size-4 animate-spin" />}
          {mode === 'login' ? 'Entrar' : 'Criar conta'}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login')
            setError(null)
          }}
          className="mt-4 w-full text-center text-[11px] text-[#8d87ff] hover:text-[#d4a72c]"
        >
          {mode === 'login' ? 'Ainda não tem conta? Criar conta' : 'Já tem conta? Entrar'}
        </button>
      </form>
    </main>
  )
}
