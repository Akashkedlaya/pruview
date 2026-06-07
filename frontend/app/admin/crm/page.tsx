'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Event = {
  id: number
  coupleName: string
  startDate: string
  endDate: string
  location?: string
  days: any[]
}

const VENUE_IMAGES = [
  'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&q=80',
  'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&q=80',
  'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=400&q=80',
  'https://images.unsplash.com/photo-1507504031003-b417219a0fde?w=400&q=80',
  'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&q=80',
  'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?w=400&q=80',
]

export default function CRMDashboard() {
  const router = useRouter()
  const [events, setEvents]   = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState('all')

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

  function getStatus(event: Event) {
    const now   = new Date()
    const start = new Date(event.startDate)
    const end   = new Date(event.endDate)
    if (end < now)    return 'completed'
    if (start <= now) return 'active'
    return 'upcoming'
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  function getVenueImage(id: number) {
    return VENUE_IMAGES[id % VENUE_IMAGES.length]
  }

  const filtered = events.filter(e => {
    const matchSearch = e.coupleName.toLowerCase().includes(search.toLowerCase())
    const status      = getStatus(e)
    const matchFilter = filter === 'all' || status === filter
    return matchSearch && matchFilter
  })

  const upcomingFirst = [...filtered].sort((a, b) =>
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  )

  useEffect(() => { loadEvents() }, [])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#0f0f0f]">
            Dashboard
          </h1>
          <p className="text-[#888] text-sm mt-1">Overview of all your scheduled weddings and events</p>
        </div>
        <button
          onClick={() => router.push('/admin/crm/new')}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#2563eb] text-white text-sm font-semibold rounded-xl hover:bg-[#1d4ed8] transition-all shadow-md"
        >
          <span>+</span> New Wedding
        </button>
      </div>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex gap-1 bg-white border border-[#dbeafe] rounded-xl p-1">
          {[
            { key: 'all',       label: 'All' },
            { key: 'upcoming',  label: 'Upcoming' },
            { key: 'active',    label: 'Active' },
            { key: 'completed', label: 'Completed' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === tab.key
                  ? 'bg-[#2563eb] text-white'
                  : 'text-[#666] hover:text-[#0f0f0f]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#aaa]"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search couples..."
            className="pl-9 pr-4 py-2 border border-[#dbeafe] rounded-xl text-sm text-[#0f0f0f] bg-white focus:outline-none focus:border-[#2563eb] transition-all w-64"
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Events', value: events.length },
          { label: 'Upcoming',     value: events.filter(e => getStatus(e) === 'upcoming').length },
          { label: 'Active',       value: events.filter(e => getStatus(e) === 'active').length },
          { label: 'Completed',    value: events.filter(e => getStatus(e) === 'completed').length },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-[#dbeafe] rounded-2xl p-5">
            <p className="text-3xl font-bold text-[#2563eb]">{stat.value}</p>
            <p className="text-sm text-[#888] mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-bold text-[#0f0f0f] mb-5">
        {filter === 'all' ? 'Upcoming Events' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Events`}
      </h2>

      {loading ? (
        <div className="text-center py-20 text-[#888]">Loading…</div>
      ) : upcomingFirst.length === 0 ? (
        <div className="text-center py-24 bg-white border border-[#dbeafe] rounded-2xl">
          <div className="w-14 h-14 bg-[#eff6ff] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </div>
          <p className="text-[#888]">No events found. Create your first wedding event.</p>
          <button
            onClick={() => router.push('/admin/crm/new')}
            className="mt-4 px-6 py-2.5 bg-[#2563eb] text-white text-sm font-semibold rounded-xl hover:bg-[#1d4ed8] transition-all"
          >
            + New Wedding
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {upcomingFirst.map(event => (
            <div key={event.id}
              className="bg-white border border-[#dbeafe] rounded-2xl overflow-hidden hover:shadow-lg transition-all">
              <div className="relative h-44 overflow-hidden">
                <img
                  src={getVenueImage(event.id)}
                  alt={event.coupleName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-[#0f0f0f] mb-3">
                  {event.coupleName}
                </h3>
                {event.location && (
                  <div className="text-sm text-[#888] mb-2 truncate">{event.location}</div>
                )}
                 <div className="text-sm text-[#888] mb-4">
                  {formatDate(event.startDate)} – {formatDate(event.endDate)}
                 </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#eff6ff]">
                  <button
                    onClick={() => router.push(`/admin/crm/${event.id}`)}
                    className="flex items-center gap-2 px-4 py-2 border border-[#dbeafe] rounded-lg text-sm text-[#333] hover:border-[#2563eb] hover:text-[#2563eb] transition-all"
                  >
                     Edit Event
                  </button>
                  <button
                    onClick={() => router.push(`/admin/crm/${event.id}`)}
                    className="text-[#aaa] hover:text-[#333] transition-all text-lg px-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="5" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="19" r="1" fill="currentColor"/></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
