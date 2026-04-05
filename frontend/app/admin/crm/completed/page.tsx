'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Event = {
  id: number
  coupleName: string
  startDate: string
  endDate: string
  location?: string
  deliveryDeadline?: string
  completionDate?: string
  invoice?: { totalAmount: number; payments: { amount: number }[] }
  postProductionTasks: { status: string }[]
}

export default function CompletedPage() {
  const router = useRouter()
  const [events, setEvents]   = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('all')
  const [year, setYear]       = useState(new Date().getFullYear().toString())
  const [month, setMonth]     = useState((new Date().getMonth() + 1).toString())
  const [quarter, setQuarter] = useState('1')

  const API = process.env.NEXT_PUBLIC_API_URL

  function getToken() { return localStorage.getItem('pruview_token') }

  async function loadEvents() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ filter })
      if (filter === 'month')   { params.set('year', year); params.set('month', month) }
      if (filter === 'quarter') { params.set('year', year); params.set('quarter', quarter) }
      if (filter === 'year')    { params.set('year', year) }

      const res = await fetch(`${API}/api/crm/completed?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      if (res.status === 401) { router.push('/admin/login'); return }
      setEvents(await res.json())
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  function getTotalPaid(event: Event) {
    return event.invoice?.payments.reduce((sum, p) => sum + p.amount, 0) || 0
  }

  function formatDate(date?: string) {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const totalRevenue = events.reduce((sum, e) => sum + getTotalPaid(e), 0)

  useEffect(() => { loadEvents() }, [filter, year, month, quarter])

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const YEARS  = ['2024','2025','2026','2027']

  return (
    <div className="p-8">

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0f0f0f]">Completed Events</h1>
        <p className="text-[#888] text-sm mt-1">All fully delivered and paid events</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white border border-[#ede9fe] rounded-2xl p-5">
          <p className="text-3xl font-bold text-green-500">{events.length}</p>
          <p className="text-sm text-[#888] mt-1">Events Completed</p>
        </div>
        <div className="bg-white border border-[#ede9fe] rounded-2xl p-5">
          <p className="text-3xl font-bold text-[#7c3aed]">₹{totalRevenue.toLocaleString('en-IN')}</p>
          <p className="text-sm text-[#888] mt-1">Total Revenue</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex gap-1 bg-white border border-[#ede9fe] rounded-xl p-1">
          {[
            { key: 'all',        label: 'All Time' },
            { key: 'this-month', label: 'This Month' },
            { key: 'month',      label: 'By Month' },
            { key: 'quarter',    label: 'Quarterly' },
            { key: 'year',       label: 'Yearly' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === tab.key ? 'bg-[#7c3aed] text-white' : 'text-[#666] hover:text-[#0f0f0f]'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Year picker */}
        {['month','quarter','year'].includes(filter) && (
          <select value={year} onChange={e => setYear(e.target.value)}
            className="border border-[#e8e5e0] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#7c3aed] transition-all">
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        )}

        {/* Month picker */}
        {filter === 'month' && (
          <select value={month} onChange={e => setMonth(e.target.value)}
            className="border border-[#e8e5e0] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#7c3aed] transition-all">
            {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
        )}

        {/* Quarter picker */}
        {filter === 'quarter' && (
          <select value={quarter} onChange={e => setQuarter(e.target.value)}
            className="border border-[#e8e5e0] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#7c3aed] transition-all">
            {['1','2','3','4'].map(q => <option key={q} value={q}>Q{q}</option>)}
          </select>
        )}
      </div>

      {loading ? (
        <div className="text-center py-20 text-[#888]">Loading…</div>
      ) : events.length === 0 ? (
        <div className="text-center py-24 bg-white border border-[#ede9fe] rounded-2xl">
          <p className="text-[#888]">No completed events found for this period.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#ede9fe] rounded-2xl overflow-hidden">
          <div className="grid grid-cols-6 px-6 py-3 border-b border-[#f5f3ff] text-xs font-semibold text-[#888] uppercase tracking-wider">
            <span className="col-span-2">Couple</span>
            <span>Event Dates</span>
            <span>Completed</span>
            <span>Amount</span>
            <span>Tasks</span>
          </div>
          {events.map(event => (
            <div
              key={event.id}
              onClick={() => router.push(`/admin/crm/${event.id}`)}
              className="grid grid-cols-6 px-6 py-4 border-b border-[#f5f3ff] last:border-0 hover:bg-[#faf9ff] cursor-pointer transition-all items-center"
            >
              <div className="col-span-2">
                <p className="font-semibold text-[#0f0f0f]">{event.coupleName}</p>
                {event.location && <p className="text-xs text-[#888]">{event.location}</p>}
              </div>
              <p className="text-sm text-[#888]">
                {formatDate(event.startDate)}
              </p>
              <p className="text-sm text-[#888]">{formatDate(event.completionDate)}</p>
              <p className="text-sm font-semibold text-green-600">
                ₹{getTotalPaid(event).toLocaleString('en-IN')}
              </p>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs text-[#888]">
                  {event.postProductionTasks.filter(t => t.status === 'COMPLETED').length}/
                  {event.postProductionTasks.length}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}