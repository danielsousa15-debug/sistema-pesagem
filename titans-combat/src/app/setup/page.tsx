'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2 } from 'lucide-react'
import Image from 'next/image'

const TENANT_ID = '00000000-0000-0000-0000-000000000001'

export default function SetupPage() {
  const supabase = createClient()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirm) { setError('As senhas não coincidem.'); return }
    if (form.password.length < 6) { setError('Senha deve ter ao menos 6 caracteres.'); return }

    setLoading(true)
    setError('')

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { name: form.name } },
    })

    if (signUpError || !data.user) {
      setError(signUpError?.message ?? 'Erro ao criar conta.')
      setLoading(false)
      return
    }

    // Update profile with tenant and name
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ tenant_id: TENANT_ID, name: form.name, role: 'admin' })
      .eq('id', data.user.id)

    if (profileError) {
      setError('Conta criada, mas erro ao configurar perfil: ' + profileError.message)
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
        <div className="card p-8 text-center max-w-sm w-full fade-in">
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
            <CheckCircle2 size={32} className="text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold mb-2">Conta criada!</h2>
          <p className="text-zinc-400 text-sm mb-6">
            Verifique seu email para confirmar a conta, depois acesse o sistema.
          </p>
          <a href="/login" className="btn-red w-full justify-center py-3">
            Ir para o Login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-sm fade-in">
        <div className="text-center mb-8">
          <Image src="/logo.png" alt="Titãs Combat" width={96} height={96} className="rounded-full mx-auto mb-4 ring-2 ring-[#dc2626]/30" />
          <h1 className="text-2xl font-bold tracking-tight">TITÃS COMBAT</h1>
          <p className="text-sm text-zinc-400 mt-1">Criar conta de administrador</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Nome</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} className="input-field" placeholder="Seu nome" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="input-field" placeholder="admin@titas.com" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Senha</label>
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)} className="input-field" placeholder="Mínimo 6 caracteres" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Confirmar Senha</label>
              <input type="password" value={form.confirm} onChange={e => set('confirm', e.target.value)} className="input-field" placeholder="Repita a senha" required />
            </div>
            {error && (
              <p className="text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg px-3 py-2">{error}</p>
            )}
            <button type="submit" disabled={loading} className="btn-red w-full justify-center py-3 mt-2">
              {loading ? 'Criando conta...' : 'Criar Conta Admin'}
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-zinc-600 mt-4">
          Já tem conta? <a href="/login" className="text-[#dc2626] hover:underline">Fazer login</a>
        </p>
      </div>
    </div>
  )
}
