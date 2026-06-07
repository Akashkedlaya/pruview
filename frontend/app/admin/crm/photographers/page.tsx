'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Photographer = {
  id: number
  name: string
  phone: string
  email?: string
  specialization?: string
  status: string
}

const STATUS_STYLES: Record<string, string> = {
  AVAILABLE:     'bg-green-100 text-green-700 border-green-200',
  ON_ASSIGNMENT: 'bg-blue-100 text-blue-700 border-blue-200',
  ON_LEAVE:      'bg-red-100 text-red-700 border-red-200',
}

const STATUS_DOTS: Record<string, string> = {
  AVAILABLE:     'bg-green-500',
  ON_ASSIGNMENT: 'bg-blue-500',
  ON_LEAVE:      'bg-red-500',
}

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE:     'Available',
  ON_ASSIGNMENT: 'On Assignment',
  ON_LEAVE:      'On Leave',
}

const SPECIALIZATIONS = [
  'Lead Wedding Photographer',
  'Second Shooter',
  'Candid & Portrait Specialist',
  'Videographer & Drone Operator',
  'Cinematic Videographer',
  'Traditional Photographer',
]

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function getAvatarColor(id: number) {
  const colors = [
    'bg-purple-200 text-purple-700',
    'bg-blue-200 text-blue-700',
    'bg-green-200 text-green-700',
    'bg-amber-200 text-amber-700',
    'bg-pink-200 text-pink-700',
    'bg-indigo-200 text-indigo-700',
  ]
  return colors[id % colors.length]
}

export default function PhotographersPage() {
  const router = useRouter()
  const [photographers, setPhotographers] = useState<Photographer[]>([])
  const [loading, setLoading]             = useState(true)
  const [search, setSearch]               = useState('')
  const [showModal, setShowModal]         = useState(false)
  const [editingId, setEditingId]         = useState<number | null>(null)
  const [saving, setSaving]               = useState(false)
  const [error, setError]                 = useState('')

  // Form state
  const [name, setName]                   = useState('')
  const [phone, setPhone]                 = useState('')
  const [email, setEmail]                 = useState('')
  const [specialization, setSpecialization] = useState('')
  const [status, setStatus]               = useState('AVAILABLE')

  const API = process.env.NEXT_PUBLIC_API_URL

  function getToken() {
    return localStorage.getItem('pruview_token')
  }

  async function loadPhotographers() {
    try {
      const res = await fetch(`${API}/api/crm/photographers`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      if (res.status === 401) { router.push('/admin/login'); return }
      setPhotographers(await res.json())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function openAddModal() {
    setEditingId(null)
    setName('')
    setPhone('')
    setEmail('')
    setSpecialization('')
    setStatus('AVAILABLE')
    setError('')
    setShowModal(true)
  }

  function openEditModal(p: Photographer) {
    setEditingId(p.id)
    setName(p.name)
    setPhone(p.phone)
    setEmail(p.email || '')
    setSpecialization(p.specialization || '')
    setStatus(p.status)
    setError('')
    setShowModal(true)
  }

  async function savePhotographer() {
    if (!name.trim() || !phone.trim()) {
      setError('Name and phone are required.')
      return
    }
    setSaving(true)
    try {
      const url    = editingId
        ? `${API}/api/crm/photographers/${editingId}`
        : `${API}/api/crm/photographers`
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${getToken()}`
        },
        body: JSON.stringify({ name, phone, email, specialization, status })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message); return }

      if (editingId) {
        setPhotographers(prev => prev.map(p => p.id === editingId ? data : p))
      } else {
        setPhotographers(prev => [...prev, data])
      }
      setShowModal(false)
    } catch (err) {
      setError('Could not save photographer.')
    } finally {
      setSaving(false)
    }
  }

  async function deletePhotographer(id: number) {
    if (!confirm('Delete this photographer?')) return
    await fetch(`${API}/api/crm/photographers/${id}`, {
      method:  'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    setPhotographers(prev => prev.filter(p => p.id !== id))
  }

  function sendWhatsApp(phone: string, name: string) {
    const message = `Hi ${name}, this is a message from Pruview CRM.`
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank')
  }

  const filtered = photographers.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.specialization || '').toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => { loadPhotographers() }, [])

  return (
    <div className="p-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-[#0f0f0f]">
            Photographers Directory
          </h1>
          <p className="text-[#888] text-sm mt-1">
            Manage your photography team, specialisations, and availability
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#2563eb] text-white text-sm font-semibold rounded-xl hover:bg-[#1d4ed8] transition-all shadow-md"
        >
          + Add Photographer
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4 mt-6 mb-6">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#aaa]"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name or specialty..."
            className="w-full pl-9 pr-4 py-2.5 border border-[#dbeafe] rounded-xl text-sm text-[#0f0f0f] bg-white focus:outline-none focus:border-[#2563eb] transition-all"
          />
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-[#888]">
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${STATUS_DOTS[key]}`} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total',         value: photographers.length, dot: 'bg-[#2563eb]' },
          { label: 'Available',     value: photographers.filter(p => p.status === 'AVAILABLE').length,     dot: 'bg-green-500' },
          { label: 'On Assignment', value: photographers.filter(p => p.status === 'ON_ASSIGNMENT').length, dot: 'bg-blue-500' },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-[#dbeafe] rounded-2xl p-5 flex items-center gap-4">
            <div className={`w-3 h-3 rounded-full ${stat.dot}`} />
            <div>
              <p className="text-2xl font-bold text-[#0f0f0f]">{stat.value}</p>
              <p className="text-sm text-[#888]">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Photographers List */}
      {loading ? (
        <div className="text-center py-20 text-[#888]">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 bg-white border border-[#dbeafe] rounded-2xl">
          <div className="w-14 h-14 bg-[#eff6ff] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          </div>
          <p className="text-[#888]">No photographers yet. Add your first team member.</p>
          <button
            onClick={openAddModal}
            className="mt-4 px-6 py-2.5 bg-[#2563eb] text-white text-sm font-semibold rounded-xl hover:bg-[#1d4ed8] transition-all"
          >
            + Add Photographer
          </button>
        </div>
      ) : (
        <div className="bg-white border border-[#dbeafe] rounded-2xl overflow-hidden">
          {filtered.map((p, index) => (
            <div
              key={p.id}
              className={`flex items-center gap-5 px-6 py-5 hover:bg-[#faf9ff] transition-all ${
                index !== filtered.length - 1 ? 'border-b border-[#eff6ff]' : ''
              }`}
            >
              {/* Avatar */}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${getAvatarColor(p.id)}`}>
                {getInitials(p.name)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#0f0f0f]">{p.name}</p>
                {p.specialization && (
                  <p className="text-sm text-[#888] mt-0.5">{p.specialization}</p>
                )}
              </div>

              {/* Contact */}
              <div className="text-sm text-[#666] hidden sm:block">
                <p>+{p.phone}</p>
                {p.email && <p className="text-[#888] mt-0.5">{p.email}</p>}
              </div>

              {/* Status */}
              <div className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 ${STATUS_STYLES[p.status]}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${STATUS_DOTS[p.status]}`} />
                {STATUS_LABELS[p.status]}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                    onClick={() => sendWhatsApp(p.phone, p.name)}
                    className="w-10 h-10 hover:opacity-80 transition-all flex items-center justify-center"
                    title="Send WhatsApp"
                 >
                    <svg viewBox="0 0 48 48" width="36" height="36" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="24" cy="24" r="24" fill="#25D366"/>
                    <path fill="white" d="M24 10.5C16.544 10.5 10.5 16.544 10.5 24c0 2.385.638 4.617 1.748 6.548L10.5 37.5l7.196-1.724A13.44 13.44 0 0024 37.5c7.456 0 13.5-6.044 13.5-13.5S31.456 10.5 24 10.5zm6.51 18.72c-.27.756-1.584 1.44-2.178 1.53-.558.084-1.26.12-2.034-.126-.468-.15-1.068-.348-1.836-.684-3.228-1.392-5.34-4.638-5.502-4.854-.162-.216-1.314-1.746-1.314-3.33 0-1.584.828-2.364 1.122-2.688.294-.324.642-.405.856-.405h.612c.198 0 .468-.075.732.558.27.648.918 2.232.999 2.394.081.162.135.351.027.567-.108.216-.162.351-.324.54-.162.189-.342.423-.486.567-.162.162-.33.339-.141.663.189.324.84 1.383 1.803 2.241 1.239 1.104 2.283 1.446 2.607 1.608.324.162.513.135.702-.081.189-.216.81-.945 1.026-1.269.216-.324.432-.27.729-.162.297.108 1.881.888 2.205 1.05.324.162.54.243.621.378.081.135.081.783-.189 1.539z"/>
                    </svg>
                </button>
                <button
                  onClick={() => openEditModal(p)}
                  className="px-4 py-2 border border-[#dbeafe] text-[#2563eb] text-sm font-medium rounded-xl hover:bg-[#dbeafe] transition-all"
                >
                  Edit
                </button>
                <button
                  onClick={() => deletePhotographer(p.id)}
                  className="px-4 py-2 border border-red-100 text-red-400 text-sm font-medium rounded-xl hover:bg-red-50 transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Photographer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-[#eff6ff]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs bg-[#dbeafe] text-[#2563eb] px-2 py-0.5 rounded-full font-medium">
                    Photographer details
                  </span>
                </div>
                <h2 className="text-xl font-bold text-[#0f0f0f]">
                  {editingId ? 'Edit Photographer' : 'Add Photographer Information'}
                </h2>
                <p className="text-[#888] text-sm mt-1">
                  {editingId
                    ? 'Update photographer profile details'
                    : 'Create a new photographer profile with contact details'}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 border border-[#e8e5e0] rounded-full flex items-center justify-center text-[#888] hover:text-[#333] transition-all"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-8 py-6 flex flex-col gap-5">

              {/* Name + Specialization */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#333] mb-2">
                    Name <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#aaa]"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Enter photographer name"
                      className="w-full pl-9 pr-4 py-3 border border-[#e8e5e0] rounded-xl text-sm text-[#0f0f0f] focus:outline-none focus:border-[#2563eb] transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#333] mb-2">
                    Specialised <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={specialization}
                    onChange={e => setSpecialization(e.target.value)}
                    className="w-full px-4 py-3 border border-[#e8e5e0] rounded-xl text-sm text-[#0f0f0f] focus:outline-none focus:border-[#2563eb] transition-all"
                  >
                    <option value="">Select or type specialty</option>
                    {SPECIALIZATIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <p className="text-xs text-[#aaa] mt-1">Candid, Traditional, Drone, Portraits, Cinematic</p>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-[#333] mb-2">
                  Mobile Number <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#aaa]"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.6 19.79 19.79 0 0 1 1.61 5a2 2 0 0 1 1.99-2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></span>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-4 py-3 border border-[#e8e5e0] rounded-xl text-sm text-[#0f0f0f] focus:outline-none focus:border-[#2563eb] transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-[#333] mb-2">
                  Email Address <span className="text-[#aaa] font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#aaa]"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></span>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="photographer@email.com"
                    className="w-full pl-9 pr-4 py-3 border border-[#e8e5e0] rounded-xl text-sm text-[#0f0f0f] focus:outline-none focus:border-[#2563eb] transition-all"
                  />
                </div>
              </div>

              {/* Status */}
              {editingId && (
                <div>
                  <label className="block text-sm font-semibold text-[#333] mb-2">
                    Availability Status
                  </label>
                  <div className="flex gap-3">
                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setStatus(key)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                          status === key
                            ? STATUS_STYLES[key] + ' border-current'
                            : 'border-[#e8e5e0] text-[#888] hover:border-[#2563eb]'
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${STATUS_DOTS[key]}`} />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}

              {/* Footer note */}
              <p className="text-xs text-[#aaa] flex items-center gap-1.5">
                Required fields help match the photographer to wedding bookings.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 px-8 py-5 border-t border-[#eff6ff]">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 border border-[#e8e5e0] text-[#333] text-sm font-semibold rounded-xl hover:bg-[#EDE8D0] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={savePhotographer}
                disabled={saving || !name.trim() || !phone.trim()}
                className="flex-1 py-3 bg-[#2563eb] text-white text-sm font-semibold rounded-xl hover:bg-[#1d4ed8] disabled:opacity-40 transition-all flex items-center justify-center gap-2"
              >
                {saving ? 'Saving…' : (
                  <><span>+</span><span>{editingId ? 'Update Photographer' : 'Add Photographer'}</span></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}