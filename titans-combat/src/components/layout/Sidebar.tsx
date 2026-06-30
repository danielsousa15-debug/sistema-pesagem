'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Users, Dumbbell, UserCheck,
  CreditCard, DollarSign, Target, QrCode,
  LogOut, Menu, X, ChevronRight, ClipboardList, ShieldAlert
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { href: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/alunos',       label: 'Alunos',       icon: Users },
  { href: '/modalidades',  label: 'Modalidades',  icon: Dumbbell },
  { href: '/professores',  label: 'Professores',  icon: UserCheck },
  { href: '/planos',       label: 'Planos',       icon: CreditCard },
  { href: '/financeiro',   label: 'Financeiro',   icon: DollarSign },
  { href: '/presencas',    label: 'Presenças',    icon: ClipboardList },
  { href: '/leads',        label: 'Leads',        icon: Target },
  { href: '/qrcode',       label: 'QR Code',      icon: QrCode },
  { href: '/diagnostico',  label: 'Diagnóstico',  icon: ShieldAlert },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function NavLink({ href, label, icon: Icon }: typeof navItems[0]) {
    const active = pathname === href || pathname.startsWith(href + '/')
    return (
      <Link
        href={href}
        onClick={() => setOpen(false)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
          active
            ? 'bg-[#dc2626]/15 text-[#dc2626] border border-[#dc2626]/20'
            : 'text-zinc-400 hover:bg-white/5 hover:text-white'
        }`}
      >
        <Icon size={18} className="shrink-0" />
        <span>{label}</span>
        {active && <ChevronRight size={14} className="ml-auto" />}
      </Link>
    )
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Titãs Combat" width={44} height={44} className="rounded-full shrink-0" />
          <div>
            <p className="font-bold text-sm leading-none">TITÃS COMBAT</p>
            <p className="text-xs text-zinc-500 mt-0.5">Gestão</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(item => (
          <NavLink key={item.href} {...item} />
        ))}
      </nav>

      {/* Check-in preview */}
      <div className="px-3 pb-2">
        <Link
          href="/checkin"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:bg-white/5 hover:text-white transition-all border border-dashed border-[#dc2626]/30"
        >
          <QrCode size={18} className="shrink-0 text-[#dc2626]" />
          <span>Ver Check-in</span>
        </Link>
      </div>

      {/* Logout */}
      <div className="px-3 pb-4 border-t border-white/5 pt-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-500 hover:text-red-400 hover:bg-red-950/20 transition-all w-full"
        >
          <LogOut size={18} className="shrink-0" />
          <span>Sair</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-40 lg:hidden bg-[#141414] border border-[#1f1f1f] rounded-lg p-2"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0d0d0d] border-r border-white/5 transform transition-transform lg:hidden ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white"
        >
          <X size={20} />
        </button>
        {sidebarContent}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-56 shrink-0 flex-col bg-[#0d0d0d] border-r border-white/5 min-h-screen">
        {sidebarContent}
      </div>
    </>
  )
}
