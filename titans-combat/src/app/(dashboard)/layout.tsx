import { Sidebar } from '@/components/layout/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-auto">
        {/* Mobile spacer for the fixed hamburger bar */}
        <div className="h-14 lg:hidden" />
        <div className="px-4 py-5 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
