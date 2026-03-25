'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

type Photographer = {
  id: number
  name: string
  phone: string
}

type Booking = {
  id: number
  slot: string
  eventName: string
  location?: string
  photographer: Photographer
}

type EventDay = {
  id: number
  dayNumber: number
  date: string
  bookings: Booking[]
}

type Event = {
  id: number
  coupleName: string
  startDate: string
  endDate: string
  location?: string
  days: EventDay[]
}

const SLOTS = ['MORNING', 'AFTERNOON', 'EVENING']
const SLOT_ICONS: Record<string, string> = {
  MORNING: '🌅',
  AFTERNOON: '☀️',
  EVENING: '🌙'
}

const EVENT_NAMES = [
  'Haldi', 'Mehendi', 'Sangeet', 'Wedding',
  'Reception', 'Engagement', 'Portraits', 'Other'
]

export default function EventDetail() {
  const router = useRouter()
  const { id } = useParams()

  const [event, setEvent]               = useState<Event | null>(null)
  const [photographers, setPhotographers] = useState<Photographer[]>([])
  const [activeDay, setActiveDay]       = useState(0)
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')

  // Booking form state
  const [bookingSlot, setBookingSlot]           = useState<string | null>(null)
  const [bookingDayId, setBookingDayId]         = useState<number | null>(null)
  const [selectedEvent, setSelectedEvent]       = useState('')
  const [selectedPhotographer, setSelectedPhotographer] = useState('')
  const [bookingLocation, setBookingLocation]   = useState('')
  const [saving, setSaving]                     = useState(false)

  const API = process.env.NEXT_PUBLIC_API_URL

  function getToken() {
    return localStorage.getItem('pruview_token')
  }

  async function loadData() {
    try {
      const [eventRes, photosRes] = await Promise.all([
        fetch(`${API}/api/crm/events/${id}`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        }),
        fetch(`${API}/api/crm/photographers`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        })
      ])
      if (eventRes.status === 401) { router.push('/admin/login'); return }
      if (eventRes.status === 404) { router.push('/admin/crm'); return }
      const eventData = await eventRes.json()
      setEvent(eventData)
      setPhotographers(await photosRes.json())
    } catch (err) {
      setError('Could not load event.')
    } finally {
      setLoading(false)
    }
  }

  function getBookingForSlot(day: EventDay, slot: string) {
    return day.bookings.find(b => b.slot === slot)
  }

  function openBookingForm(dayId: number, slot: string) {
    setBookingDayId(dayId)
    setBookingSlot(slot)
    setSelectedEvent('')
    setSelectedPhotographer('')
    setBookingLocation('')
  }

  function closeBookingForm() {
    setBookingSlot(null)
    setBookingDayId(null)
  }

  async function saveBooking() {
    if (!selectedEvent || !selectedPhotographer || !bookingDayId || !bookingSlot) return
    setSaving(true)
    try {
      const res = await fetch(`${API}/api/crm/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          eventDayId:     bookingDayId,
          slot:           bookingSlot,
          eventName:      selectedEvent,
          photographerId: parseInt(selectedPhotographer),
          location:       bookingLocation || null
        })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message); setSaving(false); return }

      // Get photographer details
      const photographer = photographers.find(p => p.id === parseInt(selectedPhotographer))!

      // Update local state
      setEvent(prev => {
        if (!prev) return prev
        return {
          ...prev,
          days: prev.days.map(day => {
            if (day.id !== bookingDayId) return day
            return { ...day, bookings: [...day.bookings, { ...data, photographer }] }
          })
        }
      })

      // Build WhatsApp message
      const day = event?.days.find(d => d.id === bookingDayId)
      const dateStr = day ? new Date(day.date).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric'
      }) : ''

      const message = `Hi ${photographer.name},

You have been assigned for a photography booking:

📸 Event: ${selectedEvent}
📅 Date: ${dateStr}
🕐 Time: ${bookingSlot}
💑 Client: ${event?.coupleName}
📍 Location: ${bookingLocation || event?.location || 'TBD'}

Please confirm your availability.

Thank you!
Pruview CRM`

      const whatsappUrl = `https://wa.me/${photographer.phone}?text=${encodeURIComponent(message)}`
      window.open(whatsappUrl, '_blank')

      closeBookingForm()
    } catch (err) {
      setError('Could not save booking.')
    } finally {
      setSaving(false)
    }
  }

  async function cancelBooking(bookingId: number, dayId: number) {
    if (!confirm('Cancel this booking?')) return
    await fetch(`${API}/api/crm/bookings/${bookingId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    setEvent(prev => {
      if (!prev) return prev
      return {
        ...prev,
        days: prev.days.map(day => {
          if (day.id !== dayId) return day
          return { ...day, bookings: day.bookings.filter(b => b.id !== bookingId) }
        })
      }
    })
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short'
    })
  }

  useEffect(() => { loadData() }, [id])

  if (loading) return (
    <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center">
      <p className="text-[#888]">Loading…</p>
    </div>
  )

  if (!event) return null

  const currentDay = event.days[activeDay]

  return (
    <div className="min-h-screen bg-[#f8f7f4]">

      {/* Nav */}
      <nav className="bg-[#0f0f0f] px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/admin/crm')}
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
          📅 Calendar
        </button>
      </nav>

      <div className="max-w-4xl mx-auto px-8 py-10">

        {/* Event Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-[#0f0f0f]" style={{ fontFamily: 'Georgia, serif' }}>
            {event.coupleName}
          </h1>
          <p className="text-[#888] text-sm mt-1">
            {formatDate(event.startDate)} → {formatDate(event.endDate)}
            {event.location && ` · ${event.location}`}
          </p>
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {/* Day Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {event.days.map((day, index) => (
            <button
              key={day.id}
              onClick={() => setActiveDay(index)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                activeDay === index
                  ? 'bg-[#0f0f0f] text-white'
                  : 'bg-white border border-[#e8e5e0] text-[#333] hover:border-[#c8a020]'
              }`}
            >
              Day {day.dayNumber}
              <span className="ml-2 text-xs opacity-60">{formatDate(day.date)}</span>
            </button>
          ))}
        </div>

        {/* Time Slots */}
        {currentDay && (
          <div className="flex flex-col gap-4">
            {SLOTS.map(slot => {
              const booking = getBookingForSlot(currentDay, slot)
              return (
                <div key={slot} className="bg-white border border-[#e8e5e0] rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{SLOT_ICONS[slot]}</span>
                      <div>
                        <p className="font-semibold text-[#0f0f0f] capitalize">
                          {slot.charAt(0) + slot.slice(1).toLowerCase()}
                        </p>
                        {booking ? (
                          <div className="mt-1">
                            <p className="text-sm text-[#0f0f0f]">
                              <span className="font-medium">{booking.eventName}</span>
                              <span className="text-[#888]"> · {booking.photographer.name}</span>
                            </p>
                            {booking.location && (
                              <p className="text-xs text-[#888] mt-0.5">📍 {booking.location}</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-[#aaa] mt-0.5">Available</p>
                        )}
                      </div>
                    </div>

                    <div>
                      {booking ? (
                        <button
                          onClick={() => cancelBooking(booking.id, currentDay.id)}
                          className="px-4 py-2 text-xs font-semibold text-red-400 border border-red-200 rounded-lg hover:bg-red-50 transition-all"
                        >
                          Cancel
                        </button>
                      ) : (
                        <button
                          onClick={() => openBookingForm(currentDay.id, slot)}
                          className="px-4 py-2 text-xs font-semibold bg-[#0f0f0f] text-white rounded-lg hover:bg-[#222] transition-all"
                        >
                          + Book
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {bookingSlot && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md">
            <h2 className="text-xl font-semibold text-[#0f0f0f] mb-1" style={{ fontFamily: 'Georgia, serif' }}>
              Book {bookingSlot.charAt(0) + bookingSlot.slice(1).toLowerCase()} Slot
            </h2>
            <p className="text-[#888] text-sm mb-6">
              {currentDay && formatDate(currentDay.date)}
            </p>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold tracking-widest uppercase text-[#555] mb-2">
                  Event Name *
                </label>
                <select
                  value={selectedEvent}
                  onChange={e => setSelectedEvent(e.target.value)}
                  className="w-full px-4 py-3 border border-[#e0ddd8] rounded-xl text-sm text-[#0f0f0f] focus:outline-none focus:border-[#c8a020] transition-all"
                >
                  <option value="">Select event</option>
                  {EVENT_NAMES.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold tracking-widest uppercase text-[#555] mb-2">
                  Photographer *
                </label>
                <select
                  value={selectedPhotographer}
                  onChange={e => setSelectedPhotographer(e.target.value)}
                  className="w-full px-4 py-3 border border-[#e0ddd8] rounded-xl text-sm text-[#0f0f0f] focus:outline-none focus:border-[#c8a020] transition-all"
                >
                  <option value="">Select photographer</option>
                  {photographers.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {selectedPhotographer && (
                <div className="bg-[#f8f7f4] border border-[#e8e5e0] rounded-xl px-4 py-3">
                  <p className="text-xs text-[#888]">WhatsApp number:</p>
                  <p className="text-sm font-semibold text-[#0f0f0f]">
                    +{photographers.find(p => p.id === parseInt(selectedPhotographer))?.phone}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold tracking-widest uppercase text-[#555] mb-2">
                  Location (optional)
                </label>
                <input
                  type="text"
                  value={bookingLocation}
                  onChange={e => setBookingLocation(e.target.value)}
                  placeholder="Taj Hotel, Mumbai"
                  className="w-full px-4 py-3 border border-[#e0ddd8] rounded-xl text-sm text-[#0f0f0f] focus:outline-none focus:border-[#c8a020] transition-all"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeBookingForm}
                className="flex-1 py-3 border border-[#e0ddd8] text-[#333] text-sm font-semibold rounded-xl hover:bg-[#f8f7f4] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={saveBooking}
                disabled={saving || !selectedEvent || !selectedPhotographer}
                className="flex-1 py-3 bg-[#0f0f0f] text-white text-sm font-semibold rounded-xl hover:bg-[#222] disabled:opacity-40 transition-all"
              >
                {saving ? 'Saving…' : '📲 Book & WhatsApp'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}