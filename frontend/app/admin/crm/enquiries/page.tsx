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
  createdAt: string
}

const STATUS_STYLES: Record<string, string> = {
  NEW_REQUEST: 'bg-blue-500 text-white',
  CONTACTED:   'bg-orange-400 text-white',
  CONVERTED:   'bg-green-500 text-white',
  CANCELLED:   'bg-gray-300 text-gray-600',
}

const STATUS_LABELS: Record<string, string> = {
  NEW_REQUEST: 'New Request',
  CONTACTED:   'Contacted',
  CONVERTED:   'Converted',
  CANCELLED:   'Cancelled',
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins  = Math.floor(diff / 60000)
  const hrs   = Math.floor(mins / 60)
  const days  = Math.floor(hrs / 24)
  if (days > 6)  return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`
  if (days > 0)  return `${days} day${days > 1 ? 's' : ''} ago`
  if (hrs > 0)   return `${hrs} hr${hrs > 1 ? 's' : ''} ago`
  return `${mins} min${mins > 1 ? 's' : ''} ago`
}

export default function EnquiriesPage() {
  const router = useRouter()
  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [loading, setLoading]     = useState(true)
  const [updatingId, setUpdatingId] = useState<number | null>(null)

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
      setEnquiries(await res.json())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(id: number, status: string) {
    setUpdatingId(id)
    try {
      const res = await fetch(`${API}/api/crm/enquiries/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body:    JSON.stringify({ status })
      })
      const data = await res.json()
      setEnquiries(prev => prev.map(e => e.id === id ? data : e))
    } catch (err) {
      console.error(err)
    } finally {
      setUpdatingId(null)
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
          { label: 'Total',     value: enquiries.length,                                          color: 'text-[#7c3aed]' },
          { label: 'New',       value: enquiries.filter(e => e.status === 'NEW_REQUEST').length,  color: 'text-blue-500' },
          { label: 'Contacted', value: enquiries.filter(e => e.status === 'CONTACTED').length,    color: 'text-orange-400' },
          { label: 'Converted', value: enquiries.filter(e => e.status === 'CONVERTED').length,    color: 'text-green-500' },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-[#ede9fe] rounded-2xl p-5">
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-sm text-[#888] mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Pipeline */}
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
          {enquiries.map(enquiry => (
            <div
              key={enquiry.id}
              className={`bg-white border rounded-2xl px-6 py-5 transition-all ${
                enquiry.status === 'NEW_REQUEST' ? 'border-[#7c3aed] ring-1 ring-[#7c3aed]' : 'border-[#e8e5e0]'
              }`}
            >
              <div className="flex items-center justify-between flex-wrap gap-4">

                {/* Left — info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="font-bold text-[#0f0f0f] text-lg">{enquiry.coupleName}</h3>
                    <span className="text-xs bg-[#f0ede8] text-[#888] px-2.5 py-1 rounded-full">
                      Received {timeAgo(enquiry.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-[#888] flex-wrap">
                    {(enquiry.startDate || enquiry.endDate) && (
                      <span>
                        {formatDate(enquiry.startDate)}
                        {enquiry.endDate && enquiry.endDate !== enquiry.startDate && ` – ${formatDate(enquiry.endDate)}`}
                      </span>
                    )}
                    {enquiry.location && <span>{enquiry.location}</span>}
                    {enquiry.expectedGuests && <span>{enquiry.expectedGuests} Guests</span>}
                  </div>
                </div>

                {/* Right — actions */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  {enquiry.status === 'CONVERTED' ? (
                    <>
                      <span className={`px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5 ${STATUS_STYLES[enquiry.status]}`}>
                        <span className="w-2 h-2 rounded-full bg-white opacity-80" />
                        {STATUS_LABELS[enquiry.status]}
                      </span>
                      <button
                        onClick={() => router.push('/admin/crm')}
                        className="text-sm text-[#333] font-medium hover:text-[#7c3aed] transition-colors"
                      >
                        View Booking
                      </button>
                    </>
                  ) : (
                    <>
                      <span className={`px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5 ${STATUS_STYLES[enquiry.status]}`}>
                        <span className="w-2 h-2 rounded-full bg-white opacity-80" />
                        {STATUS_LABELS[enquiry.status]}
                      </span>

                      {/* Status dropdown */}
                      <select
                        value={enquiry.status}
                        onChange={e => updateStatus(enquiry.id, e.target.value)}
                        disabled={updatingId === enquiry.id}
                        className="border border-[#e8e5e0] rounded-lg px-3 py-1.5 text-sm text-[#333] focus:outline-none focus:border-[#7c3aed] transition-all"
                      >
                        <option value="NEW_REQUEST">New Request</option>
                        <option value="CONTACTED">Contacted</option>
                        <option value="CONVERTED">Converted</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>

                      <button
                        onClick={() => router.push(`/admin/crm/enquiries/${enquiry.id}`)}
                        className="text-sm text-[#333] font-medium hover:text-[#7c3aed] transition-colors"
                      >
                        Review
                      </button>

                      <button
                        onClick={() => deleteEnquiry(enquiry.id)}
                        className="text-sm text-red-400 font-medium hover:text-red-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}