'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

type Photographer = {
  id: number
  name: string
  phone: string
  specialization?: string
}

const LEAD_SOURCES  = ['Instagram', 'Facebook', 'Google', 'Referral', 'Wedding Fair', 'Website', 'Other']
const EVENT_TYPES   = ['Wedding', 'Engagement', 'Pre-Wedding', 'Reception', 'Birthday', 'Corporate', 'Other']

export default function NewEnquiryPage() {
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [photographers, setPhotographers]     = useState<Photographer[]>([])
  const [saving, setSaving]                   = useState(false)
  const [softBlocking, setSoftBlocking]       = useState(false)
  const [error, setError]                     = useState('')
  const [dropdownOpen, setDropdownOpen]       = useState(false)

  const [coupleName, setCoupleName]           = useState('')
  const [eventName, setEventName]             = useState('')
  const [phone, setPhone]                     = useState('')
  const [startDate, setStartDate]             = useState('')
  const [endDate, setEndDate]                 = useState('')
  const [location, setLocation]               = useState('')
  const [expectedGuests, setExpectedGuests]   = useState('')
  const [photographerIds, setPhotographerIds] = useState<number[]>([])
  const [packageDetails, setPackageDetails]   = useState('')
  const [estimatedCost, setEstimatedCost]     = useState('')
  const [leadSource, setLeadSource]           = useState('Instagram')
  const [followUpDays, setFollowUpDays]       = useState('3')
  const [description, setDescription]         = useState('')

  const API = process.env.NEXT_PUBLIC_API_URL

  function getToken() { return localStorage.getItem('pruview_token') }

  async function loadPhotographers() {
    try {
      const res = await fetch(`${API}/api/crm/photographers`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      setPhotographers(await res.json())
    } catch (err) { console.error(err) }
  }

  function togglePhotographer(id: number) {
    setPhotographerIds(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
          coupleName, phone, startDate, endDate, location,
          expectedGuests, packageDetails: eventName || packageDetails,
          estimatedCost, leadSource, followUpDays, description,
          status: 'NEW_REQUEST'
        })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message); return }

      if (softBlock && photographerIds.length > 0) {
        for (const pid of photographerIds) {
          const photographer = photographers.find(p => p.id === pid)
          if (photographer) {
            const dateStr = startDate
              ? new Date(startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
              : 'TBD'
            const message = `Hi ${photographer.name},\n\nWe have a potential booking and would like to soft block your availability:\n\nCouple: ${coupleName}\nEvent: ${eventName || 'TBD'}\nDate: ${dateStr}\nLocation: ${location || 'TBD'}\nExpected Guests: ${expectedGuests || 'TBD'}\n\nPlease confirm if you are available.\n\nThank you!\nPruview CRM`
            window.open(`https://wa.me/${photographer.phone}?text=${encodeURIComponent(message)}`, '_blank')
            if (photographerIds.length > 1) await new Promise(r => setTimeout(r, 800))
          }
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

  const selectedNames = photographers.filter(p => photographerIds.includes(p.id)).map(p => p.name)

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0f0f0f]">New Enquiry</h1>
        <p className="text-sm mt-1" style={{ color: '#666' }}>Add details for a new wedding lead</p>
      </div>

      <div className="bg-white border border-[#e8e5e0] rounded-2xl p-8">
        <div className="grid grid-cols-2 gap-6">

          {/* Couple Name */}
          <div>
            <label className="block text-sm font-semibold text-[#333] mb-2">Couple Name <span className="text-red-400">*</span></label>
            <input type="text" value={coupleName} onChange={e => setCoupleName(e.target.value)}
              placeholder="Isabella & Mason"
              className="w-full px-4 py-3 border border-[#e8e5e0] rounded-xl text-sm text-[#0f0f0f] placeholder-[#999] focus:outline-none focus:border-[#2563eb] transition-all" />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-[#333] mb-2">Phone Number <span className="text-red-400">*</span></label>
            <input type="text" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-4 py-3 border border-[#e8e5e0] rounded-xl text-sm text-[#0f0f0f] placeholder-[#999] focus:outline-none focus:border-[#2563eb] transition-all" />
          </div>

          {/* Event Name */}
          <div className="col-span-2">
            <label className="block text-sm font-semibold text-[#333] mb-2">Event Name</label>
            <select value={eventName} onChange={e => setEventName(e.target.value)}
              className="w-full px-4 py-3 border border-[#e8e5e0] rounded-xl text-sm text-[#0f0f0f] focus:outline-none focus:border-[#2563eb] transition-all">
              <option value="">Select event type...</option>
              {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-semibold text-[#333] mb-2">Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="w-full px-4 py-3 border border-[#e8e5e0] rounded-xl text-sm text-[#0f0f0f] focus:outline-none focus:border-[#2563eb] transition-all" />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-semibold text-[#333] mb-2">End Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="w-full px-4 py-3 border border-[#e8e5e0] rounded-xl text-sm text-[#0f0f0f] focus:outline-none focus:border-[#2563eb] transition-all" />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-[#333] mb-2">Event Location</label>
            <input type="text" value={location} onChange={e => setLocation(e.target.value)}
              placeholder="The Plaza Hotel, Mumbai"
              className="w-full px-4 py-3 border border-[#e8e5e0] rounded-xl text-sm text-[#0f0f0f] placeholder-[#999] focus:outline-none focus:border-[#2563eb] transition-all" />
          </div>

          {/* Expected Guests */}
          <div>
            <label className="block text-sm font-semibold text-[#333] mb-2">Expected Guests</label>
            <input type="number" value={expectedGuests} onChange={e => setExpectedGuests(e.target.value)}
              placeholder="150"
              className="w-full px-4 py-3 border border-[#e8e5e0] rounded-xl text-sm text-[#0f0f0f] placeholder-[#999] focus:outline-none focus:border-[#2563eb] transition-all" />
          </div>

          {/* Estimated Cost */}
          <div>
            <label className="block text-sm font-semibold text-[#333] mb-2">Estimated Cost (₹)</label>
            <input type="number" value={estimatedCost} onChange={e => setEstimatedCost(e.target.value)}
              placeholder="150000"
              className="w-full px-4 py-3 border border-[#e8e5e0] rounded-xl text-sm text-[#0f0f0f] placeholder-[#999] focus:outline-none focus:border-[#2563eb] transition-all" />
          </div>

          {/* Lead Source */}
          <div>
            <label className="block text-sm font-semibold text-[#333] mb-2">Lead Source</label>
            <select value={leadSource} onChange={e => setLeadSource(e.target.value)}
              className="w-full px-4 py-3 border border-[#e8e5e0] rounded-xl text-sm text-[#0f0f0f] focus:outline-none focus:border-[#2563eb] transition-all">
              {LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Photographers — click to open dropdown */}
          <div className="col-span-2" ref={dropdownRef}>
            <label className="block text-sm font-semibold text-[#333] mb-2">
              Select Photographers
              {photographerIds.length > 0 && (
                <span className="ml-2 text-[#2563eb] font-normal text-xs">
                  ({photographerIds.length} selected)
                </span>
              )}
            </label>

            {/* Trigger button */}
            <button
              type="button"
              onClick={() => setDropdownOpen(prev => !prev)}
              className="w-full px-4 py-3 border border-[#e8e5e0] rounded-xl text-sm text-left focus:outline-none focus:border-[#2563eb] transition-all flex items-center justify-between"
              style={{ color: selectedNames.length ? '#0f0f0f' : '#999' }}
            >
              <span className="truncate">
                {selectedNames.length > 0 ? selectedNames.join(', ') : 'Click to select photographers...'}
              </span>
              <span className="text-[#aaa] ml-2">{dropdownOpen ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg> : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>}</span>
            </button>

            {/* Dropdown list */}
            {dropdownOpen && (
              <div className="absolute z-50 mt-1 w-full max-w-lg bg-white border border-[#dbeafe] rounded-xl shadow-lg overflow-hidden"
                style={{ maxHeight: '240px', overflowY: 'auto' }}>
                {photographers.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-[#aaa]">No photographers added yet.</div>
                ) : (
                  photographers.map((p, index) => (
                    <div
                      key={p.id}
                      onClick={() => togglePhotographer(p.id)}
                      className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-all ${
                        index !== photographers.length - 1 ? 'border-b border-[#f0ede8]' : ''
                      } ${photographerIds.includes(p.id) ? 'bg-[#dbeafe]' : 'hover:bg-[#eff6ff]'}`}
                    >
                      <div>
                        <p className="text-sm font-medium text-[#0f0f0f]">{p.name}</p>
                        <p className="text-xs text-[#888]">
                          +{p.phone}{p.specialization && ` · ${p.specialization}`}
                        </p>
                      </div>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        photographerIds.includes(p.id) ? 'border-[#2563eb] bg-[#2563eb]' : 'border-[#e0ddd8]'
                      }`}>
                        {photographerIds.includes(p.id) && (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {photographerIds.length > 0 && (
              <p className="text-xs text-[#2563eb] mt-1.5">
                Soft Block will send WhatsApp to {photographerIds.length} photographer{photographerIds.length > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Follow up */}
          <div>
            <label className="block text-sm font-semibold text-[#333] mb-2">Follow up (in days)</label>
            <input type="number" value={followUpDays} onChange={e => setFollowUpDays(e.target.value)}
              min="1" max="30"
              className="w-full px-4 py-3 border border-[#e8e5e0] rounded-xl text-sm text-[#0f0f0f] focus:outline-none focus:border-[#2563eb] transition-all" />
          </div>

          {/* Description */}
          <div className="col-span-2">
            <label className="block text-sm font-semibold text-[#333] mb-2">Brief Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              placeholder="Any specific requirements, traditions, or preferences..."
              className="w-full px-4 py-3 border border-[#e8e5e0] rounded-xl text-sm text-[#0f0f0f] placeholder-[#999] focus:outline-none focus:border-[#2563eb] transition-all resize-none" />
          </div>

        </div>

        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#eff6ff]">
          <button onClick={() => router.push('/admin/crm/enquiries')}
            className="px-6 py-2.5 border border-[#e8e5e0] text-[#333] text-sm font-semibold rounded-xl hover:bg-[#EDE8D0] transition-all">
            Cancel
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => saveEnquiry(true)}
              disabled={softBlocking || saving || !coupleName.trim() || !phone.trim() || photographerIds.length === 0}
              className="px-6 py-2.5 border border-[#e8e5e0] text-[#333] text-sm font-semibold rounded-xl hover:bg-[#EDE8D0] disabled:opacity-40 transition-all">
              {softBlocking ? 'Sending...' : `Soft Block${photographerIds.length > 0 ? ` (${photographerIds.length})` : ''}`}
            </button>
            <button
              onClick={() => saveEnquiry(false)}
              disabled={saving || softBlocking || !coupleName.trim() || !phone.trim()}
              className="px-6 py-2.5 bg-[#2563eb] text-white text-sm font-semibold rounded-xl hover:bg-[#1d4ed8] disabled:opacity-40 transition-all">
              {saving ? 'Saving...' : 'Save Enquiry'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}