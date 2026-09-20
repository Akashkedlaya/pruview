'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import ThemeSwitcher from './ThemeSwitcher'
import { getStoredUser } from '../../permissions'

const navItems = [
  {
    label: 'Dashboard',
    path: '/admin/crm',
    permission: 'dashboard.read',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    )
  },
  {
    label: 'Calendar View',
    path: '/admin/crm/calendar',
    permission: 'calendar.read',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    )
  },
  {
    label: 'Photographers',
    path: '/admin/crm/photographers',
    permission: 'photographers.read',
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
    permission: 'enquiries.read',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    )
  },
  {
    label: 'Post Production',
    path: '/admin/crm/post-production',
    permission: 'postproduction.read',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
      </svg>
    )
  },
  {
    label: 'Invoices',
    path: '/admin/crm/invoices',
    permission: 'invoices.read',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    )
  },
  {
    label: 'Completed',
    path: '/admin/crm/completed',
    permission: 'completed.read',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    )
  },
  {
    label: 'Users',
    path: '/admin/crm/users',
    permission: 'users.read',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    )
  },
]


export default function Sidebar() {
  const router   = useRouter()
  const pathname = usePathname()
  const [permissions, setPermissions] = useState<string[]>([])

  useEffect(() => {
    setPermissions(getStoredUser()?.permissions ?? [])
  }, [])

  const visibleItems = navItems.filter(item => permissions.includes(item.permission))

  return (
    <div className="w-56 min-h-screen bg-[var(--pv-card)] border-r border-[var(--pv-border)] flex flex-col fixed left-0 top-0 z-40">

      {/* Logo */}
      <div className="px-6 py-6 border-b border-[var(--pv-border)]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[var(--pv-accent)] rounded-lg flex items-center justify-center">
            <span className="text-[var(--pv-accent-on)] text-xs font-bold">P</span>
          </div>
          <span className="font-semibold text-[var(--pv-text)] text-sm">
            pru<span className="text-[var(--pv-accent)]">view</span>
          </span>
        </div>
        <p className="text-[var(--pv-muted)] text-xs mt-1 ml-10">CRM</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4">
        {visibleItems.map(item => {
          const isActive = pathname === item.path ||
            (item.path !== '/admin/crm' && pathname.startsWith(item.path))
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm mb-1 transition-all text-left"
              style={isActive
                ? { backgroundColor: 'var(--pv-accent-active-bg)', color: 'var(--pv-accent-active-text)', fontWeight: 600 }
                : { color: 'var(--pv-muted)' }
              }
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.backgroundColor = 'var(--pv-accent-tint-hover)'; e.currentTarget.style.color = 'var(--pv-text)' } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = 'var(--pv-muted)' } }}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-[var(--pv-border)] space-y-2">
        <ThemeSwitcher />
        <button
          onClick={() => router.push('/admin/crm')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--pv-muted)] hover:text-[var(--pv-text)] hover:bg-[var(--pv-accent-tint-hover)] transition-all text-left"
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