'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'
import { getInitials } from '@/lib/utils'
import { User, Save, Loader2, Shield, LogOut } from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [form, setForm] = useState({ full_name: '', phone: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('*').eq('id', user.id).single()
        .then(({ data }) => {
          if (data) {
            setProfile(data)
            setForm({ full_name: data.full_name ?? '', phone: data.phone ?? '' })
          }
          setLoading(false)
        })
    })
  }, [supabase])

  async function save() {
    if (!profile) return
    setSaving(true)
    await supabase.from('profiles').update(form).eq('id', profile.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const ROLE_LABELS: Record<string, string> = {
    admin: 'Administrador', operator: 'Operador', athlete: 'Atleta'
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-neon-green border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-md mx-auto space-y-5 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold">Meu Perfil</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Configurações da conta</p>
      </div>

      {/* Avatar */}
      <div className="card-surface p-6 flex flex-col items-center gap-3">
        <div className="w-20 h-20 rounded-full bg-neon-green/10 border-2 border-neon-green/30 flex items-center justify-center text-2xl font-bold text-neon-green">
          {profile ? getInitials(profile.full_name ?? profile.email) : '?'}
        </div>
        <div className="text-center">
          <p className="font-semibold">{profile?.full_name ?? 'Sem nome'}</p>
          <p className="text-sm text-muted-foreground">{profile?.email}</p>
          <div className="mt-2 flex items-center justify-center gap-1.5">
            <Shield className="w-3 h-3 text-neon-green" />
            <span className="text-xs text-neon-green font-medium">
              {ROLE_LABELS[profile?.role ?? 'athlete']}
            </span>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div className="card-surface p-5 space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Editar Dados
        </h2>
        <div>
          <label className="label-field">Nome</label>
          <input
            type="text"
            value={form.full_name}
            onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
            placeholder="Seu nome completo"
            className="input-field mt-1.5"
          />
        </div>
        <div>
          <label className="label-field">Telefone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            placeholder="(00) 00000-0000"
            className="input-field mt-1.5"
          />
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="w-full btn-neon rounded-xl py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saved ? 'Salvo!' : 'Salvar Alterações'}
        </button>
      </div>

      <button
        onClick={logout}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all text-sm"
      >
        <LogOut className="w-4 h-4" />
        Sair da conta
      </button>
    </div>
  )
}
