'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type Notification = {
  id: number
  type: string
  title: string
  message: string
  relatedEnquiryId: number | null
  relatedEventId: number | null
  isRead: boolean
  createdAt: string
  readAt: string | null
}

const POLL_INTERVAL_MS = 30_000

export default function NotificationBell() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const API = process.env.NEXT_PUBLIC_API_URL
  function getToken() { return localStorage.getItem('pruview_token') }

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/notifications`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    } catch (err) {
      console.error(err)
    }
  }, [API])

  useEffect(() => {
    load()
    const interval = setInterval(load, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [load])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function markAsRead(id: number) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
    try {
      await fetch(`${API}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getToken()}` }
      })
    } catch (err) { console.error(err) }
  }

  async function markAllAsRead() {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnreadCount(0)
    try {
      await fetch(`${API}/api/notifications/read-all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getToken()}` }
      })
    } catch (err) { console.error(err) }
  }

  function handleNotificationClick(n: Notification) {
    if (!n.isRead) markAsRead(n.id)
    setOpen(false)
    if (n.type === 'ENQUIRY_FOLLOW_UP') {
      router.push('/admin/crm/enquiries')
    } else if (n.relatedEventId) {
      router.push(`/admin/crm/${n.relatedEventId}`)
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative w-8 h-8 flex items-center justify-center text-white/50 hover:text-white transition-colors"
        title="Notifications"
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[var(--pv-card)] border border-[var(--pv-border)] rounded-xl shadow-lg overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--pv-border)]">
            <p className="font-semibold text-sm text-[var(--pv-text)]">Notifications</p>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs text-[var(--pv-accent)] hover:underline">
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-[var(--pv-muted)] text-center py-8">No notifications yet.</p>
            ) : (
              notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full text-left px-4 py-3 border-b border-[var(--pv-border)] last:border-0 hover:bg-[var(--pv-accent-tint-hover)] transition-colors flex items-start gap-2.5 ${
                    !n.isRead ? 'bg-[var(--pv-accent-tint)]' : ''
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.isRead ? 'bg-[var(--pv-accent)]' : 'bg-transparent'}`} />
                  <span className="flex-1 min-w-0">
                    <span className={`block text-sm ${!n.isRead ? 'font-semibold text-[var(--pv-text)]' : 'text-[var(--pv-text-secondary)]'}`}>
                      {n.message}
                    </span>
                    <span className="block text-xs text-[var(--pv-muted)] mt-0.5">{formatDate(n.createdAt)}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
