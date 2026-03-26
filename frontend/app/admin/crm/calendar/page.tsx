'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Booking = {
  id: number
  slot: string
  eventName: string
  photographer: { name: string }
}

type EventDay = {
  id: number
  date: string
  dayNumber: number
  bookings: Booking[]
  event: { id: number; coupleName: string }
}

const SLOTS = ['MORNING', 'AFTERNOON', 'EVENING']
const SLOT_ICONS: Record<string, string> = {
  MORNING: '🌅',
  AFTERNOON: '☀️',
  EVENING: '🌙'
}
const SLOT_COLORS: Record<string, string> = {
  MORNING: 'bg-amber-100 border-amber-300 text-amber-800',
  AFTERNOON: 'bg-blue-100 border-blue-300 text-blue-800',
  EVENING: 'bg-purple-100 border-purple-300 text-purple-800'
}

export default function CalendarPage() {
  const router = useRouter()
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
      setEvents(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function getAllDays() {
    const days: any[] = []
    events.forEach(event => {
      event.days?.forEach((day: any) => {
        days.push({ ...day, event: { id: event.id, coupleName: event.coupleName } })
      })
    })
    return days.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  useEffect(() => { loadEvents() }, [])

  const allDays = getAllDays()

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <nav className="bg-[#0f0f0f] px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/admin/crm')}
            className="text-[#666] hover:text-white text-sm transition-colors">
            ← Back
          </button>
          <span className="text-white text-xl font-semibold" style={{ fontFamily: 'Georgia, serif' }}>
            pru<span className="text-[#e8c547]">view</span>
            <span className="text-[#666] text-sm ml-3">/ CRM / Calendar</span>
          </span>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-8 py-10">
        <h1 className="text-3xl font-semibold text-[#0f0f0f] mb-2" style={{ fontFamily: 'Georgia, serif' }}>
          Calendar View
        </h1>
        <p className="text-[#888] text-sm mb-8">All bookings across all events</p>

        {/* Legend */}
        <div className="flex gap-4 mb-8 flex-wrap">
          {SLOTS.map(slot => (
            <div key={slot} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${SLOT_COLORS[slot]}`}>
              <span>{SLOT_ICONS[slot]}</span>
              <span>{slot.charAt(0) + slot.slice(1).toLowerCase()}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#e8e5e0] bg-white text-xs font-semibold text-[#aaa]">
            ⬜ Available
          </div>
        </div>

        {loading ? (
          <p className="text-[#888]">Loading…</p>
        ) : allDays.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-4xl mb-4">📅</p>
            <p className="text-[#888] text-sm">No events yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {allDays.map(day => (
              <div key={day.id}
                className="bg-white border border-[#e8e5e0] rounded-2xl overflow-hidden">

                {/* Day header */}
                <div
                  className="px-6 py-4 border-b border-[#e8e5e0] flex items-center justify-between cursor-pointer hover:bg-[#f8f7f4] transition-all"
                  onClick={() => router.push(`/admin/crm/${day.event.id}`)}
                >
                  <div>
                    <p className="font-semibold text-[#0f0f0f]">{day.event.coupleName}</p>
                    <p className="text-xs text-[#888] mt-0.5">
                      Day {day.dayNumber} · {formatDate(day.date)}
                    </p>
                  </div>
                  <span className="text-[#ccc]">›</span>
                </div>

                {/* Slots */}
                <div className="grid grid-cols-3 divide-x divide-[#e8e5e0]">
                  {SLOTS.map(slot => {
                    const booking = day.bookings?.find((b: Booking) => b.slot === slot)
                    return (
                      <div key={slot} className="p-4">
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="text-sm">{SLOT_ICONS[slot]}</span>
                          <span className="text-xs font-semibold text-[#888] uppercase tracking-wide">
                            {slot.charAt(0) + slot.slice(1).toLowerCase()}
                          </span>
                        </div>
                        {booking ? (
                          <div className={`px-3 py-2 rounded-lg border text-xs ${SLOT_COLORS[slot]}`}>
                            <p className="font-semibold">{booking.eventName}</p>
                            <p className="opacity-75 mt-0.5">{booking.photographer.name}</p>
                          </div>
                        ) : (
                          <div className="px-3 py-2 rounded-lg border border-dashed border-[#e0ddd8] text-xs text-[#ccc]">
                            Available
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}