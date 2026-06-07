'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Enquiry = {
  id: number
  coupleName: string
  phone: string
  startDate?: string
  endDate?: string
  location?: string
  expectedGuests?: number
  leadSource?: string
  status: string
  description?: string
  followUpDays?: number
  createdAt: string
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  NEW_REQUEST: { label: 'New Request', bg: 'bg-blue-50',   text: 'text-blue-600',   dot: 'bg-blue-500' },
  CONTACTED:   { label: 'Contacted',   bg: 'bg-amber-50',  text: 'text-amber-600',  dot: 'bg-amber-400' },
  FOLLOW_UP:   { label: 'Follow Up',   bg: 'bg-violet-50', text: 'text-violet-600', dot: 'bg-violet-500' },
  CONVERTED:   { label: 'Converted',   bg: 'bg-green-50',  text: 'text-green-600',  dot: 'bg-green-500' },
}

const LEAD_SOURCES = ['Instagram', 'Facebook', 'Google', 'Referral', 'Wedding Fair', 'Website', 'Other']

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  const hrs  = Math.floor(mins / 60)
  const days = Math.floor(hrs / 24)
  if (days > 6)  return `${Math.floor(days / 7)}w ago`
  if (days > 0)  return `${days}d ago`
  if (hrs > 0)   return `${hrs}h ago`
  return `${mins}m ago`
}

function formatDate(date?: string) {
  if (!date) return null
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function EnquiriesPage() {
  const router = useRouter()
  const [enquiries, setEnquiries]         = useState<Enquiry[]>([])
  const [loading, setLoading]             = useState(true)
  const [pendingStatus, setPendingStatus] = useState<Record<number, string>>({})
  const [savingId, setSavingId]           = useState<number | null>(null)
  const [editingId, setEditingId]         = useState<number | null>(null)

  const [editCoupleName, setEditCoupleName]     = useState('')
  const [editPhone, setEditPhone]               = useState('')
  const [editStartDate, setEditStartDate]       = useState('')
  const [editEndDate, setEditEndDate]           = useState('')
  const [editLocation, setEditLocation]         = useState('')
  const [editGuests, setEditGuests]             = useState('')
  const [editLeadSource, setEditLeadSource]     = useState('')
  const [editFollowUpDays, setEditFollowUpDays] = useState('')
  const [editDescription, setEditDescription]   = useState('')

  const API = process.env.NEXT_PUBLIC_API_URL
  function getToken() { return localStorage.getItem('pruview_token') }

  async function loadEnquiries() {
    try {
      const res = await fetch(`${API}/api/crm/enquiries`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      if (res.status === 401) { router.push('/admin/login'); return }
      const data = await res.json()
      setEnquiries(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function openEdit(enquiry: Enquiry) {
    setEditingId(enquiry.id)
    setEditCoupleName(enquiry.coupleName)
    setEditPhone(enquiry.phone)
    setEditStartDate(enquiry.startDate || '')
    setEditEndDate(enquiry.endDate || '')
    setEditLocation(enquiry.location || '')
    setEditGuests(enquiry.expectedGuests?.toString() || '')
    setEditLeadSource(enquiry.leadSource || 'Instagram')
    setEditFollowUpDays(enquiry.followUpDays?.toString() || '3')
    setEditDescription(enquiry.description || '')
  }

  async function saveEdit() {
    if (!editingId) return
    setSavingId(editingId)
    try {
      const res = await fetch(`${API}/api/crm/enquiries/${editingId}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body:    JSON.stringify({
          coupleName:     editCoupleName,
          phone:          editPhone,
          startDate:      editStartDate || null,
          endDate:        editEndDate || null,
          location:       editLocation || null,
          expectedGuests: editGuests ? parseInt(editGuests) : null,
          leadSource:     editLeadSource,
          followUpDays:   parseInt(editFollowUpDays),
          description:    editDescription || null,
        })
      })
      const data = await res.json()
      setEnquiries(prev => prev.map(e => e.id === editingId ? { ...e, ...data } : e))
      setEditingId(null)
    } catch (err) {
      console.error(err)
    } finally {
      setSavingId(null)
    }
  }

  async function saveStatus(id: number) {
    const newStatus = pendingStatus[id]
    if (!newStatus) return
    setSavingId(id)
    try {
      const res = await fetch(`${API}/api/crm/enquiries/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body:    JSON.stringify({ status: newStatus })
      })
      const data = await res.json()
      setEnquiries(prev => prev.map(e => e.id === id ? data : e))
      setPendingStatus(prev => { const n = { ...prev }; delete n[id]; return n })
    } catch (err) {
      console.error(err)
    } finally {
      setSavingId(null)
    }
  }

  async function deleteEnquiry(id: number) {
    if (!confirm('Delete this enquiry?')) return
    await fetch(`${API}/api/crm/enquiries/${id}`, {
      method:  'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    setEnquiries(prev => prev.filter(e => e.id !== id))
  }

  async function confirmEnquiry(id: number) {
    if (!confirm('Convert this enquiry to a confirmed event? This cannot be undone.')) return
    try {
      const res = await fetch(`${API}/api/crm/enquiries/${id}/confirm`, {
        method:  'PUT',
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      const data = await res.json()
      if (!res.ok) { alert(data.message); return }
      setEnquiries(prev => prev.filter(e => e.id !== id))
      router.push(`/admin/crm/${data.event.id}`)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => { loadEnquiries() }, [])

  return (
    <div className="p-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#0f0f0f]">Enquiries</h1>
          <p className="text-[#888] text-sm mt-1">Manage incoming leads and wedding requests</p>
        </div>
        <button
          onClick={() => router.push('/admin/crm/enquiries/new')}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#2563eb] text-white text-sm font-semibold rounded-xl hover:bg-[#1d4ed8] transition-all shadow-md"
        >
          + New Enquiry
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total',     value: enquiries.length,                                         color: 'text-[#2563eb]' },
          { label: 'New',       value: enquiries.filter(e => e.status === 'NEW_REQUEST').length, color: 'text-blue-500' },
          { label: 'Follow Up', value: enquiries.filter(e => e.status === 'FOLLOW_UP').length,   color: 'text-violet-500' },
          { label: 'Converted', value: enquiries.filter(e => e.status === 'CONVERTED').length,   color: 'text-green-500' },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-[#e8e5e0] rounded-2xl p-5">
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-sm text-[#888] mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <h2 className="text-base font-semibold text-[#0f0f0f] mb-4">Enquiry Pipeline</h2>

      {loading ? (
        <div className="text-center py-20 text-[#888]">Loading…</div>
      ) : enquiries.length === 0 ? (
        <div className="text-center py-24 bg-white border border-[#e8e5e0] rounded-2xl">
          <p className="text-[#888] mb-4">No enquiries yet.</p>
          <button
            onClick={() => router.push('/admin/crm/enquiries/new')}
            className="px-6 py-2.5 bg-[#2563eb] text-white text-sm font-semibold rounded-xl hover:bg-[#1d4ed8] transition-all"
          >
            + New Enquiry
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {enquiries.map(enquiry => {
            const cfg            = STATUS_CONFIG[enquiry.status] || STATUS_CONFIG.NEW_REQUEST
            const hasPending     = !!pendingStatus[enquiry.id]
            const selectedStatus = pendingStatus[enquiry.id] || enquiry.status
            const isEditing      = editingId === enquiry.id
            const isConverted    = enquiry.status === 'CONVERTED'

            return (
              <div
                key={enquiry.id}
                className="bg-white border border-[#e8e5e0] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* ── Info row ── */}
                <div className="px-6 pt-5 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                        <h3 className="font-bold text-[#0f0f0f] text-lg leading-tight">{enquiry.coupleName}</h3>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                        <span className="text-xs text-[#bbb]">{timeAgo(enquiry.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-[#777] flex-wrap">
                        {enquiry.phone && (
                          <span className="flex items-center gap-1.5">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.6 3.35 2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.39 16z"/></svg>
                            {enquiry.phone}
                          </span>
                        )}
                        {(enquiry.startDate || enquiry.endDate) && (
                          <span className="flex items-center gap-1.5">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            {formatDate(enquiry.startDate)}
                            {enquiry.endDate && enquiry.endDate !== enquiry.startDate && ` – ${formatDate(enquiry.endDate)}`}
                          </span>
                        )}
                        {enquiry.location && (
                          <span className="flex items-center gap-1.5">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                            {enquiry.location}
                          </span>
                        )}
                        {enquiry.expectedGuests && <span>{enquiry.expectedGuests} guests</span>}
                        {enquiry.leadSource && (
                          <span className="text-xs bg-[#f0ede8] text-[#888] px-2 py-0.5 rounded-full">{enquiry.leadSource}</span>
                        )}
                      </div>
                      {enquiry.description && (
                        <p className="mt-2 text-sm text-[#999] line-clamp-1">{enquiry.description}</p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!isConverted && (
                        <button
                          onClick={() => isEditing ? setEditingId(null) : openEdit(enquiry)}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-[#e8e5e0] text-[#555] text-xs font-semibold rounded-lg hover:border-[#2563eb] hover:text-[#2563eb] transition-all"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          {isEditing ? 'Cancel Edit' : 'Edit Details'}
                        </button>
                      )}
                      {isConverted && (
                        <button
                          onClick={() => router.push('/admin/crm')}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-[#e8e5e0] text-[#2563eb] text-xs font-semibold rounded-lg hover:bg-[#eff6ff] transition-all"
                        >
                          View Booking
                        </button>
                      )}
                      <button
                        onClick={() => deleteEnquiry(enquiry.id)}
                        className="flex items-center gap-1 px-3 py-1.5 border border-red-100 text-red-400 text-xs font-semibold rounded-lg hover:bg-red-50 transition-all"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── Status update bar ── */}
                {!isConverted && (
                  <div className="px-6 py-3 bg-[#fafafa] border-t border-[#f0ede8] flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-semibold text-[#555]">Update Status:</span>

                    {['NEW_REQUEST', 'CONTACTED', 'FOLLOW_UP'].map(status => {
                      const s        = STATUS_CONFIG[status]
                      const isActive = selectedStatus === status
                      return (
                        <button
                          key={status}
                          onClick={() => {
                            if (status === enquiry.status) {
                              setPendingStatus(prev => { const n = { ...prev }; delete n[enquiry.id]; return n })
                            } else {
                              setPendingStatus(prev => ({ ...prev, [enquiry.id]: status }))
                            }
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            isActive
                              ? `${s.bg} ${s.text} border-current`
                              : 'bg-white text-[#888] border-[#e8e5e0] hover:border-[#aaa]'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? s.dot : 'bg-[#ccc]'}`} />
                          {s.label}
                        </button>
                      )
                    })}

                    <button
                      onClick={() => saveStatus(enquiry.id)}
                      disabled={!hasPending || savingId === enquiry.id}
                      className="px-4 py-1.5 bg-[#2563eb] text-white text-xs font-semibold rounded-lg disabled:opacity-30 hover:bg-[#1d4ed8] disabled:cursor-not-allowed transition-all"
                    >
                      {savingId === enquiry.id && !isEditing ? 'Saving…' : 'Save Status'}
                    </button>

                    <div className="w-px h-5 bg-[#e8e5e0] mx-1" />

                    <button
                      onClick={() => confirmEnquiry(enquiry.id)}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-green-500 text-white text-xs font-semibold rounded-lg hover:bg-green-600 transition-all"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      Confirm as Event
                    </button>
                  </div>
                )}

                {/* ── Edit form ── */}
                {isEditing && (
                  <div className="px-6 pb-6 border-t border-[#dbeafe] bg-[#fafeff]">
                    <p className="text-xs font-semibold text-[#2563eb] uppercase tracking-wider mt-5 mb-4 flex items-center gap-2">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      Edit Enquiry Details
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#555] mb-1.5">Couple Name</label>
                        <input type="text" value={editCoupleName} onChange={e => setEditCoupleName(e.target.value)}
                          className="w-full px-3 py-2.5 border border-[#e8e5e0] rounded-lg text-sm focus:outline-none focus:border-[#2563eb] transition-all bg-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#555] mb-1.5">Phone Number</label>
                        <input type="text" value={editPhone} onChange={e => setEditPhone(e.target.value)}
                          className="w-full px-3 py-2.5 border border-[#e8e5e0] rounded-lg text-sm focus:outline-none focus:border-[#2563eb] transition-all bg-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#555] mb-1.5">Start Date</label>
                        <input type="date" value={editStartDate} onChange={e => setEditStartDate(e.target.value)}
                          className="w-full px-3 py-2.5 border border-[#e8e5e0] rounded-lg text-sm focus:outline-none focus:border-[#2563eb] transition-all bg-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#555] mb-1.5">End Date</label>
                        <input type="date" value={editEndDate} onChange={e => setEditEndDate(e.target.value)}
                          className="w-full px-3 py-2.5 border border-[#e8e5e0] rounded-lg text-sm focus:outline-none focus:border-[#2563eb] transition-all bg-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#555] mb-1.5">Location</label>
                        <input type="text" value={editLocation} onChange={e => setEditLocation(e.target.value)}
                          className="w-full px-3 py-2.5 border border-[#e8e5e0] rounded-lg text-sm focus:outline-none focus:border-[#2563eb] transition-all bg-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#555] mb-1.5">Expected Guests</label>
                        <input type="number" value={editGuests} onChange={e => setEditGuests(e.target.value)}
                          className="w-full px-3 py-2.5 border border-[#e8e5e0] rounded-lg text-sm focus:outline-none focus:border-[#2563eb] transition-all bg-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#555] mb-1.5">Lead Source</label>
                        <select value={editLeadSource} onChange={e => setEditLeadSource(e.target.value)}
                          className="w-full px-3 py-2.5 border border-[#e8e5e0] rounded-lg text-sm focus:outline-none focus:border-[#2563eb] transition-all bg-white">
                          {LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#555] mb-1.5">Follow Up Days</label>
                        <input type="number" value={editFollowUpDays} onChange={e => setEditFollowUpDays(e.target.value)}
                          className="w-full px-3 py-2.5 border border-[#e8e5e0] rounded-lg text-sm focus:outline-none focus:border-[#2563eb] transition-all bg-white" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-semibold text-[#555] mb-1.5">Description / Notes</label>
                        <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={3}
                          className="w-full px-3 py-2.5 border border-[#e8e5e0] rounded-lg text-sm focus:outline-none focus:border-[#2563eb] transition-all resize-none bg-white" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-5">
                      <button onClick={() => setEditingId(null)}
                        className="px-5 py-2 border border-[#e8e5e0] text-[#555] text-sm font-semibold rounded-lg hover:bg-[#EDE8D0] transition-all">
                        Cancel
                      </button>
                      <button onClick={saveEdit} disabled={savingId === enquiry.id}
                        className="px-5 py-2 bg-[#2563eb] text-white text-sm font-semibold rounded-lg hover:bg-[#1d4ed8] disabled:opacity-40 transition-all">
                        {savingId === enquiry.id ? 'Saving…' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
