'use client'

import { useRouter, usePathname } from 'next/navigation'

const navItems = [
  {
    label: 'Dashboard',
    path: '/admin/crm',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    )
  },
  {
    label: 'Calendar View',
    path: '/admin/crm/calendar',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    )
  },
  {
    label: 'Photographers',
    path: '/admin/crm/photographers',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
        <circle cx="12" cy="13" r="4"/>
      </svg>
    )
  },
  {
    label: 'Enquiries',
    path: '/admin/crm/enquiries',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    )
  },
  {
    label: 'Pending Actions',
    path: '/admin/crm/pending',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    )
  },
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

      {/* Nav */}
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
              <span className="flex-shrink-0">{item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-[#ede9fe]">
        <button
          onClick={() => router.push('/admin/crm')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#aaa] hover:text-[#666] hover:bg-[#f5f3ff] transition-all text-left"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Back to Home
        </button>
      </div>
    </div>
  )
}