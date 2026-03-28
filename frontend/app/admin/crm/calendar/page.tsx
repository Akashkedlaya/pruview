'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Booking = {
  id: number
  slot: string
  eventName: string
  location?: string
  photographer: { id: number; name: string; phone: string }
  eventDay: { date: string; event: { id: number; coupleName: string } }
}

type DayData = {
  bookings: Booking[]
  status: 'empty' | 'partial' | 'booked'
}

const SLOT_TIMES: Record<string, string> = {
  MORNING:   'Morning (06:00 - 12:00)',
  AFTERNOON: 'Afternoon (12:00 - 17:00)',
  EVENING:   'Evening (17:00 - 22:00)',
}

const SLOT_COLORS: Record<string, string> = {
  MORNING:   'border-l-amber-400',
  AFTERNOON: 'border-l-blue-400',
  EVENING:   'border-l-purple-400',
}

const STATUS_COLORS: Record<string, string> = {
  empty:   '',
  partial: 'bg-orange-400',
  booked:  'bg-red-500',
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function CalendarPage() {
  const router = useRouter()
  const today  = new Date()

  const [currentYear, setCurrentYear]   = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [events, setEvents]             = useState<any[]>([])
  const [loading, setLoading]           = useState(true)

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
      setEvents(await res.json())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Build a map of date → bookings
  function buildDateMap(): Record<string, Booking[]> {
    const map: Record<string, Booking[]> = {}
    events.forEach(event => {
      event.days?.forEach((day: any) => {
        const dateKey = new Date(day.date).toISOString().split('T')[0]
        if (!map[dateKey]) map[dateKey] = []
        day.bookings?.forEach((booking: any) => {
          map[dateKey].push({
            ...booking,
            eventDay: { date: day.date, event: { id: event.id, coupleName: event.coupleName } }
          })
        })
      })
    })
    return map
  }

  function getDayStatus(bookings: Booking[]): 'empty' | 'partial' | 'booked' {
    if (!bookings || bookings.length === 0) return 'empty'
    const slots = new Set(bookings.map(b => b.slot))
    if (slots.size >= 3) return 'booked'
    return 'partial'
  }

  // Get calendar grid for current month
  function getCalendarDays() {
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay  = new Date(currentYear, currentMonth + 1, 0)

    // Monday = 0, adjust getDay() which is Sunday = 0
    let startDow = firstDay.getDay() - 1
    if (startDow < 0) startDow = 6

    const days: (number | null)[] = []
    for (let i = 0; i < startDow; i++) days.push(null)
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(d)

    // Pad to complete last week
    while (days.length % 7 !== 0) days.push(null)
    return days
  }

  function formatDateKey(day: number) {
    const m = String(currentMonth + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    return `${currentYear}-${m}-${d}`
  }

  function isToday(day: number) {
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    )
  }

  function prevMonth() {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) }
    else setCurrentMonth(m => m - 1)
    setSelectedDate(null)
  }

  function nextMonth() {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) }
    else setCurrentMonth(m => m + 1)
    setSelectedDate(null)
  }

  function formatSelectedDate(dateKey: string) {
    const d = new Date(dateKey)
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  function sendWhatsApp(phone: string, name: string, booking: Booking) {
    const message = `Hi ${name},\n\nReminder for your booking:\n\n📸 Event: ${booking.eventName}\n💑 Client: ${booking.eventDay.event.coupleName}\n🕐 Slot: ${booking.slot}\n📍 Location: ${booking.location || 'TBD'}\n\nThank you!\nPruview CRM`
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank')
  }

  useEffect(() => { loadEvents() }, [])

  const dateMap    = buildDateMap()
  const calDays    = getCalendarDays()
  const selectedBookings = selectedDate ? (dateMap[selectedDate] || []) : []
  const selectedStatus   = getDayStatus(selectedBookings)

  return (
    <div className="p-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#0f0f0f]">
            Calendar Management
          </h1>
          <p className="text-[#888] text-sm mt-1">View and organize your event schedules</p>
        </div>
        <button
          onClick={() => router.push('/admin/crm/new')}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#7c3aed] text-white text-sm font-semibold rounded-xl hover:bg-[#6d28d9] transition-all shadow-md"
        >
          + New Booking
        </button>
      </div>

      <div className="flex gap-6">

        {/* Calendar */}
        <div className="flex-1 bg-white border border-[#ede9fe] rounded-2xl p-6">

          {/* Legend */}
          <div className="flex items-center justify-end gap-4 mb-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-[#888]">Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-orange-400" />
              <span className="text-[#888]">Partial</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-[#888]">Booked</span>
            </div>
          </div>

          {/* Month navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={prevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f5f3ff] text-[#666] transition-all"
            >
              ‹
            </button>
            <h2 className="text-lg font-bold text-[#0f0f0f]">
              {MONTHS[currentMonth]} {currentYear}
            </h2>
            <button
              onClick={nextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f5f3ff] text-[#666] transition-all"
            >
              ›
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(day => (
              <div key={day} className="text-center text-xs font-semibold text-[#aaa] py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calDays.map((day, index) => {
              if (!day) return <div key={index} />

              const dateKey  = formatDateKey(day)
              const bookings = dateMap[dateKey] || []
              const status   = getDayStatus(bookings)
              const isSelect = selectedDate === dateKey
              const todayDay = isToday(day)

              return (
                <div
                  key={index}
                  onClick={() => setSelectedDate(isSelect ? null : dateKey)}
                  className={`relative aspect-square flex flex-col items-center justify-center rounded-xl cursor-pointer transition-all ${
                    isSelect
                      ? 'bg-[#7c3aed] text-white'
                      : todayDay
                      ? 'bg-[#ede9fe] text-[#7c3aed] font-bold'
                      : 'hover:bg-[#f5f3ff] text-[#333]'
                  }`}
                >
                  <span className="text-sm">{day}</span>
                  {/* Status dot */}
                  {status !== 'empty' && (
                    <div className={`absolute bottom-1.5 w-1.5 h-1.5 rounded-full ${
                      isSelect ? 'bg-white' : STATUS_COLORS[status]
                    }`} />
                  )}
                  {/* Multiple dots for multiple bookings */}
                  {status === 'empty' && bookings.length === 0 && todayDay && (
                    <div className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-green-400" />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Day Panel */}
        <div className="w-80 flex-shrink-0">
          {selectedDate ? (
            <div className="bg-white border border-[#ede9fe] rounded-2xl overflow-hidden">

              {/* Panel header */}
              <div className="px-5 py-4 border-b border-[#f5f3ff] flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#0f0f0f]">
                    {new Date(selectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </p>
                  <p className="text-xs text-[#888] mt-0.5">
                    {new Date(selectedDate).getFullYear()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedStatus !== 'empty' && (
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      selectedStatus === 'booked'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-orange-100 text-orange-600'
                    }`}>
                      {selectedStatus === 'booked' ? 'Fully Booked' : 'Partially Booked'}
                    </span>
                  )}
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="w-6 h-6 flex items-center justify-center text-[#aaa] hover:text-[#333] transition-all"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Slots */}
              <div className="p-4 flex flex-col gap-3">
                {['MORNING', 'AFTERNOON', 'EVENING'].map(slot => {
                  const slotBookings = selectedBookings.filter(b => b.slot === slot)
                  return (
                    <div key={slot}>
                      <p className="text-xs font-semibold text-[#aaa] uppercase tracking-wider mb-2">
                        {SLOT_TIMES[slot]}
                      </p>
                      {slotBookings.length > 0 ? (
                        <div className="flex flex-col gap-2">
                          {slotBookings.map(booking => (
                            <div
                              key={booking.id}
                              className={`bg-[#faf9ff] border-l-4 ${SLOT_COLORS[slot]} border border-[#ede9fe] rounded-xl p-3`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-[#0f0f0f] truncate">
                                    {booking.eventName} — {booking.eventDay.event.coupleName}
                                  </p>
                                  <p className="text-xs text-[#888] mt-0.5">
                                    📸 {booking.photographer.name}
                                  </p>
                                  {booking.location && (
                                    <p className="text-xs text-[#888]">
                                      📍 {booking.location}
                                    </p>
                                  )}
                                </div>
                                <button
                                  onClick={() => sendWhatsApp(
                                    booking.photographer.phone,
                                    booking.photographer.name,
                                    booking
                                  )}
                                  className="w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center transition-all ml-2 flex-shrink-0 text-sm"
                                  title="Send WhatsApp"
                                >
                                  💬
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <button
                          onClick={() => router.push(`/admin/crm`)}
                          className="w-full py-3 border border-dashed border-[#ede9fe] rounded-xl text-sm text-[#7c3aed] hover:bg-[#f5f3ff] transition-all flex items-center justify-center gap-1"
                        >
                          + Add Event
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#ede9fe] rounded-2xl p-8 text-center">
              <p className="text-4xl mb-3">📅</p>
              <p className="text-sm font-semibold text-[#333]">Select a date</p>
              <p className="text-xs text-[#aaa] mt-1">
                Click any date on the calendar to view bookings
              </p>

              {/* Monthly summary */}
              <div className="mt-6 pt-6 border-t border-[#f5f3ff]">
                <p className="text-xs font-semibold text-[#888] uppercase tracking-wider mb-3">
                  This Month
                </p>
                {(() => {
                  const monthBookings = Object.entries(dateMap).filter(([key]) => {
                    const d = new Date(key)
                    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
                  })
                  const totalBookings = monthBookings.reduce((sum, [, b]) => sum + b.length, 0)
                  const bookedDays    = monthBookings.filter(([, b]) => b.length > 0).length
                  return (
                    <div className="flex gap-3">
                      <div className="flex-1 bg-[#f5f3ff] rounded-xl p-3">
                        <p className="text-2xl font-bold text-[#7c3aed]">{bookedDays}</p>
                        <p className="text-xs text-[#888]">Days booked</p>
                      </div>
                      <div className="flex-1 bg-[#f5f3ff] rounded-xl p-3">
                        <p className="text-2xl font-bold text-[#7c3aed]">{totalBookings}</p>
                        <p className="text-xs text-[#888]">Total slots</p>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}