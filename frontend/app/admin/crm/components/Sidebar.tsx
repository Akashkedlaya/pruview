'use client'

import { useRouter, usePathname } from 'next/navigation'

const navItems = [
  { label: 'Dashboard',     icon: '🏠', path: '/admin/crm' },
  { label: 'Calendar View', icon: '📅', path: '/admin/crm/calendar' },
  { label: 'Photographers', icon: '📷', path: '/admin/crm/photographers' },
  { label: 'Enquiries',     icon: '💬', path: '/admin/crm/enquiries' },
]

export default function Sidebar() {
  const router   = useRouter()
  const pathname = usePathname()

  return (
    <div className="w-56 min-h-screen bg-white border-r border-[#ede9fe] flex flex-col fixed left-0 top-0 z-40">

      {/* Logo */}
      <div className="px-6 py-6 border-b border-[#ede9fe]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#7c3aed] rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">P</span>
          </div>
          <span className="font-semibold text-[#0f0f0f] text-sm">
            pru<span className="text-[#7c3aed]">view</span>
          </span>
        </div>
        <p className="text-[#aaa] text-xs mt-1 ml-10">CRM</p>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4">
        {navItems.map(item => {
          const isActive = pathname === item.path ||
            (item.path !== '/admin/crm' && pathname.startsWith(item.path))
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm mb-1 transition-all text-left ${
                isActive
                  ? 'bg-[#ede9fe] text-[#7c3aed] font-semibold'
                  : 'text-[#666] hover:bg-[#f5f3ff] hover:text-[#0f0f0f]'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-4 border-t border-[#ede9fe]">
        <button
          onClick={() => router.push('/admin')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#aaa] hover:text-[#666] hover:bg-[#f5f3ff] transition-all text-left"
        >
          <span>←</span>
          Back to Galleries
        </button>
      </div>
    </div>
  )
}