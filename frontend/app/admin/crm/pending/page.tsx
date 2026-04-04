'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Event = {
  id: number
  coupleName: string
  startDate: string
  endDate: string
  location?: string
  status: string
  notes?: string
  days: any[]
}

const STATUS_OPTIONS = [
  { value: 'PENDING',           label: 'Pending',            color: 'bg-red-100 text-red-600 border-red-200' },
  { value: 'PARTIALLY_PENDING', label: 'Partially Pending',  color: 'bg-orange-100 text-orange-600 border-orange-200' },
  { value: 'COMPLETED',         label: 'Completed',          color: 'bg-green-100 text-green-600 border-green-200' },
]

export default function PendingActionsPage() {
  const router = useRouter()
  const [events, setEvents]           = useState<Event[]>([])
  const [loading, setLoading]         = useState(true)
  const [savingId, setSavingId]       = useState<number | null>(null)
  const [pendingUpdates, setPendingUpdates] = useState<Record<number, { status: string; notes: string }>>({})

  const API = process.env.NEXT_PUBLIC_API_URL

  function getToken() {
    return localStorage.getItem('pruview_token')
  }

  async function loadEvents() {
    try {
      const res = await fetch(`${API}/api/crm/events`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      if (res.status === 401) { router.push('/admin/login'); return }
      const data = await res.json()
      // Only past events
      const past = data.filter((e: Event) => new Date(e.endDate) < new Date())
      setEvents(past)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function getPendingValue(id: number, field: 'status' | 'notes', fallback: string) {
    return pendingUpdates[id]?.[field] ?? fallback
  }

  function handleChange(id: number, field: 'status' | 'notes', value: string, current: Event) {
    setPendingUpdates(prev => ({
      ...prev,
      [id]: {
        status: field === 'status' ? value : (prev[id]?.status ?? current.status ?? 'PENDING'),
        notes:  field === 'notes'  ? value : (prev[id]?.notes  ?? current.notes  ?? ''),
      }
    }))
  }

  function isDirty(event: Event) {
    const u = pendingUpdates[event.id]
    if (!u) return false
    return u.status !== (event.status || 'PENDING') || u.notes !== (event.notes || '')
  }

  async function saveEvent(event: Event) {
  const update = pendingUpdates[event.id]
  if (!update) return
  setSavingId(event.id)
  try {
    const res = await fetch(`${API}/api/crm/events/${event.id}/action`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body:    JSON.stringify({
        actionStatus: update.status,
        actionNotes:  update.notes
      })
    })
      const data = await res.json()
      setEvents(prev => prev.map(e => e.id === event.id ? { ...e, ...data } : e))
      setPendingUpdates(prev => { const n = { ...prev }; delete n[event.id]; return n })
    } catch (err) {
      console.error(err)
    } finally {
      setSavingId(null)
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  function getDaysAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    return days === 0 ? 'today' : `${days} day${days > 1 ? 's' : ''} ago`
  }

  function getStatusStyle(status: string) {
    return STATUS_OPTIONS.find(s => s.value === status)?.color || 'bg-gray-100 text-gray-600 border-gray-200'
  }

  function getStatusLabel(status: string) {
    return STATUS_OPTIONS.find(s => s.value === status)?.label || 'Pending'
  }

  useEffect(() => { loadEvents() }, [])

  const completedCount        = events.filter(e => e.status === 'COMPLETED').length
  const pendingCount          = events.filter(e => e.status === 'PENDING' || !e.status).length
  const partiallyPendingCount = events.filter(e => e.status === 'PARTIALLY_PENDING').length

  return (
    <div className="p-8">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0f0f0f]">Pending Actions</h1>
        <p className="text-[#888] text-sm mt-1">Past events that need status updates and notes</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-[#ede9fe] rounded-2xl p-5">
          <p className="text-3xl font-bold text-red-500">{pendingCount}</p>
          <p className="text-sm text-[#888] mt-1">Pending</p>
        </div>
        <div className="bg-white border border-[#ede9fe] rounded-2xl p-5">
          <p className="text-3xl font-bold text-orange-500">{partiallyPendingCount}</p>
          <p className="text-sm text-[#888] mt-1">Partially Pending</p>
        </div>
        <div className="bg-white border border-[#ede9fe] rounded-2xl p-5">
          <p className="text-3xl font-bold text-green-500">{completedCount}</p>
          <p className="text-sm text-[#888] mt-1">Completed</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-[#888]">Loading…</div>
      ) : events.length === 0 ? (
        <div className="text-center py-24 bg-white border border-[#ede9fe] rounded-2xl">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <p className="font-semibold text-[#333]">All caught up!</p>
          <p className="text-sm text-[#888] mt-1">No past events need attention.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {events.map(event => {
            const currentStatus = getPendingValue(event.id, 'status', event.status || 'PENDING')
            const currentNotes  = getPendingValue(event.id, 'notes',  event.notes  || '')
            const dirty         = isDirty(event)

            return (
              <div
                key={event.id}
                className={`bg-white border rounded-2xl p-6 transition-all ${
                  dirty ? 'border-[#7c3aed] ring-1 ring-[#7c3aed]' : 'border-[#e8e5e0]'
                }`}
              >
                <div className="flex items-start justify-between gap-6 flex-wrap">

                  {/* Event info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h3 className="font-bold text-[#0f0f0f] text-lg">{event.coupleName}</h3>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(event.status)}`}>
                        {getStatusLabel(event.status)}
                      </span>
                    </div>
                    <p className="text-sm text-[#888]">
                      {formatDate(event.startDate)} – {formatDate(event.endDate)}
                      {event.location && ` · ${event.location}`}
                    </p>
                    <p className="text-xs text-[#aaa] mt-0.5">
                      Ended {getDaysAgo(event.endDate)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <button
                      onClick={() => router.push(`/admin/crm/${event.id}`)}
                      className="px-4 py-2 border border-[#e8e5e0] text-sm text-[#666] rounded-lg hover:border-[#7c3aed] hover:text-[#7c3aed] transition-all"
                    >
                      View Event
                    </button>
                  </div>
                </div>

                {/* Status + Notes */}
                <div className="mt-5 pt-5 border-t border-[#f5f3ff] grid grid-cols-2 gap-4">

                  {/* Status select */}
                  <div>
                    <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
                      Update Status
                    </label>
                    <div className="flex gap-2">
                      {STATUS_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => handleChange(event.id, 'status', opt.value, event)}
                          className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                            currentStatus === opt.value
                              ? opt.color
                              : 'border-[#e8e5e0] text-[#888] hover:border-[#7c3aed]'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
                      Notes
                    </label>
                    <input
                      type="text"
                      value={currentNotes}
                      onChange={e => handleChange(event.id, 'notes', e.target.value, event)}
                      placeholder="Add notes about this event..."
                      className="w-full px-3 py-2 border border-[#e8e5e0] rounded-lg text-sm text-[#0f0f0f] focus:outline-none focus:border-[#7c3aed] transition-all"
                    />
                  </div>
                </div>

                {/* Save button */}
                {dirty && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => saveEvent(event)}
                      disabled={savingId === event.id}
                      className="px-5 py-2 bg-[#7c3aed] text-white text-sm font-semibold rounded-lg hover:bg-[#6d28d9] disabled:opacity-40 transition-all"
                    >
                      {savingId === event.id ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}