'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Loader2, LogIn } from 'lucide-react'

type Step = 'login' | 'confirm' | 'success'

export default function CheckinPage() {
  const supabase = createClient()
  const [step, setStep] = useState<Step>('login')
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [studentName, setStudentName] = useState('')
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    checkSession()
  }, [])

  async function checkSession() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: student } = await supabase
          .from('students')
          .select('name, status')
          .eq('user_id', user.id)
          .maybeSingle()
        if (student) {
          setStudentName(student.name)
          setStep('confirm')
        } else {
          await supabase.auth.signOut()
          setError('Usuário não encontrado como aluno. Use as credenciais do seu cadastro de aluno.')
          setStep('login')
        }
      }
    } catch {
      // ignore
    }
    setLoading(false)
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Email ou senha inválidos.')
      setLoading(false)
      return
    }
    await checkSession()
    setLoading(false)
  }

  async function handleCheckin() {
    setChecking(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setStep('login'); setChecking(false); return }

    const { data: student } = await supabase
      .from('students')
      .select('id, tenant_id, status')
      .eq('user_id', user.id)
      .single()

    if (!student) {
      setError('Aluno não encontrado.')
      setChecking(false)
      return
    }

    if (student.status === 'cancelado' || student.status === 'inadimplente') {
      setError(`Seu acesso está ${student.status}. Fale com a recepção.`)
      setChecking(false)
      return
    }

    // Check if already checked in today
    const today = new Date().toISOString().split('T')[0]
    const { data: existing } = await supabase
      .from('checkins')
      .select('id')
      .eq('student_id', student.id)
      .gte('checked_at', today)
      .limit(1)
      .maybeSingle()

    if (existing) {
      setStep('success')
      setChecking(false)
      return
    }

    const { error } = await supabase.from('checkins').insert({
      student_id: student.id,
      tenant_id: student.tenant_id,
      device_info: navigator.userAgent.split(' ').slice(-3).join(' '),
      browser_info: navigator.userAgent,
    })

    if (error) {
      setError('Erro ao registrar presença. Tente novamente.')
      setChecking(false)
      return
    }

    setStep('success')
    setChecking(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <Loader2 size={32} className="animate-spin text-[#dc2626]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] px-4">
      {/* Logo */}
      <div className="text-center mb-8">
        <img src="/logo.png" alt="Titãs Combat" width={96} height={96} className="rounded-full mx-auto mb-4 ring-2 ring-[#dc2626]/30" />
        <h1 className="text-3xl font-black tracking-tight">TITÃS COMBAT</h1>
        <p className="text-zinc-500 mt-1">Check-in de presença</p>
      </div>

      <div className="w-full max-w-sm">
        {/* LOGIN */}
        {step === 'login' && (
          <div className="card p-6 fade-in">
            <h2 className="text-center font-bold text-lg mb-5">Entrar para registrar presença</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wide">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="input-field"
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wide">Senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="input-field"
                  autoComplete="current-password"
                />
              </div>
              {error && (
                <p className="text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg px-3 py-2 text-center">
                  {error}
                </p>
              )}
              <button type="submit" disabled={loading} className="btn-red w-full justify-center py-3.5 text-base mt-2">
                <LogIn size={18} />
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          </div>
        )}

        {/* CONFIRM */}
        {step === 'confirm' && (
          <div className="card p-6 text-center fade-in">
            <div className="w-16 h-16 rounded-full bg-[#dc2626]/15 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-black text-[#dc2626]">
                {studentName.split(' ').slice(0,2).map(n => n[0]).join('').toUpperCase()}
              </span>
            </div>
            <p className="text-zinc-400 text-sm mb-1">Olá,</p>
            <p className="text-2xl font-bold mb-6">{studentName.split(' ')[0]}</p>

            {error && (
              <p className="text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg px-3 py-3 mb-4">
                {error}
              </p>
            )}

            <button
              onClick={handleCheckin}
              disabled={checking}
              className="btn-red w-full justify-center py-4 text-lg pulse-red"
            >
              {checking ? (
                <><Loader2 size={20} className="animate-spin" /> Registrando...</>
              ) : (
                <><CheckCircle2 size={20} /> Confirmar Presença</>
              )}
            </button>

            <button
              onClick={() => { supabase.auth.signOut(); setStep('login'); setStudentName(''); setError('') }}
              className="text-xs text-zinc-600 hover:text-zinc-400 mt-4 transition-colors"
            >
              Não sou {studentName.split(' ')[0]}
            </button>
          </div>
        )}

        {/* SUCCESS */}
        {step === 'success' && (
          <div className="card p-8 text-center fade-in">
            <div className="w-20 h-20 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
              <CheckCircle2 size={40} className="text-emerald-400" />
            </div>
            <h2 className="text-2xl font-black text-emerald-400 mb-2">Presença registrada!</h2>
            <p className="text-zinc-300 text-lg font-medium">Bom treino, {studentName.split(' ')[0]}! 💪</p>
            <p className="text-zinc-500 text-sm mt-2">
              {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <button
              onClick={() => { setStep('confirm'); setError('') }}
              className="btn-ghost w-full justify-center mt-6 text-sm"
            >
              Novo check-in
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-zinc-700 mt-8">Titãs Combat © {new Date().getFullYear()}</p>
    </div>
  )
}
