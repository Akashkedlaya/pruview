'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Photographer = {
  id: number
  name: string
  phone: string
  specialization?: string
}

type Event = {
  id: number
  coupleName: string
  startDate: string
  endDate: string
  location?: string
  days: any[]
}

export default function CRMHome() {
  const router = useRouter()
  const [events, setEvents]             = useState<Event[]>([])
  const [photographers, setPhotographers] = useState<Photographer[]>([])
  const [loading, setLoading]           = useState(true)
  const [showAddPhotographer, setShowAddPhotographer] = useState(false)
  const [newName, setNewName]           = useState('')
  const [newPhone, setNewPhone]         = useState('')
  const [newSpec, setNewSpec]           = useState('')
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState('')

  const API = process.env.NEXT_PUBLIC_API_URL

  function getToken() {
    return localStorage.getItem('pruview_token')
  }

  async function loadData() {
    try {
      const [eventsRes, photographersRes] = await Promise.all([
        fetch(`${API}/api/crm/events`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        }),
        fetch(`${API}/api/crm/photographers`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        })
      ])
      if (eventsRes.status === 401) { router.push('/admin/login'); return }
      setEvents(await eventsRes.json())
      setPhotographers(await photographersRes.json())
    } catch (err) {
      setError('Could not load data.')
    } finally {
      setLoading(false)
    }
  }

  async function addPhotographer() {
    if (!newName.trim() || !newPhone.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`${API}/api/crm/photographers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          name: newName.trim(),
          phone: newPhone.trim(),
          specialization: newSpec.trim()
        })
      })
      const data = await res.json()
      setPhotographers([...photographers, data])
      setNewName('')
      setNewPhone('')
      setNewSpec('')
      setShowAddPhotographer(false)
    } catch (err) {
      setError('Could not add photographer.')
    } finally {
      setSaving(false)
    }
  }

  async function deletePhotographer(id: number) {
    if (!confirm('Delete this photographer?')) return
    await fetch(`${API}/api/crm/photographers/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    setPhotographers(photographers.filter(p => p.id !== id))
  }

  async function deleteEvent(id: number) {
    if (!confirm('Delete this event?')) return
    await fetch(`${API}/api/crm/events/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    setEvents(events.filter(e => e.id !== id))
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  function isUpcoming(date: string) {
    return new Date(date) >= new Date()
  }

  const upcomingEvents = events.filter(e => isUpcoming(e.endDate))
  const pastEvents     = events.filter(e => !isUpcoming(e.endDate))

  useEffect(() => { loadData() }, [])

  return (
    <div className="min-h-screen bg-[#f8f7f4]">

      {/* Nav */}
      <nav className="bg-[#0f0f0f] px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button onClick={() => router.push('/admin')}
            className="text-[#666] hover:text-white text-sm transition-colors">
            ← Back
          </button>
          <span className="text-white text-xl font-semibold" style={{ fontFamily: 'Georgia, serif' }}>
            pru<span className="text-[#e8c547]">view</span>
            <span className="text-[#666] text-sm ml-3">/ CRM</span>
          </span>
        </div>
        <button
          onClick={() => router.push('/admin/crm/calendar')}
          className="text-[#666] hover:text-white text-sm transition-colors">
          📅 Calendar View
        </button>
      </nav>

      <div className="max-w-5xl mx-auto px-8 py-12">

        {/* Header */}
        <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-[#0f0f0f]" style={{ fontFamily: 'Georgia, serif' }}>
              Photography CRM
            </h1>
            <p className="text-[#888] text-sm mt-1">
              {upcomingEvents.length} upcoming events · {photographers.length} photographers
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddPhotographer(true)}
              className="px-5 py-2.5 border border-[#e0ddd8] text-[#333] text-sm font-semibold rounded-xl hover:border-[#c8a020] hover:text-[#c8a020] transition-all"
            >
              + Add Photographer
            </button>
            <button
              onClick={() => router.push('/admin/crm/new')}
              className="px-5 py-2.5 bg-[#0f0f0f] text-white text-sm font-semibold rounded-xl hover:bg-[#222] transition-all"
            >
              + Add New Event
            </button>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mb-6">{error}</p>}

        {/* Add Photographer Modal */}
        {showAddPhotographer && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-8 w-full max-w-md">
              <h2 className="text-xl font-semibold text-[#0f0f0f] mb-6" style={{ fontFamily: 'Georgia, serif' }}>
                Add Photographer
              </h2>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-semibold tracking-widest uppercase text-[#555] mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="Rahul Sharma"
                    className="w-full px-4 py-3 border border-[#e0ddd8] rounded-xl text-sm text-[#0f0f0f] focus:outline-none focus:border-[#c8a020] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-widest uppercase text-[#555] mb-2">
                    WhatsApp Number * (with country code)
                  </label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    placeholder="919876543210"
                    className="w-full px-4 py-3 border border-[#e0ddd8] rounded-xl text-sm text-[#0f0f0f] focus:outline-none focus:border-[#c8a020] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-widest uppercase text-[#555] mb-2">
                    Specialization (optional)
                  </label>
                  <input
                    type="text"
                    value={newSpec}
                    onChange={e => setNewSpec(e.target.value)}
                    placeholder="Wedding / Portrait / Candid"
                    className="w-full px-4 py-3 border border-[#e0ddd8] rounded-xl text-sm text-[#0f0f0f] focus:outline-none focus:border-[#c8a020] transition-all"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddPhotographer(false)}
                  className="flex-1 py-3 border border-[#e0ddd8] text-[#333] text-sm font-semibold rounded-xl hover:bg-[#f8f7f4] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={addPhotographer}
                  disabled={saving || !newName.trim() || !newPhone.trim()}
                  className="flex-1 py-3 bg-[#0f0f0f] text-white text-sm font-semibold rounded-xl hover:bg-[#222] disabled:opacity-40 transition-all"
                >
                  {saving ? 'Saving…' : 'Add Photographer'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Photographers list */}
        {photographers.length > 0 && (
          <div className="bg-white border border-[#e8e5e0] rounded-2xl p-6 mb-8">
            <p className="text-xs font-semibold tracking-widest uppercase text-[#888] mb-4">
              Photographers ({photographers.length})
            </p>
            <div className="flex flex-wrap gap-3">
              {photographers.map(p => (
                <div key={p.id}
                  className="flex items-center gap-3 bg-[#f8f7f4] border border-[#e8e5e0] rounded-xl px-4 py-2">
                  <div>
                    <p className="text-sm font-semibold text-[#0f0f0f]">{p.name}</p>
                    <p className="text-xs text-[#888]">+{p.phone}</p>
                    {p.specialization && (
                      <p className="text-xs text-[#c8a020]">{p.specialization}</p>
                    )}
                  </div>
                  <button
                    onClick={() => deletePhotographer(p.id)}
                    className="text-[#ccc] hover:text-red-400 text-xs transition-colors ml-2"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Events */}
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-widest uppercase text-[#888] mb-4">
            Upcoming Events ({upcomingEvents.length})
          </p>
          {loading ? (
            <p className="text-[#888] text-sm">Loading…</p>
          ) : upcomingEvents.length === 0 ? (
            <div className="bg-white border border-[#e8e5e0] rounded-2xl p-12 text-center">
              <p className="text-4xl mb-4">📅</p>
              <p className="text-[#888] text-sm">No upcoming events. Create your first one.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {upcomingEvents.map(event => (
                <div
                  key={event.id}
                  onClick={() => router.push(`/admin/crm/${event.id}`)}
                  className="bg-white border border-[#e8e5e0] rounded-2xl px-6 py-5 flex items-center gap-4 cursor-pointer hover:border-[#c8a020] transition-all"
                >
                  <div className="w-12 h-12 bg-[#e8c547] rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                    💑
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-[#0f0f0f]">{event.coupleName}</p>
                    <p className="text-xs text-[#888] mt-0.5">
                      {formatDate(event.startDate)} → {formatDate(event.endDate)}
                      {event.location && ` · ${event.location}`}
                    </p>
                    <p className="text-xs text-[#c8a020] mt-0.5">
                      {event.days?.length} days
                    </p>
                  </div>
                  <div className="text-[#ccc] text-xl">›</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-[#888] mb-4">
              Past Events ({pastEvents.length})
            </p>
            <div className="flex flex-col gap-3">
              {pastEvents.map(event => (
                <div
                  key={event.id}
                  onClick={() => router.push(`/admin/crm/${event.id}`)}
                  className="bg-white border border-[#e8e5e0] rounded-2xl px-6 py-5 flex items-center gap-4 cursor-pointer hover:border-[#e0ddd8] transition-all opacity-60"
                >
                  <div className="w-12 h-12 bg-[#e8e5e0] rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                    📷
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-[#0f0f0f]">{event.coupleName}</p>
                    <p className="text-xs text-[#888] mt-0.5">
                      {formatDate(event.startDate)} → {formatDate(event.endDate)}
                    </p>
                  </div>
                  <div className="text-[#ccc] text-xl">›</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}