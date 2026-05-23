'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Save, Loader2, User } from 'lucide-react'

export default function NewAthletePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    category: 'intermediario',
    gender: '',
    birth_date: '',
    arena_origin: '',
    observations: '',
  })

  function update(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { error: err } = await supabase.from('athletes').insert({
        ...form,
        gender: form.gender || null,
        birth_date: form.birth_date || null,
        email: form.email || null,
        phone: form.phone || null,
        arena_origin: form.arena_origin || null,
        observations: form.observations || null,
        is_active: true,
        created_by: user?.id ?? null,
      })

      if (err) throw err
      router.push('/athletes')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar atleta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-5 animate-slide-up">
      <div className="flex items-center gap-3">
        <Link href="/athletes" className="text-muted-foreground hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Novo Atleta</h1>
          <p className="text-sm text-muted-foreground">Cadastrar no sistema</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Avatar placeholder */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-surface-3 border-2 border-surface-4 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-neon-green/30 transition-all">
            <User className="w-7 h-7 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Foto</span>
          </div>
        </div>

        <div className="card-surface p-5 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Dados Pessoais</h2>

          <div>
            <label className="label-field">Nome Completo *</label>
            <input type="text" value={form.name} onChange={e => update('name', e.target.value)}
              placeholder="Nome do atleta" required className="input-field mt-1.5" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Telefone</label>
              <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)}
                placeholder="(00) 00000-0000" className="input-field mt-1.5" />
            </div>
            <div>
              <label className="label-field">Data de Nascimento</label>
              <input type="date" value={form.birth_date} onChange={e => update('birth_date', e.target.value)}
                className="input-field mt-1.5" />
            </div>
          </div>

          <div>
            <label className="label-field">Email</label>
            <input type="email" value={form.email} onChange={e => update('email', e.target.value)}
              placeholder="atleta@email.com" className="input-field mt-1.5" />
          </div>

          <div>
            <label className="label-field">Sexo</label>
            <div className="grid grid-cols-3 gap-2 mt-1.5">
              {[
                { value: 'masculino', label: 'Masculino' },
                { value: 'feminino', label: 'Feminino' },
                { value: 'misto', label: 'Misto' },
              ].map(opt => (
                <button key={opt.value} type="button" onClick={() => update('gender', opt.value)}
                  className={`py-2 rounded-lg border text-xs font-medium transition-all ${
                    form.gender === opt.value
                      ? 'bg-neon-green/10 border-neon-green/40 text-neon-green'
                      : 'bg-surface-3 border-surface-4 text-muted-foreground hover:border-white/20'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="card-surface p-5 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Nível e Arena</h2>

          <div>
            <label className="label-field">Categoria</label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              {[
                { value: 'iniciante', label: 'Iniciante' },
                { value: 'intermediario', label: 'Intermediário' },
                { value: 'avancado', label: 'Avançado' },
                { value: 'profissional', label: 'Profissional' },
              ].map(opt => (
                <button key={opt.value} type="button" onClick={() => update('category', opt.value)}
                  className={`py-2 rounded-lg border text-xs font-medium transition-all ${
                    form.category === opt.value
                      ? 'bg-neon-green/10 border-neon-green/40 text-neon-green'
                      : 'bg-surface-3 border-surface-4 text-muted-foreground hover:border-white/20'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label-field">Arena de Origem</label>
            <input type="text" value={form.arena_origin} onChange={e => update('arena_origin', e.target.value)}
              placeholder="Copa Sementes, Arena X..." className="input-field mt-1.5" />
          </div>

          <div>
            <label className="label-field">Observações</label>
            <textarea value={form.observations} onChange={e => update('observations', e.target.value)}
              placeholder="Informações adicionais..." rows={2} className="input-field mt-1.5 resize-none" />
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !form.name}
          className="w-full btn-neon rounded-xl py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Cadastrar Atleta
        </button>
      </form>
    </div>
  )
}
