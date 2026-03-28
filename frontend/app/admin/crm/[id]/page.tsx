'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

type Photographer = { id: number; name: string; phone: string; specialization?: string }
type Booking      = { id: number; slot: string; eventName: string; location?: string; photographer: Photographer }
type EventDay     = { id: number; dayNumber: number; date: string; bookings: Booking[] }
type Event        = { id: number; coupleName: string; startDate: string; endDate: string; location?: string; days: EventDay[] }

const SLOTS = [
  { key: 'MORNING',   label: 'Morning',   time: '09:00 AM - 01:00 PM', icon: '☀️' },
  { key: 'AFTERNOON', label: 'Afternoon', time: '02:00 PM - 05:00 PM', icon: '🌤️' },
  { key: 'EVENING',   label: 'Evening',   time: '06:00 PM - 11:00 PM', icon: '🌙' },
]

const EVENT_NAMES = ['Haldi Ceremony', 'Mehendi', 'Sangeet', 'Wedding Ceremony', 'Reception', 'Engagement', 'Welcome Dinner', 'Portraits', 'Other']

export default function EventDetail() {
  const router = useRouter()
  const { id } = useParams()

  const [event, setEvent]                   = useState<Event | null>(null)
  const [photographers, setPhotographers]   = useState<Photographer[]>([])
  const [activeDay, setActiveDay]           = useState(0)
  const [activeSlot, setActiveSlot]         = useState<string | null>(null)
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState('')
  const [addingDay, setAddingDay]           = useState(false)

  // Booking form
  const [selectedEvent, setSelectedEvent]               = useState('')
  const [selectedPhotographers, setSelectedPhotographers] = useState<number[]>([])
  const [bookingLocation, setBookingLocation]           = useState('')
  const [saving, setSaving]                             = useState(false)
  const [whatsappLinks, setWhatsappLinks]               = useState<{name: string; url: string}[]>([])

  const API = process.env.NEXT_PUBLIC_API_URL
  function getToken() { return localStorage.getItem('pruview_token') }

  async function loadData() {
    try {
      const [eventRes, photosRes] = await Promise.all([
        fetch(`${API}/api/crm/events/${id}`, { headers: { Authorization: `Bearer ${getToken()}` } }),
        fetch(`${API}/api/crm/photographers`,  { headers: { Authorization: `Bearer ${getToken()}` } })
      ])
      if (eventRes.status === 401) { router.push('/admin/login'); return }
      if (eventRes.status === 404) { router.push('/admin/crm'); return }
      const eventData = await eventRes.json()
      setEvent(eventData)
      setPhotographers(await photosRes.json())
    } catch { setError('Could not load event.') }
    finally   { setLoading(false) }
  }

  async function deleteEvent() {
    if (!confirm(`Delete "${event?.coupleName}"? This cannot be undone.`)) return
    await fetch(`${API}/api/crm/events/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } })
    router.push('/admin/crm')
  }

  async function addDay() {
    if (!event) return
    setAddingDay(true)
    try {
      const lastDay  = event.days[event.days.length - 1]
      const nextDate = new Date(lastDay.date)
      nextDate.setDate(nextDate.getDate() + 1)
      const res  = await fetch(`${API}/api/crm/events/${id}/days`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ dayNumber: event.days.length + 1, date: nextDate.toISOString() })
      })
      const newDay = await res.json()
      setEvent(prev => prev ? { ...prev, days: [...prev.days, { ...newDay, bookings: [] }] } : prev)
      setActiveDay(event.days.length)
    } catch { setError('Could not add day.') }
    finally   { setAddingDay(false) }
  }

  function selectSlot(slot: string) {
    setActiveSlot(slot)
    setSelectedEvent('')
    setSelectedPhotographers([])
    setBookingLocation('')
    setError('')
  }

  function togglePhotographer(pid: number) {
    setSelectedPhotographers(prev => prev.includes(pid) ? prev.filter(p => p !== pid) : [...prev, pid])
  }

  function getBookingsForSlot(day: EventDay, slot: string) {
    return day.bookings.filter(b => b.slot === slot)
  }

  async function saveBooking(notify: boolean) {
    if (!selectedEvent || selectedPhotographers.length === 0 || !event) return
    const day = event.days[activeDay]
    if (!day) return
    setSaving(true)
    try {
      const results: any[] = []
      for (const photographerId of selectedPhotographers) {
        const res  = await fetch(`${API}/api/crm/bookings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify({ eventDayId: day.id, slot: activeSlot, eventName: selectedEvent, photographerId, location: bookingLocation || null })
        })
        if (!res.ok) { const d = await res.json(); setError(d.message); setSaving(false); return }
        const booking = await res.json()
        const photographer = photographers.find(p => p.id === photographerId)!
        results.push({ ...booking, photographer })
      }

      setEvent(prev => {
        if (!prev) return prev
        return {
          ...prev,
          days: prev.days.map((d, i) => {
            if (i !== activeDay) return d
            return { ...d, bookings: [...d.bookings, ...results] }
          })
        }
      })

      if (notify) {
        const slotInfo = SLOTS.find(s => s.key === activeSlot)!
        const dateStr  = new Date(day.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
        const links = selectedPhotographers.map(pid => {
          const p   = photographers.find(ph => ph.id === pid)!
          const msg = `Hi ${p.name},\n\nYou have been assigned for a photography booking:\n\n📸 Event: ${selectedEvent}\n📅 Date: ${dateStr}\n🕐 Time: ${slotInfo.label} (${slotInfo.time})\n💑 Client: ${event.coupleName}\n📍 Location: ${bookingLocation || event.location || 'TBD'}\n\nPlease confirm your availability.\n\nThank you!\nPruview CRM`
          return { name: p.name, url: `https://wa.me/${p.phone}?text=${encodeURIComponent(msg)}` }
        })
        setWhatsappLinks(links)
      }

      setActiveSlot(null)
      setSelectedEvent('')
      setSelectedPhotographers([])
      setBookingLocation('')
    } catch { setError('Could not save booking.') }
    finally   { setSaving(false) }
  }

  async function cancelBooking(bookingId: number, dayIndex: number) {
    if (!confirm('Cancel this booking?')) return
    await fetch(`${API}/api/crm/bookings/${bookingId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } })
    setEvent(prev => {
      if (!prev) return prev
      return {
        ...prev,
        days: prev.days.map((d, i) => {
          if (i !== dayIndex) return d
          return { ...d, bookings: d.bookings.filter(b => b.id !== bookingId) }
        })
      }
    })
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  function formatFullDate(start: string, end: string) {
    const s = new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const e = new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    return `${s} - ${e}`
  }

  useEffect(() => { loadData() }, [id])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f3ff' }}>
      <p className="text-[#888]">Loading…</p>
    </div>
  )
  if (!event) return null

  const currentDay = event.days[activeDay]

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f3ff' }}>

      {/* Header */}
      <div className="bg-white border-b border-[#ede9fe] px-8 py-5">
        <div className="flex items-center gap-4 mb-1">
          <button onClick={() => router.push('/admin/crm')}
            className="w-8 h-8 flex items-center justify-center border border-[#e8e5e0] rounded-lg text-[#666] hover:bg-[#f5f3ff] transition-all">
            ←
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-[#0f0f0f]">
              {event.coupleName}
            </h1>
            <p className="text-[#888] text-sm">
              Edit Event Schedule • {formatFullDate(event.startDate, event.endDate)}
            </p>
          </div>
          <button onClick={deleteEvent} className="text-sm text-red-400 hover:text-red-600 transition-colors">
            Delete Event
          </button>
        </div>
      </div>

      <div className="px-8 py-6 max-w-7xl mx-auto">

        {/* Day tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {event.days.map((day, index) => (
            <button key={day.id} onClick={() => { setActiveDay(index); setActiveSlot(null) }}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                activeDay === index
                  ? 'bg-[#0f0f0f] text-white'
                  : 'bg-white text-[#666] border border-[#e8e5e0] hover:border-[#7c3aed]'
              }`}
            >
              Day {day.dayNumber}: {formatDate(day.date)}
            </button>
          ))}
          <button onClick={addDay} disabled={addingDay}
            className="px-5 py-2.5 rounded-full text-sm font-semibold border border-dashed border-[#7c3aed] text-[#7c3aed] hover:bg-[#f5f3ff] transition-all whitespace-nowrap disabled:opacity-40"
          >
            {addingDay ? '…' : '+ Add Day'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm mb-4">
            {error}
          </div>
        )}

        {/* Split panel */}
        <div className="grid grid-cols-5 gap-5">

          {/* Left — Slot list */}
          <div className="col-span-3">
            <p className="text-sm font-semibold text-[#888] mb-3">Select a time slot to edit</p>
            <div className="flex flex-col gap-3">
              {SLOTS.map(slot => {
                const slotBookings = currentDay ? getBookingsForSlot(currentDay, slot.key) : []
                const isSelected   = activeSlot === slot.key
                return (
                  <div key={slot.key}
                    onClick={() => selectSlot(slot.key)}
                    className={`bg-white rounded-2xl border p-5 cursor-pointer transition-all ${
                      isSelected ? 'border-[#7c3aed] ring-2 ring-[#ede9fe]' : 'border-[#e8e5e0] hover:border-[#7c3aed]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                          isSelected ? 'bg-[#7c3aed] text-white' : 'bg-[#f5f3ff]'
                        }`}>
                          {slot.icon}
                        </div>
                        <div>
                          <p className="text-xs text-[#888] uppercase tracking-wide font-medium">
                            {slot.label} • {slot.time}
                          </p>
                          {slotBookings.length > 0 ? (
                            <p className="font-semibold text-[#0f0f0f] mt-0.5">
                              {slotBookings[0].eventName}
                            </p>
                          ) : (
                            <p className="text-[#aaa] mt-0.5">Unassigned</p>
                          )}
                        </div>
                      </div>
                      {slotBookings.length > 0 ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                          {slotBookings.length} Photographer{slotBookings.length > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-[#f5f3ff] text-[#aaa] text-xs font-medium rounded-full">
                          Available
                        </span>
                      )}
                    </div>

                    {/* Show existing bookings */}
                    {slotBookings.length > 0 && isSelected && (
                      <div className="mt-3 pt-3 border-t border-[#f0ede8] flex flex-wrap gap-2">
                        {slotBookings.map(b => (
                          <div key={b.id} className="flex items-center gap-2 bg-[#f5f3ff] px-3 py-1.5 rounded-full text-xs">
                            <span className="font-medium text-[#7c3aed]">{b.photographer.name}</span>
                            <button onClick={e => { e.stopPropagation(); cancelBooking(b.id, activeDay) }}
                              className="text-[#aaa] hover:text-red-500 transition-colors">
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right — Slot details form */}
          <div className="col-span-2">
            {activeSlot ? (
              <div className="bg-white rounded-2xl border border-[#ede9fe] p-6 sticky top-6">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-[#0f0f0f]">
                    {SLOTS.find(s => s.key === activeSlot)?.label} Slot Details
                  </h3>
                  <button onClick={() => setActiveSlot(null)} className="text-[#aaa] hover:text-[#333] transition-colors">
                    ···
                  </button>
                </div>
                <p className="text-xs text-[#7c3aed] font-medium mb-5 bg-[#ede9fe] inline-block px-2 py-0.5 rounded">
                  {SLOTS.find(s => s.key === activeSlot)?.time}
                </p>

                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#333] mb-1.5">Event Name</label>
                    <select value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}
                      className="w-full px-4 py-2.5 border border-[#e8e5e0] rounded-xl text-sm text-[#0f0f0f] focus:outline-none focus:border-[#7c3aed] transition-all"
                    >
                      <option value="">Select event type...</option>
                      {EVENT_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#333] mb-1.5">Assigned Photographers</label>
                    <div className="border border-[#e8e5e0] rounded-xl p-3 min-h-[50px]">
                      {selectedPhotographers.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {selectedPhotographers.map(pid => {
                            const p = photographers.find(ph => ph.id === pid)
                            return (
                              <div key={pid} className="flex items-center gap-1 bg-[#ede9fe] text-[#7c3aed] px-2.5 py-1 rounded-full text-xs font-medium">
                                <span className="w-4 h-4 bg-[#7c3aed] text-white rounded-full flex items-center justify-center text-[10px]">
                                  {p?.name[0]}
                                </span>
                                <span>{p?.name.split(' ')[0]} {p?.name.split(' ')[1]?.[0]}.</span>
                                <button onClick={() => togglePhotographer(pid)} className="hover:text-red-500 ml-0.5">×</button>
                              </div>
                            )
                          })}
                          <button
                            onClick={() => {}}
                            className="text-xs text-[#7c3aed] font-medium hover:underline"
                          >
                            + Add more
                          </button>
                        </div>
                      )}
                      <select
                        onChange={e => { if (e.target.value) { togglePhotographer(parseInt(e.target.value)); e.target.value = '' }}}
                        className="w-full text-sm text-[#666] focus:outline-none bg-transparent"
                        defaultValue=""
                      >
                        <option value="" disabled>
                          {selectedPhotographers.length === 0 ? 'Select photographers...' : 'Add more...'}
                        </option>
                        {photographers.filter(p => !selectedPhotographers.includes(p.id)).map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#333] mb-1.5">
                      Location <span className="text-[#aaa] font-normal">(Optional)</span>
                    </label>
                    <input type="text" value={bookingLocation} onChange={e => setBookingLocation(e.target.value)}
                      placeholder="Poolside Courtyard, The Ritz-Carlton"
                      className="w-full px-4 py-2.5 border border-[#e8e5e0] rounded-xl text-sm text-[#0f0f0f] focus:outline-none focus:border-[#7c3aed] transition-all"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button onClick={() => setActiveSlot(null)}
                      className="text-sm text-[#888] hover:text-[#333] transition-colors">
                      Cancel
                    </button>
                    <div className="flex gap-2">
                      <button onClick={() => saveBooking(false)}
                        disabled={saving || !selectedEvent || selectedPhotographers.length === 0}
                        className="px-4 py-2 border border-[#e8e5e0] text-sm font-semibold text-[#333] rounded-xl hover:border-[#7c3aed] hover:text-[#7c3aed] disabled:opacity-40 transition-all"
                      >
                        Book
                      </button>
                      <button onClick={() => saveBooking(true)}
                        disabled={saving || !selectedEvent || selectedPhotographers.length === 0}
                        className="px-4 py-2 bg-[#7c3aed] text-white text-sm font-semibold rounded-xl hover:bg-[#6d28d9] disabled:opacity-40 transition-all flex items-center gap-1.5"
                      >
                        📲 Book & Notify
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-dashed border-[#ede9fe] p-8 text-center h-fit">
                <p className="text-3xl mb-3">👈</p>
                <p className="text-[#888] text-sm">Select a time slot on the left to view details and assign photographers</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* WhatsApp confirmation */}
      {whatsappLinks.length > 0 && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-3">✅</div>
              <h2 className="text-xl font-bold text-[#0f0f0f]">Booking Confirmed</h2>
              <p className="text-[#888] text-sm mt-1">Send WhatsApp notifications to each photographer</p>
            </div>
            <div className="flex flex-col gap-3 mb-5">
              {whatsappLinks.map((link, i) => (
                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-all"
                >
                  <span className="text-xl">📲</span>
                  <div>
                    <p className="text-sm font-semibold text-green-800">Send to {link.name}</p>
                    <p className="text-xs text-green-600">Click to open WhatsApp</p>
                  </div>
                </a>
              ))}
            </div>
            <button onClick={() => setWhatsappLinks([])}
              className="w-full py-3 bg-[#7c3aed] text-white text-sm font-semibold rounded-xl hover:bg-[#6d28d9] transition-all">
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}