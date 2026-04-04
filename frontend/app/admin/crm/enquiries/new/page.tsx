'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Photographer = {
  id: number
  name: string
  phone: string
  specialization?: string
}

const LEAD_SOURCES = ['Instagram', 'Facebook', 'Google', 'Referral', 'Wedding Fair', 'Website', 'Other']

export default function NewEnquiryPage() {
  const router = useRouter()

  const [photographers, setPhotographers] = useState<Photographer[]>([])
  const [saving, setSaving]               = useState(false)
  const [softBlocking, setSoftBlocking]   = useState(false)
  const [error, setError]                 = useState('')

  // Form fields
  const [coupleName, setCoupleName]               = useState('')
  const [phone, setPhone]                         = useState('')
  const [startDate, setStartDate]                 = useState('')
  const [endDate, setEndDate]                     = useState('')
  const [location, setLocation]                   = useState('')
  const [expectedGuests, setExpectedGuests]       = useState('')
  const [photographerId, setPhotographerId]       = useState('')
  const [leadSource, setLeadSource]               = useState('Instagram')
  const [followUpDays, setFollowUpDays]           = useState('3')
  const [description, setDescription]             = useState('')

  const API = process.env.NEXT_PUBLIC_API_URL

  function getToken() {
    return localStorage.getItem('pruview_token')
  }

  async function loadPhotographers() {
    try {
      const res = await fetch(`${API}/api/crm/photographers`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      setPhotographers(await res.json())
    } catch (err) {
      console.error(err)
    }
  }

  async function saveEnquiry(softBlock = false) {
    if (!coupleName.trim() || !phone.trim()) {
      setError('Couple name and phone number are required.')
      return
    }
    softBlock ? setSoftBlocking(true) : setSaving(true)
    setError('')

    try {
      const res = await fetch(`${API}/api/crm/enquiries`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body:    JSON.stringify({
          coupleName, phone, startDate, endDate,
          location, expectedGuests, photographerId,
          leadSource, followUpDays, description,
          status: 'NEW_REQUEST'
        })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message); return }

      // Send soft block WhatsApp if photographer selected
      if (softBlock && photographerId) {
        const photographer = photographers.find(p => p.id === parseInt(photographerId))
        if (photographer) {
          const dateStr = startDate ? new Date(startDate).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'long', year: 'numeric'
          }) : 'TBD'

          const message = `Hi ${photographer.name},

We have a potential booking enquiry and would like to do a soft block for your availability:

Couple: ${coupleName}
Date: ${dateStr}
Location: ${location || 'TBD'}
Expected Guests: ${expectedGuests || 'TBD'}

Please confirm if you are available for this date. This is a soft block — not a confirmed booking yet.

Thank you!
Pruview CRM`

          window.open(`https://wa.me/${photographer.phone}?text=${encodeURIComponent(message)}`, '_blank')
        }
      }

      router.push('/admin/crm/enquiries')
    } catch (err) {
      setError('Could not save enquiry.')
    } finally {
      setSaving(false)
      setSoftBlocking(false)
    }
  }

  useEffect(() => { loadPhotographers() }, [])

  const selectedPhotographer = photographers.find(p => p.id === parseInt(photographerId))

  return (
    <div className="p-8 max-w-3xl">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0f0f0f]">New Enquiry</h1>
        <p className="text-[#888] text-sm mt-1">Add details for a new wedding lead</p>
      </div>

      <div className="bg-white border border-[#e8e5e0] rounded-2xl p-8">
        <div className="grid grid-cols-2 gap-6">

          {/* Couple Name */}
          <div>
            <label className="block text-sm font-semibold text-[#333] mb-2">
              Couple Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={coupleName}
              onChange={e => setCoupleName(e.target.value)}
              placeholder="e.g. Isabella & Mason"
              className="w-full px-4 py-3 border border-[#e8e5e0] rounded-xl text-sm text-[#0f0f0f] focus:outline-none focus:border-[#7c3aed] transition-all"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-[#333] mb-2">
              Phone Number <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="w-full px-4 py-3 border border-[#e8e5e0] rounded-xl text-sm text-[#0f0f0f] focus:outline-none focus:border-[#7c3aed] transition-all"
            />
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-semibold text-[#333] mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-4 py-3 border border-[#e8e5e0] rounded-xl text-sm text-[#0f0f0f] focus:outline-none focus:border-[#7c3aed] transition-all"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-semibold text-[#333] mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-4 py-3 border border-[#e8e5e0] rounded-xl text-sm text-[#0f0f0f] focus:outline-none focus:border-[#7c3aed] transition-all"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-[#333] mb-2">Event Location</label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. The Plaza Hotel"
              className="w-full px-4 py-3 border border-[#e8e5e0] rounded-xl text-sm text-[#0f0f0f] focus:outline-none focus:border-[#7c3aed] transition-all"
            />
          </div>

          {/* Expected Guests */}
          <div>
            <label className="block text-sm font-semibold text-[#333] mb-2">Expected Guests</label>
            <input
              type="number"
              value={expectedGuests}
              onChange={e => setExpectedGuests(e.target.value)}
              placeholder="e.g. 150"
              className="w-full px-4 py-3 border border-[#e8e5e0] rounded-xl text-sm text-[#0f0f0f] focus:outline-none focus:border-[#7c3aed] transition-all"
            />
          </div>

          {/* Photographer */}
          <div>
            <label className="block text-sm font-semibold text-[#333] mb-2">Select Photographer</label>
            <select
              value={photographerId}
              onChange={e => setPhotographerId(e.target.value)}
              className="w-full px-4 py-3 border border-[#e8e5e0] rounded-xl text-sm text-[#0f0f0f] focus:outline-none focus:border-[#7c3aed] transition-all"
            >
              <option value="">Assign a photographer</option>
              {photographers.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {selectedPhotographer && (
              <p className="text-xs text-[#888] mt-1.5">
                +{selectedPhotographer.phone}
                {selectedPhotographer.specialization && ` · ${selectedPhotographer.specialization}`}
              </p>
            )}
          </div>

          {/* Lead Source */}
          <div>
            <label className="block text-sm font-semibold text-[#333] mb-2">Lead Source</label>
            <select
              value={leadSource}
              onChange={e => setLeadSource(e.target.value)}
              className="w-full px-4 py-3 border border-[#e8e5e0] rounded-xl text-sm text-[#0f0f0f] focus:outline-none focus:border-[#7c3aed] transition-all"
            >
              {LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Follow up days */}
          <div className="col-span-2">
            <label className="block text-sm font-semibold text-[#333] mb-2">
              Follow up notification (in days)
            </label>
            <input
              type="number"
              value={followUpDays}
              onChange={e => setFollowUpDays(e.target.value)}
              min="1"
              max="30"
              className="w-32 px-4 py-3 border border-[#e8e5e0] rounded-xl text-sm text-[#0f0f0f] focus:outline-none focus:border-[#7c3aed] transition-all"
            />
          </div>

          {/* Description */}
          <div className="col-span-2">
            <label className="block text-sm font-semibold text-[#333] mb-2">Brief Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              placeholder="Add any specific requirements or notes about the event style, traditions, or preferences..."
              className="w-full px-4 py-3 border border-[#e8e5e0] rounded-xl text-sm text-[#0f0f0f] focus:outline-none focus:border-[#7c3aed] transition-all resize-none"
            />
          </div>

        </div>

        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

        {/* Actions */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#f5f3ff]">
          <button
            onClick={() => router.push('/admin/crm/enquiries')}
            className="px-6 py-2.5 border border-[#e8e5e0] text-[#333] text-sm font-semibold rounded-xl hover:bg-[#f8f7f4] transition-all"
          >
            Cancel
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => saveEnquiry(true)}
              disabled={softBlocking || saving || !coupleName.trim() || !phone.trim() || !photographerId}
              className="px-6 py-2.5 border border-[#e8e5e0] text-[#333] text-sm font-semibold rounded-xl hover:bg-[#f8f7f4] disabled:opacity-40 transition-all"
            >
              {softBlocking ? 'Sending...' : 'Soft Block'}
            </button>
            <button
              onClick={() => saveEnquiry(false)}
              disabled={saving || softBlocking || !coupleName.trim() || !phone.trim()}
              className="px-6 py-2.5 bg-[#7c3aed] text-white text-sm font-semibold rounded-xl hover:bg-[#6d28d9] disabled:opacity-40 transition-all"
            >
              {saving ? 'Saving...' : 'Save Enquiry'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}