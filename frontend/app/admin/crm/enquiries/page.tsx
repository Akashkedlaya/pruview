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

const STATUS_STYLES: Record<string, string> = {
  NEW_REQUEST: 'bg-blue-500 text-white',
  CONTACTED:   'bg-orange-400 text-white',
  FOLLOW_UP:   'bg-purple-500 text-white',
  CONVERTED:   'bg-green-500 text-white',
}

const STATUS_LABELS: Record<string, string> = {
  NEW_REQUEST: 'New Request',
  CONTACTED:   'Contacted',
  FOLLOW_UP:   'Follow Up',
  CONVERTED:   'Converted',
}

const LEAD_SOURCES = ['Instagram', 'Facebook', 'Google', 'Referral', 'Wedding Fair', 'Website', 'Other']

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  const hrs  = Math.floor(mins / 60)
  const days = Math.floor(hrs / 24)
  if (days > 6)  return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`
  if (days > 0)  return `${days} day${days > 1 ? 's' : ''} ago`
  if (hrs > 0)   return `${hrs} hr${hrs > 1 ? 's' : ''} ago`
  return `${mins} min${mins > 1 ? 's' : ''} ago`
}

export default function EnquiriesPage() {
  const router = useRouter()
  const [enquiries, setEnquiries]         = useState<Enquiry[]>([])
  const [loading, setLoading]             = useState(true)
  const [pendingStatus, setPendingStatus] = useState<Record<number, string>>({})
  const [savingId, setSavingId]           = useState<number | null>(null)
  const [editingId, setEditingId]         = useState<number | null>(null)

  // Edit form state
  const [editCoupleName, setEditCoupleName]       = useState('')
  const [editPhone, setEditPhone]                 = useState('')
  const [editStartDate, setEditStartDate]         = useState('')
  const [editEndDate, setEditEndDate]             = useState('')
  const [editLocation, setEditLocation]           = useState('')
  const [editGuests, setEditGuests]               = useState('')
  const [editLeadSource, setEditLeadSource]       = useState('')
  const [editFollowUpDays, setEditFollowUpDays]   = useState('')
  const [editDescription, setEditDescription]     = useState('')

  const API = process.env.NEXT_PUBLIC_API_URL

  function getToken() {
    return localStorage.getItem('pruview_token')
  }

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

  function formatDate(date?: string) {
    if (!date) return null
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  function handleStatusChange(id: number, currentStatus: string, newStatus: string) {
    if (newStatus === currentStatus) {
      setPendingStatus(prev => { const n = { ...prev }; delete n[id]; return n })
    } else {
      setPendingStatus(prev => ({ ...prev, [id]: newStatus }))
    }
  }

  useEffect(() => { loadEnquiries() }, [])

  return (
    <div className="p-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-[#0f0f0f]">Enquiries</h1>
          <p className="text-[#888] text-sm mt-1">Manage incoming leads and wedding requests</p>
        </div>
        <button
          onClick={() => router.push('/admin/crm/enquiries/new')}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#7c3aed] text-white text-sm font-semibold rounded-xl hover:bg-[#6d28d9] transition-all shadow-md"
        >
          + New Enquiry
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mt-6 mb-8">
        {[
          { label: 'Total',     value: enquiries.length,                                         color: 'text-[#7c3aed]' },
          { label: 'New',       value: enquiries.filter(e => e.status === 'NEW_REQUEST').length, color: 'text-blue-500' },
          { label: 'Follow Up', value: enquiries.filter(e => e.status === 'FOLLOW_UP').length,   color: 'text-purple-500' },
          { label: 'Converted', value: enquiries.filter(e => e.status === 'CONVERTED').length,   color: 'text-green-500' },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-[#ede9fe] rounded-2xl p-5">
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-sm text-[#888] mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-bold text-[#0f0f0f] mb-4">Enquiry Pipeline</h2>

      {loading ? (
        <div className="text-center py-20 text-[#888]">Loading…</div>
      ) : enquiries.length === 0 ? (
        <div className="text-center py-24 bg-white border border-[#ede9fe] rounded-2xl">
          <p className="text-[#888] mb-4">No enquiries yet.</p>
          <button
            onClick={() => router.push('/admin/crm/enquiries/new')}
            className="px-6 py-2.5 bg-[#7c3aed] text-white text-sm font-semibold rounded-xl hover:bg-[#6d28d9] transition-all"
          >
            + New Enquiry
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {enquiries.map(enquiry => {
            const hasPending           = !!pendingStatus[enquiry.id]
            const currentDisplayStatus = pendingStatus[enquiry.id] || enquiry.status
            const isEditing            = editingId === enquiry.id

            return (
              <div
                key={enquiry.id}
                className={`bg-white border rounded-2xl overflow-hidden transition-all ${
                  enquiry.status === 'NEW_REQUEST' ? 'border-[#7c3aed] ring-1 ring-[#7c3aed]' : 'border-[#e8e5e0]'
                }`}
              >
                {/* Main row */}
                <div className="px-6 py-5 flex items-center justify-between flex-wrap gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-bold text-[#0f0f0f] text-lg">{enquiry.coupleName}</h3>
                      <span className="text-xs bg-[#f0ede8] text-[#888] px-2.5 py-1 rounded-full">
                        Received {timeAgo(enquiry.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-[#888] flex-wrap">
                      {(enquiry.startDate || enquiry.endDate) && (
                        <span>{formatDate(enquiry.startDate)}{enquiry.endDate && enquiry.endDate !== enquiry.startDate && ` – ${formatDate(enquiry.endDate)}`}</span>
                      )}
                      {enquiry.location && <span>{enquiry.location}</span>}
                      {enquiry.expectedGuests && <span>{enquiry.expectedGuests} Guests</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${STATUS_STYLES[enquiry.status]}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-white opacity-80" />
                      {STATUS_LABELS[enquiry.status]}
                    </span>

                    {enquiry.status !== 'CONVERTED' ? (
                      <>
                        <select
                          value={currentDisplayStatus}
                          onChange={e => handleStatusChange(enquiry.id, enquiry.status, e.target.value)}
                          className="border border-[#e8e5e0] rounded-lg px-3 py-1.5 text-sm text-[#333] focus:outline-none focus:border-[#7c3aed] transition-all"
                        >
                          <option value="NEW_REQUEST">New Request</option>
                          <option value="CONTACTED">Contacted</option>
                          <option value="FOLLOW_UP">Follow Up</option>
                          <option value="CONVERTED">Converted</option>
                        </select>

                        <button
                          onClick={() => saveStatus(enquiry.id)}
                          disabled={!hasPending || savingId === enquiry.id}
                          className="px-4 py-1.5 bg-[#7c3aed] text-white text-sm font-semibold rounded-lg disabled:opacity-30 hover:bg-[#6d28d9] transition-all"
                        >
                          {savingId === enquiry.id ? 'Saving…' : 'Save'}
                        </button>

                        <button
                          onClick={() => isEditing ? setEditingId(null) : openEdit(enquiry)}
                          className="px-4 py-1.5 border border-[#e8e5e0] text-[#333] text-sm font-semibold rounded-lg hover:border-[#7c3aed] hover:text-[#7c3aed] transition-all"
                        >
                          {isEditing ? 'Cancel' : 'Edit'}
                        </button>

                        <button
                          onClick={() => deleteEnquiry(enquiry.id)}
                          className="px-4 py-1.5 border border-red-100 text-red-400 text-sm font-semibold rounded-lg hover:bg-red-50 transition-all"
                        >
                          Delete
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => isEditing ? setEditingId(null) : openEdit(enquiry)}
                          className="px-4 py-1.5 border border-[#e8e5e0] text-[#333] text-sm font-semibold rounded-lg hover:border-[#7c3aed] hover:text-[#7c3aed] transition-all"
                        >
                          {isEditing ? 'Cancel' : 'Edit'}
                        </button>
                        <button
                          onClick={() => router.push('/admin/crm')}
                          className="text-sm text-[#7c3aed] font-medium hover:underline transition-colors"
                        >
                          View Booking
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Edit form */}
                {isEditing && (
                  <div className="px-6 pb-6 border-t border-[#f5f3ff]">
                    <p className="text-xs font-semibold text-[#888] uppercase tracking-wider mt-5 mb-4">Edit Enquiry Details</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#555] mb-1.5">Couple Name</label>
                        <input type="text" value={editCoupleName} onChange={e => setEditCoupleName(e.target.value)}
                          className="w-full px-3 py-2.5 border border-[#e8e5e0] rounded-lg text-sm focus:outline-none focus:border-[#7c3aed] transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#555] mb-1.5">Phone Number</label>
                        <input type="text" value={editPhone} onChange={e => setEditPhone(e.target.value)}
                          className="w-full px-3 py-2.5 border border-[#e8e5e0] rounded-lg text-sm focus:outline-none focus:border-[#7c3aed] transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#555] mb-1.5">Start Date</label>
                        <input type="date" value={editStartDate} onChange={e => setEditStartDate(e.target.value)}
                          className="w-full px-3 py-2.5 border border-[#e8e5e0] rounded-lg text-sm focus:outline-none focus:border-[#7c3aed] transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#555] mb-1.5">End Date</label>
                        <input type="date" value={editEndDate} onChange={e => setEditEndDate(e.target.value)}
                          className="w-full px-3 py-2.5 border border-[#e8e5e0] rounded-lg text-sm focus:outline-none focus:border-[#7c3aed] transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#555] mb-1.5">Location</label>
                        <input type="text" value={editLocation} onChange={e => setEditLocation(e.target.value)}
                          className="w-full px-3 py-2.5 border border-[#e8e5e0] rounded-lg text-sm focus:outline-none focus:border-[#7c3aed] transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#555] mb-1.5">Expected Guests</label>
                        <input type="number" value={editGuests} onChange={e => setEditGuests(e.target.value)}
                          className="w-full px-3 py-2.5 border border-[#e8e5e0] rounded-lg text-sm focus:outline-none focus:border-[#7c3aed] transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#555] mb-1.5">Lead Source</label>
                        <select value={editLeadSource} onChange={e => setEditLeadSource(e.target.value)}
                          className="w-full px-3 py-2.5 border border-[#e8e5e0] rounded-lg text-sm focus:outline-none focus:border-[#7c3aed] transition-all">
                          {LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#555] mb-1.5">Follow Up Days</label>
                        <input type="number" value={editFollowUpDays} onChange={e => setEditFollowUpDays(e.target.value)}
                          className="w-full px-3 py-2.5 border border-[#e8e5e0] rounded-lg text-sm focus:outline-none focus:border-[#7c3aed] transition-all" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-semibold text-[#555] mb-1.5">Description</label>
                        <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={3}
                          className="w-full px-3 py-2.5 border border-[#e8e5e0] rounded-lg text-sm focus:outline-none focus:border-[#7c3aed] transition-all resize-none" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                      <button onClick={() => setEditingId(null)}
                        className="px-5 py-2 border border-[#e8e5e0] text-[#333] text-sm font-semibold rounded-lg hover:bg-[#f8f7f4] transition-all">
                        Cancel
                      </button>
                      <button onClick={saveEdit} disabled={savingId === enquiry.id}
                        className="px-5 py-2 bg-[#7c3aed] text-white text-sm font-semibold rounded-lg hover:bg-[#6d28d9] disabled:opacity-40 transition-all">
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