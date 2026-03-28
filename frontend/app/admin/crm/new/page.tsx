'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Photographer = {
  id: number
  name: string
  phone: string
  specialization?: string
}

const EVENT_NAMES = ['Haldi Ceremony', 'Mehendi', 'Sangeet', 'Wedding Ceremony', 'Reception', 'Engagement', 'Welcome Dinner', 'Portraits', 'Other']

const SLOTS = [
  { key: 'MORNING',   label: 'Morning',   time: '09:00 - 13:00', icon: '☀️' },
  { key: 'AFTERNOON', label: 'Afternoon', time: '13:00 - 17:00', icon: '🌤️' },
  { key: 'EVENING',   label: 'Evening',   time: '18:00 - 23:00', icon: '🌙' },
]

export default function NewWedding() {
  const router = useRouter()

  const [coupleName, setCoupleName]     = useState('')
  const [startDate, setStartDate]       = useState('')
  const [endDate, setEndDate]           = useState('')
  const [location, setLocation]         = useState('')
  const [description, setDescription]   = useState('')
  const [detailsSaved, setDetailsSaved] = useState(false)
  const [savingDetails, setSavingDetails] = useState(false)
  const [createdEventId, setCreatedEventId] = useState<number | null>(null)
  const [eventDays, setEventDays]       = useState<any[]>([])
  const [activeDay, setActiveDay]       = useState(0)
  const [activeSlot, setActiveSlot]     = useState('MORNING')
  const [selectedEvent, setSelectedEvent] = useState('')
  const [selectedPhotographers, setSelectedPhotographers] = useState<number[]>([])
  const [bookingLocation, setBookingLocation] = useState('')
  const [saving, setSaving]             = useState(false)
  const [bookings, setBookings]         = useState<Record<string, any>>({})
  const [photographers, setPhotographers] = useState<Photographer[]>([])
  const [error, setError]               = useState('')

  const API = process.env.NEXT_PUBLIC_API_URL
  function getToken() { return localStorage.getItem('pruview_token') }

  useEffect(() => {
    fetch(`${API}/api/crm/photographers`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    }).then(r => r.json()).then(setPhotographers).catch(console.error)
  }, [])

  function getDayCount() {
    if (!startDate || !endDate) return 0
    const diff = new Date(endDate).getTime() - new Date(startDate).getTime()
    return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)) + 1)
  }

  function getDayDate(index: number) {
    if (!startDate) return ''
    const d = new Date(startDate)
    d.setDate(d.getDate() + index)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  async function saveDetails() {
    if (!coupleName.trim() || !startDate || !endDate) {
      setError('Couple name, start and end date are required.')
      return
    }
    setSavingDetails(true)
    setError('')
    try {
      const res = await fetch(`${API}/api/crm/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ coupleName, startDate, endDate, location })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message); return }
      setCreatedEventId(data.id)
      setEventDays(data.days || [])
      setDetailsSaved(true)
    } catch {
      setError('Could not save details.')
    } finally {
      setSavingDetails(false)
    }
  }

  function togglePhotographer(id: number) {
    setSelectedPhotographers(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  function getBookingKey(dayIndex: number, slot: string) {
    return `${dayIndex}-${slot}`
  }

  async function handleBook(notify: boolean) {
    if (!selectedEvent || selectedPhotographers.length === 0 || !createdEventId) return
    if (!eventDays[activeDay]) return
    setSaving(true)
    try {
      const dayId = eventDays[activeDay].id
      for (const photographerId of selectedPhotographers) {
        await fetch(`${API}/api/crm/bookings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify({ eventDayId: dayId, slot: activeSlot, eventName: selectedEvent, photographerId, location: bookingLocation || null })
        })
      }
      const key = getBookingKey(activeDay, activeSlot)
      const bookedPhotographers = selectedPhotographers.map(id => photographers.find(p => p.id === id)!)
      setBookings(prev => ({ ...prev, [key]: { eventName: selectedEvent, photographers: bookedPhotographers } }))

      if (notify) {
        for (const photographerId of selectedPhotographers) {
          const p = photographers.find(ph => ph.id === photographerId)!
          const slotInfo = SLOTS.find(s => s.key === activeSlot)!
          const msg = `Hi ${p.name},\n\nYou have been assigned for a photography booking:\n\n📸 Event: ${selectedEvent}\n📅 Date: ${getDayDate(activeDay)}\n🕐 Time: ${slotInfo.label} (${slotInfo.time})\n💑 Client: ${coupleName}\n📍 Location: ${bookingLocation || location || 'TBD'}\n\nPlease confirm your availability.\n\nThank you!\nPruview CRM`
          window.open(`https://wa.me/${p.phone}?text=${encodeURIComponent(msg)}`, '_blank')
          await new Promise(r => setTimeout(r, 800))
        }
      }
      setSelectedEvent('')
      setSelectedPhotographers([])
      setBookingLocation('')
    } catch {
      setError('Could not save booking.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f3ff' }}>

      {/* Header */}
      <div className="bg-white border-b border-[#ede9fe] px-8 py-5 flex items-center gap-4">
        <button onClick={() => router.push('/admin/crm')}
          className="w-8 h-8 flex items-center justify-center border border-[#e8e5e0] rounded-lg text-[#666] hover:bg-[#f5f3ff] transition-all">
          ←
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#0f0f0f]">
            New Wedding
          </h1>
          <p className="text-[#888] text-sm">Create a new wedding and schedule events</p>
        </div>
      </div>

      <div className="p-8 grid grid-cols-5 gap-6 max-w-7xl mx-auto">

        {/* Left — Wedding Details */}
        <div className="col-span-2 bg-white rounded-2xl border border-[#ede9fe] p-6 h-fit">
          <h2 className="text-lg font-bold text-[#0f0f0f] mb-1">1. Wedding Details</h2>
          <p className="text-[#888] text-sm mb-6">Basic information about the couple</p>

          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-[#333] mb-1.5">Couple Name *</label>
              <input type="text" value={coupleName}
                onChange={e => { setCoupleName(e.target.value); setDetailsSaved(false) }}
                placeholder="Eleanor & James"
                className="w-full px-4 py-2.5 border border-[#e8e5e0] rounded-xl text-sm text-[#0f0f0f] focus:outline-none focus:border-[#7c3aed] transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#333] mb-1.5">Start Date *</label>
                <input type="date" value={startDate}
                  onChange={e => { setStartDate(e.target.value); setDetailsSaved(false) }}
                  className="w-full px-3 py-2.5 border border-[#e8e5e0] rounded-xl text-sm text-[#0f0f0f] focus:outline-none focus:border-[#7c3aed] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#333] mb-1.5">End Date *</label>
                <input type="date" value={endDate}
                  onChange={e => { setEndDate(e.target.value); setDetailsSaved(false) }}
                  className="w-full px-3 py-2.5 border border-[#e8e5e0] rounded-xl text-sm text-[#0f0f0f] focus:outline-none focus:border-[#7c3aed] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#333] mb-1.5">
                Location <span className="text-[#aaa] font-normal">(Optional)</span>
              </label>
              <input type="text" value={location}
                onChange={e => { setLocation(e.target.value); setDetailsSaved(false) }}
                placeholder="The Ritz-Carlton, New York"
                className="w-full px-4 py-2.5 border border-[#e8e5e0] rounded-xl text-sm text-[#0f0f0f] focus:outline-none focus:border-[#7c3aed] transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#333] mb-1.5">
                Description <span className="text-[#aaa] font-normal">(Optional)</span>
              </label>
              <textarea value={description}
                onChange={e => { setDescription(e.target.value); setDetailsSaved(false) }}
                placeholder="3-day traditional wedding with expected 400 guests."
                rows={3}
                className="w-full px-4 py-2.5 border border-[#e8e5e0] rounded-xl text-sm text-[#0f0f0f] focus:outline-none focus:border-[#7c3aed] transition-all resize-none"
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button onClick={saveDetails}
              disabled={savingDetails || !coupleName.trim() || !startDate || !endDate}
              className={`w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                detailsSaved
                  ? 'bg-[#f0fdf4] text-green-700 border border-green-200'
                  : 'bg-[#7c3aed] text-white hover:bg-[#6d28d9] disabled:opacity-40'
              }`}
            >
              {savingDetails ? 'Saving…' : detailsSaved ? '✓ Details Saved' : 'Save Details'}
            </button>
          </div>
        </div>

        {/* Right — Event Schedule */}
        <div className="col-span-3 bg-white rounded-2xl border border-[#ede9fe] p-6">
          <h2 className="text-lg font-bold text-[#0f0f0f] mb-1">2. Event Schedule</h2>
          <p className="text-[#888] text-sm mb-6">Plan events and assign photographers for each day</p>

          {!detailsSaved ? (
            <div className="text-center py-16 text-[#aaa]">
              <p className="text-4xl mb-3">📅</p>
              <p className="text-sm">Save wedding details first to start scheduling</p>
            </div>
          ) : (
            <>
              {/* Day tabs */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                {Array.from({ length: getDayCount() }).map((_, i) => (
                  <button key={i} onClick={() => setActiveDay(i)}
                    className={`flex flex-col items-center px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all border ${
                      activeDay === i
                        ? 'bg-[#0f0f0f] text-white border-[#0f0f0f]'
                        : 'bg-white text-[#666] border-[#e8e5e0] hover:border-[#7c3aed]'
                    }`}
                  >
                    <span className="font-semibold">Day {i + 1}</span>
                    <span className={`text-xs mt-0.5 ${activeDay === i ? 'text-white/60' : 'text-[#aaa]'}`}>
                      {getDayDate(i)}
                    </span>
                  </button>
                ))}
                <button className="flex flex-col items-center px-4 py-2.5 rounded-xl text-sm border border-dashed border-[#7c3aed] text-[#7c3aed] hover:bg-[#f5f3ff] transition-all whitespace-nowrap">
                  <span>+</span>
                  <span className="text-xs mt-0.5">Add Day</span>
                </button>
              </div>

              {/* Time slot cards */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {SLOTS.map(slot => {
                  const isActive   = activeSlot === slot.key
                  const hasBooking = !!bookings[getBookingKey(activeDay, slot.key)]
                  return (
                    <button key={slot.key} onClick={() => setActiveSlot(slot.key)}
                      className={`flex flex-col items-center py-4 px-3 rounded-xl border transition-all ${
                        isActive    ? 'bg-[#7c3aed] text-white border-[#7c3aed]'
                        : hasBooking ? 'bg-[#f0fdf4] text-green-700 border-green-200'
                        : 'bg-[#fafafa] text-[#666] border-[#e8e5e0] hover:border-[#7c3aed]'
                      }`}
                    >
                      <span className="text-xl mb-1">{slot.icon}</span>
                      <span className="font-semibold text-sm">{slot.label}</span>
                      <span className={`text-xs mt-0.5 ${isActive ? 'text-white/70' : 'text-[#aaa]'}`}>
                        {slot.time}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Booking form */}
              <div className="border-t border-[#f0ede8] pt-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 bg-[#7c3aed] rounded-full"></div>
                  <h3 className="font-bold text-[#0f0f0f]">
                    {SLOTS.find(s => s.key === activeSlot)?.label} Event Details
                  </h3>
                </div>

                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#333] mb-1.5">Event Name *</label>
                    <select value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}
                      className="w-full px-4 py-2.5 border border-[#e8e5e0] rounded-xl text-sm text-[#0f0f0f] focus:outline-none focus:border-[#7c3aed] transition-all"
                    >
                      <option value="">Select Event</option>
                      {EVENT_NAMES.map(name => <option key={name} value={name}>{name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#333] mb-1.5">Assign Photographers *</label>
                    <div className="border border-[#e8e5e0] rounded-xl p-3 min-h-[46px]">
                      {selectedPhotographers.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {selectedPhotographers.map(id => {
                            const p = photographers.find(ph => ph.id === id)
                            return (
                              <div key={id} className="flex items-center gap-1.5 bg-[#ede9fe] text-[#7c3aed] px-3 py-1 rounded-full text-xs font-medium">
                                <span>{p?.name}</span>
                                <button onClick={() => togglePhotographer(id)} className="hover:text-red-500 ml-1">×</button>
                              </div>
                            )
                          })}
                        </div>
                      )}
                      <select
                        onChange={e => { if (e.target.value) { togglePhotographer(parseInt(e.target.value)); e.target.value = '' }}}
                        className="w-full text-sm text-[#666] focus:outline-none bg-transparent"
                        defaultValue=""
                      >
                        <option value="" disabled>Select photographers...</option>
                        {photographers.filter(p => !selectedPhotographers.includes(p.id)).map(p => (
                          <option key={p.id} value={p.id}>{p.name}{p.specialization ? ` — ${p.specialization}` : ''}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#333] mb-1.5">Location</label>
                    <input type="text" value={bookingLocation} onChange={e => setBookingLocation(e.target.value)}
                      placeholder="Enter location name or address"
                      className="w-full px-4 py-2.5 border border-[#e8e5e0] rounded-xl text-sm text-[#0f0f0f] focus:outline-none focus:border-[#7c3aed] transition-all"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button onClick={() => { setSelectedEvent(''); setSelectedPhotographers([]); setBookingLocation('') }}
                      className="text-sm text-[#888] hover:text-[#333] transition-colors">
                      Cancel
                    </button>
                    <div className="flex gap-3">
                      <button onClick={() => handleBook(false)}
                        disabled={saving || !selectedEvent || selectedPhotographers.length === 0}
                        className="px-5 py-2.5 border border-[#e8e5e0] text-sm font-semibold text-[#333] rounded-xl hover:border-[#7c3aed] hover:text-[#7c3aed] disabled:opacity-40 transition-all"
                      >
                        Book
                      </button>
                      <button onClick={() => handleBook(true)}
                        disabled={saving || !selectedEvent || selectedPhotographers.length === 0}
                        className="px-5 py-2.5 bg-[#25D366] text-white text-sm font-semibold rounded-xl hover:bg-[#22c55e] disabled:opacity-40 transition-all flex items-center gap-2"
                      >
                        📲 Book & Notify
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}