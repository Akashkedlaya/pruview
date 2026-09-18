'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Booking = {
  id: number
  slot: string
  eventName: string
  location?: string
  photographer: { id: number; name: string; phone: string; specialization?: string }
  eventDay: { date: string; event: { id: number; coupleName: string } }
}

const SLOT_ICONS: Record<string, string> = {
  MORNING:   'AM',
  AFTERNOON: 'PM',
  EVENING:   'EVE',
}

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAYS_FULL  = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS     = ['January','February','March','April','May','June','July','August','September','October','November','December']

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function getAvatarColor(name: string) {
  const colors = ['bg-blue-200 text-blue-700','bg-green-200 text-green-700','bg-purple-200 text-purple-700','bg-amber-200 text-amber-700','bg-pink-200 text-pink-700','bg-indigo-200 text-indigo-700']
  return colors[name.charCodeAt(0) % colors.length]
}

export default function CalendarPage() {
  const router = useRouter()
  const today  = new Date()
  const [currentYear, setCurrentYear]   = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [events, setEvents]             = useState<any[]>([])
  const [loading, setLoading]           = useState(true)
  const API = process.env.NEXT_PUBLIC_API_URL

  function getToken() { return localStorage.getItem('pruview_token') }

  async function loadEvents() {
    try {
      const res = await fetch(`${API}/api/crm/events`, { headers: { Authorization: `Bearer ${getToken()}` } })
      if (res.status === 401) { router.push('/admin/login'); return }
      setEvents(await res.json())
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  function buildDateMap(): Record<string, Booking[]> {
    const map: Record<string, Booking[]> = {}
    events.forEach(event => {
      event.days?.forEach((day: any) => {
        const dateKey = new Date(day.date).toISOString().split('T')[0]
        if (!map[dateKey]) map[dateKey] = []
        day.bookings?.forEach((booking: any) => {
          map[dateKey].push({ ...booking, eventDay: { date: day.date, event: { id: event.id, coupleName: event.coupleName } } })
        })
      })
    })
    return map
  }

  function getDayStatus(bookings: Booking[]): 'available' | 'partial' | 'booked' {
    if (!bookings || bookings.length === 0) return 'available'
    const slots = new Set(bookings.map(b => b.slot))
    return slots.size >= 3 ? 'booked' : 'partial'
  }

  function getCalendarDays() {
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay  = new Date(currentYear, currentMonth + 1, 0)
    const days: (number | null)[] = []
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null)
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(d)
    while (days.length % 7 !== 0) days.push(null)
    return days
  }

  function formatDateKey(day: number) {
    return `${currentYear}-${String(currentMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
  }

  function isToday(day: number) {
    return day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()
  }

  function prevMonth() {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) } else setCurrentMonth(m => m - 1)
    setSelectedDate(null)
  }

  function nextMonth() {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) } else setCurrentMonth(m => m + 1)
    setSelectedDate(null)
  }



  useEffect(() => { loadEvents() }, [])

  const dateMap          = buildDateMap()
  const calDays          = getCalendarDays()
  const selectedBookings = selectedDate ? (dateMap[selectedDate] || []) : []
  const selectedStatus   = getDayStatus(selectedBookings)

  function getGroupedSlot(slot: string) {
    const slotBookings = selectedBookings.filter(b => b.slot === slot)
    const groups: Record<string, { eventName: string; coupleName: string; eventId: number; photographers: Booking[] }> = {}
    slotBookings.forEach(b => {
      const key = `${b.eventName}__${b.eventDay.event.coupleName}`
      if (!groups[key]) groups[key] = { eventName: b.eventName, coupleName: b.eventDay.event.coupleName, eventId: b.eventDay.event.id, photographers: [] }
      groups[key].photographers.push(b)
    })
    return Object.values(groups)
  }

  const dotColor: Record<string, string> = { available: 'bg-green-400', partial: 'bg-orange-400', booked: 'bg-red-500' }

  return (
    <div className="flex h-screen overflow-hidden">

      {/* Calendar */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-[var(--pv-text)]">{MONTHS[currentMonth]} {currentYear}</h1>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="w-9 h-9 flex items-center justify-center bg-white border border-[var(--pv-border)] rounded-lg hover:bg-[var(--pv-accent-tint-hover)] text-[var(--pv-text-secondary)] transition-all font-bold">&lsaquo;</button>
            <button onClick={nextMonth} className="w-9 h-9 flex items-center justify-center bg-white border border-[var(--pv-border)] rounded-lg hover:bg-[var(--pv-accent-tint-hover)] text-[var(--pv-text-secondary)] transition-all font-bold">&rsaquo;</button>
            <button onClick={() => router.push('/admin/crm/new')} className="ml-2 px-4 py-2 bg-[var(--pv-accent)] text-[var(--pv-accent-on)] text-sm font-semibold rounded-xl hover:bg-[var(--pv-accent-hover)] transition-all">+ Add Event</button>
          </div>
        </div>

        <div className="bg-white border border-[var(--pv-border)] rounded-2xl overflow-hidden shadow-sm">
          <div className="grid grid-cols-7 border-b border-[var(--pv-border)]">
            {DAYS_SHORT.map(d => <div key={d} className="py-3 text-center text-xs font-semibold text-[var(--pv-muted)] uppercase tracking-wider">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {calDays.map((day, index) => {
              const isLastCol = index % 7 === 6
              const isLastRow = Math.floor(index / 7) === Math.floor((calDays.length - 1) / 7)
              const border    = `${!isLastCol ? 'border-r' : ''} ${!isLastRow ? 'border-b' : ''} border-[var(--pv-border)]`

              if (!day) return <div key={index} className={`min-h-[90px] bg-[#fafafa] ${border}`} />

              const dateKey  = formatDateKey(day)
              const bookings = dateMap[dateKey] || []
              const status   = getDayStatus(bookings)
              const isSelect = selectedDate === dateKey
              const todayDay = isToday(day)
              const names    = [...new Set(bookings.map(b => b.eventName))].slice(0, 2)

              return (
                <div
                  key={index}
                  onClick={() => setSelectedDate(isSelect ? null : dateKey)}
                  className={`min-h-[90px] p-2 cursor-pointer transition-all ${border} ${isSelect ? 'bg-[var(--pv-accent-tint)] ring-2 ring-[var(--pv-accent)] ring-inset' : 'hover:bg-[#faf9ff]'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full ${todayDay ? 'bg-[var(--pv-accent)] text-[var(--pv-accent-on)]' : isSelect ? 'text-[var(--pv-accent)] font-bold' : 'text-[var(--pv-text-secondary)]'}`}>{day}</span>
                    <div className={`w-2 h-2 rounded-full ${dotColor[status]}`} />
                  </div>
                  {bookings.length > 0 && (
                    <div className="flex flex-col gap-0.5 mt-1">
                      {bookings.length <= 2
                        ? names.map((name, i) => <div key={i} className={`text-xs truncate rounded px-1.5 py-0.5 ${isSelect ? 'bg-[#ddd6fe] text-[var(--pv-accent)]' : 'bg-[var(--pv-accent-tint-hover)] text-[var(--pv-text-secondary)]'}`}>{name}</div>)
                        : <div className={`text-xs rounded px-1.5 py-0.5 ${isSelect ? 'bg-[#ddd6fe] text-[var(--pv-accent)]' : 'bg-[var(--pv-accent-tint-hover)] text-[var(--pv-text-secondary)]'}`}>{bookings.length} Bookings</div>
                      }
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-96 bg-white border-l border-[var(--pv-border)] flex flex-col overflow-hidden flex-shrink-0">
        {selectedDate ? (
          <>
            <div className="px-6 py-5 border-b border-[var(--pv-border)]">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-[var(--pv-text)]">
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </h2>
                  <p className="text-sm text-[var(--pv-muted)] mt-0.5">{DAYS_FULL[new Date(selectedDate + 'T00:00:00').getDay()]} Schedule</p>
                  {selectedStatus !== 'available' && (
                    <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${selectedStatus === 'booked' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                      {selectedStatus === 'booked' ? 'Fully Booked' : 'Partially Booked'}
                    </span>
                  )}
                </div>
                <button onClick={() => setSelectedDate(null)} className="w-7 h-7 flex items-center justify-center border border-[var(--pv-border)] rounded-lg text-[var(--pv-muted)] hover:text-[var(--pv-text-secondary)] text-xs mt-1">x</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-5">
              {['MORNING', 'AFTERNOON', 'EVENING'].map(slot => {
                const groups = getGroupedSlot(slot)
                return (
                  <div key={slot}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[var(--pv-muted)] text-sm">{SLOT_ICONS[slot]}</span>
                      <p className="text-xs font-bold text-[var(--pv-muted)] uppercase tracking-widest">{slot}</p>
                    </div>
                    {groups.length > 0 ? (
                      <div className="flex flex-col gap-3">
                        {groups.map((group, gi) => (
                          <div key={gi} className="bg-white border border-[var(--pv-border)] rounded-xl p-4 shadow-sm">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <p className="font-semibold text-[var(--pv-text)]">{group.eventName}</p>
                                <p className="text-sm text-[var(--pv-muted)] mt-0.5">{group.coupleName}</p>
                              </div>
                              <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${slot === 'MORNING' ? 'bg-amber-400' : slot === 'AFTERNOON' ? 'bg-blue-400' : 'bg-purple-400'}`} />
                            </div>
                            <div className="flex flex-col gap-2 mb-3">
                              {group.photographers.map((booking, pi) => (
                                <div key={pi} className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${getAvatarColor(booking.photographer.name)}`}>
                                    {getInitials(booking.photographer.name)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-[var(--pv-text)] truncate">{booking.photographer.name}</p>
                                    {booking.photographer.specialization && <p className="text-xs text-[var(--pv-muted)] truncate">{booking.photographer.specialization}</p>}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <button onClick={() => router.push(`/admin/crm/${group.eventId}`)} className="w-full py-2 border border-[var(--pv-border)] rounded-lg text-sm text-[var(--pv-text-secondary)] hover:border-[var(--pv-accent)] hover:text-[var(--pv-accent)] transition-all flex items-center justify-center gap-1.5">
                              Edit Event
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <button onClick={() => router.push('/admin/crm/new')} className="w-full py-3 border border-dashed border-[var(--pv-border)] rounded-xl text-sm text-[var(--pv-accent)] hover:bg-[var(--pv-accent-tint-hover)] hover:border-[var(--pv-accent)] transition-all">
                        + Add Event
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 bg-[var(--pv-accent-tint)] rounded-2xl flex items-center justify-center mb-4">
              <span className="text-[var(--pv-accent)] font-bold text-2xl">C</span>
            </div>
            <p className="font-semibold text-[var(--pv-text-secondary)] mb-1">Select a date</p>
            <p className="text-sm text-[var(--pv-muted)] mb-8">Click any date to view the schedule</p>
            <div className="w-full pt-6 border-t border-[var(--pv-border)]">
              <p className="text-xs font-bold text-[var(--pv-muted)] uppercase tracking-wider mb-4">{MONTHS[currentMonth]} Summary</p>
              {(() => {
                const entries = Object.entries(dateMap).filter(([key]) => {
                  const d = new Date(key)
                  return d.getMonth() === currentMonth && d.getFullYear() === currentYear
                })
                return (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[var(--pv-accent-tint-hover)] rounded-xl p-4 text-left">
                      <p className="text-2xl font-bold text-[var(--pv-accent)]">{entries.filter(([,b]) => b.length > 0).length}</p>
                      <p className="text-xs text-[var(--pv-muted)] mt-1">Days booked</p>
                    </div>
                    <div className="bg-[var(--pv-accent-tint-hover)] rounded-xl p-4 text-left">
                      <p className="text-2xl font-bold text-[var(--pv-accent)]">{entries.reduce((sum,[,b]) => sum + b.length, 0)}</p>
                      <p className="text-xs text-[var(--pv-muted)] mt-1">Total slots</p>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}