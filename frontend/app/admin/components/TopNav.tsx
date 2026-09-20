'use client'

import { useRouter, usePathname } from 'next/navigation'
import { clearStoredUser } from '../permissions'

export default function TopNav() {
  const router   = useRouter()
  const pathname = usePathname()

  const isGalleryActive = pathname === '/admin' || pathname.startsWith('/admin/folders')
  const isCrmActive     = pathname.startsWith('/admin/crm')

  function logout() {
    localStorage.removeItem('pruview_token')
    document.cookie = 'pruview_token=; path=/; max-age=0'
    clearStoredUser()
    // Hard navigation (not router.push) so no authenticated state or
    // cached page data survives in memory, and back-navigation lands on
    // a fresh unauthenticated request rather than a bfcached CRM page.
    window.location.href = '/'
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-[var(--pv-ink)] px-8 flex items-center justify-between">
      <span className="text-white text-xl font-semibold">
        pru<span className="text-[var(--pv-accent)]">view</span>
      </span>
      <div className="flex items-center gap-6">
        {isGalleryActive ? (
          <span className="text-white text-sm font-semibold">Gallery</span>
        ) : (
          <button onClick={() => router.push('/admin')} className="text-white/50 hover:text-white text-sm transition-colors">
            Gallery
          </button>
        )}
        {isCrmActive ? (
          <span className="text-white text-sm font-semibold">CRM</span>
        ) : (
          <button onClick={() => router.push('/admin/crm')} className="text-white/50 hover:text-white text-sm transition-colors">
            CRM
          </button>
        )}
        <button onClick={logout} className="text-white/50 hover:text-white text-sm transition-colors">
          Sign out
        </button>
      </div>
    </nav>
  )
}
