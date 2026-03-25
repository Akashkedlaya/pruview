'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewEvent() {
  const router = useRouter()
  const [coupleName, setCoupleName] = useState('')
  const [startDate, setStartDate]   = useState('')
  const [endDate, setEndDate]       = useState('')
  const [location, setLocation]     = useState('')
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')

  const API = process.env.NEXT_PUBLIC_API_URL

  function getToken() {
    return localStorage.getItem('pruview_token')
  }

  async function createEvent() {
    if (!coupleName.trim() || !startDate || !endDate) {
      setError('Couple name, start and end date are required.')
      return
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError('End date must be after start date.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`${API}/api/crm/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ coupleName, startDate, endDate, location })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message); return }
      router.push(`/admin/crm/${data.id}`)
    } catch (err) {
      setError('Could not create event.')
    } finally {
      setSaving(false)
    }
  }

  // Preview days
  function getDayCount() {
    if (!startDate || !endDate) return 0
    const diff = new Date(endDate).getTime() - new Date(startDate).getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4]">

      {/* Nav */}
      <nav className="bg-[#0f0f0f] px-8 py-4 flex items-center gap-4">
        <button onClick={() => router.push('/admin/crm')}
          className="text-[#666] hover:text-white text-sm transition-colors">
          ← Back
        </button>
        <span className="text-white text-xl font-semibold" style={{ fontFamily: 'Georgia, serif' }}>
          pru<span className="text-[#e8c547]">view</span>
          <span className="text-[#666] text-sm ml-3">/ CRM / New Event</span>
        </span>
      </nav>

      <div className="max-w-2xl mx-auto px-8 py-12">
        <h1 className="text-3xl font-semibold text-[#0f0f0f] mb-2" style={{ fontFamily: 'Georgia, serif' }}>
          Create New Event
        </h1>
        <p className="text-[#888] text-sm mb-10">
          Day tabs will be auto-generated from your dates.
        </p>

        <div className="bg-white border border-[#e8e5e0] rounded-2xl p-8">
          <div className="flex flex-col gap-6">

            <div>
              <label className="block text-xs font-semibold tracking-widest uppercase text-[#555] mb-2">
                Couple Name *
              </label>
              <input
                type="text"
                value={coupleName}
                onChange={e => setCoupleName(e.target.value)}
                placeholder="Couple Name"
                className="w-full px-4 py-3 border border-[#e0ddd8] rounded-xl text-sm text-[#0f0f0f] focus:outline-none focus:border-[#c8a020] focus:ring-1 focus:ring-[#c8a020] transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold tracking-widest uppercase text-[#555] mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 border border-[#e0ddd8] rounded-xl text-sm text-[#0f0f0f] focus:outline-none focus:border-[#c8a020] transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-widest uppercase text-[#555] mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 border border-[#e0ddd8] rounded-xl text-sm text-[#0f0f0f] focus:outline-none focus:border-[#c8a020] transition-all"
                />
              </div>
            </div>

            {getDayCount() > 0 && (
              <div className="bg-[#f8f7f4] border border-[#e8e5e0] rounded-xl px-4 py-3">
                <p className="text-sm text-[#888]">
                  ✅ Will auto-generate <span className="font-semibold text-[#0f0f0f]">{getDayCount()} day{getDayCount() > 1 ? 's' : ''}</span> with Morning, Afternoon and Evening slots each.
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold tracking-widest uppercase text-[#555] mb-2">
                Location (optional)
              </label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Taj Hotel, Mumbai"
                className="w-full px-4 py-3 border border-[#e0ddd8] rounded-xl text-sm text-[#0f0f0f] focus:outline-none focus:border-[#c8a020] transition-all"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <button
              onClick={createEvent}
              disabled={saving || !coupleName.trim() || !startDate || !endDate}
              className="w-full py-3 bg-[#0f0f0f] text-white text-sm font-semibold rounded-xl hover:bg-[#222] disabled:opacity-40 transition-all"
            >
              {saving ? 'Creating…' : 'Create Event →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}