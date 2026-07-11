'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trophy, Mail, Lock, Eye, EyeOff, Loader2, Chrome } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'login' | 'register'>('login')

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        })
        if (error) throw error
        setError('Verifique seu email para confirmar o cadastro.')
        setLoading(false)
        return
      }
      router.push('/dashboard')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao autenticar'
      setError(msg === 'Invalid login credentials' ? 'Email ou senha inválidos' : msg)
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-surface-0 flex flex-col items-center justify-center px-4">
      {/* Background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-neon-green/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-neon-green/10 border border-neon-green/30 flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8 text-neon-green" />
          </div>
          <h1 className="text-2xl font-bold text-white">Langolandia</h1>
          <p className="text-muted-foreground text-sm mt-1">Beach Tennis Super 8</p>
        </div>

        {/* Card */}
        <div className="card-surface p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold">
              {mode === 'login' ? 'Entrar na conta' : 'Criar conta'}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {mode === 'login' ? 'Bem-vindo de volta' : 'Comece a usar agora'}
            </p>
          </div>

          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-surface-3 hover:bg-surface-4 border border-surface-4 hover:border-white/20 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 disabled:opacity-50"
          >
            <Chrome className="w-4 h-4" />
            Continuar com Google
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-4" />
            </div>
            <div className="relative flex justify-center text-xs text-muted-foreground">
              <span className="bg-surface-2 px-3">ou com email</span>
            </div>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Email
              </label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full bg-surface-3 border border-surface-4 focus:border-neon-green/50 focus:ring-0 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/50"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Senha
              </label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-surface-3 border border-surface-4 focus:border-neon-green/50 rounded-lg pl-10 pr-10 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className={`text-xs px-3 py-2 rounded-lg ${
                error.includes('Verifique')
                  ? 'bg-neon-green/10 text-neon-green border border-neon-green/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-neon rounded-lg py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {mode === 'login' ? 'Não tem conta?' : 'Já tem conta?'}{' '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
              className="text-neon-green hover:text-neon-green-dim font-medium"
            >
              {mode === 'login' ? 'Criar agora' : 'Entrar'}
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground/50 mt-6">
          Copa Sementes · Vôlei e Beach Tennis
        </p>
      </div>
    </div>
  )
}
