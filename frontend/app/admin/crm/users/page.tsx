'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getStoredUser, hasPermission } from '../../permissions'

type AppUser = {
  id: number
  email: string
  name: string | null
  status: string
  role: string
  createdAt: string
}

const ROLES = ['ADMIN', 'AGENT']

const STATUS_STYLES: Record<string, string> = {
  ACTIVE:   'bg-green-100 text-green-700 border-green-200',
  DISABLED: 'bg-red-100 text-red-700 border-red-200',
}

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers]           = useState<AppUser[]>([])
  const [loading, setLoading]       = useState(true)
  const [allowed, setAllowed]       = useState<boolean | null>(null)
  const [showModal, setShowModal]   = useState(false)
  const [editingId, setEditingId]   = useState<number | null>(null)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')

  // Form state
  const [email, setEmail]       = useState('')
  const [name, setName]         = useState('')
  const [role, setRole]         = useState('AGENT')
  const [password, setPassword] = useState('')

  const API = process.env.NEXT_PUBLIC_API_URL
  const currentUser = getStoredUser()

  function getToken() {
    return localStorage.getItem('pruview_token')
  }

  async function loadUsers() {
    try {
      const res = await fetch(`${API}/api/users`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      if (res.status === 401) { router.push('/admin/login'); return }
      if (res.status === 403) { setAllowed(false); return }
      setUsers(await res.json())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function openAddModal() {
    setEditingId(null)
    setEmail('')
    setName('')
    setRole('AGENT')
    setPassword('')
    setError('')
    setShowModal(true)
  }

  function openEditModal(u: AppUser) {
    setEditingId(u.id)
    setEmail(u.email)
    setName(u.name || '')
    setRole(u.role)
    setPassword('')
    setError('')
    setShowModal(true)
  }

  async function saveUser() {
    if (!email.trim() || (!editingId && !password.trim())) {
      setError('Email and password are required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const url    = editingId ? `${API}/api/users/${editingId}` : `${API}/api/users`
      const method = editingId ? 'PUT' : 'POST'
      const body: Record<string, string> = { name, role }
      if (!editingId) body.email = email.trim()
      if (password.trim()) body.password = password

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${getToken()}`
        },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message || 'Could not save user.'); return }

      if (editingId) {
        setUsers(prev => prev.map(u => u.id === editingId ? data : u))
      } else {
        setUsers(prev => [...prev, data])
      }
      setShowModal(false)
    } catch (err) {
      setError('Could not save user.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleStatus(u: AppUser) {
    const nextStatus = u.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'
    try {
      const res = await fetch(`${API}/api/users/${u.id}`, {
        method:  'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${getToken()}`
        },
        body: JSON.stringify({ status: nextStatus })
      })
      const data = await res.json()
      if (!res.ok) { alert(data.message || 'Could not update user.'); return }
      setUsers(prev => prev.map(x => x.id === u.id ? data : x))
    } catch (err) {
      alert('Could not update user.')
    }
  }

  async function deleteUser(id: number) {
    if (!confirm('Delete this user? This cannot be undone.')) return
    try {
      const res = await fetch(`${API}/api/users/${id}`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      const data = await res.json()
      if (!res.ok) { alert(data.message || 'Could not delete user.'); return }
      setUsers(prev => prev.filter(u => u.id !== id))
    } catch (err) {
      alert('Could not delete user.')
    }
  }

  useEffect(() => {
    if (!hasPermission('users.read')) { setAllowed(false); return }
    setAllowed(true)
    loadUsers()
  }, [])

  if (allowed === false) {
    return (
      <div className="p-8">
        <div className="text-center py-24 bg-white border border-[var(--pv-border)] rounded-2xl">
          <p className="text-[var(--pv-text)] font-semibold mb-1">You don't have access to this page.</p>
          <p className="text-[var(--pv-muted)] text-sm">Only Admin users can manage users.</p>
        </div>
      </div>
    )
  }

  if (allowed === null || loading) {
    return <div className="p-8 text-[var(--pv-muted)]">Loading…</div>
  }

  return (
    <div className="p-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--pv-text)]">Users</h1>
          <p className="text-[var(--pv-muted)] text-sm mt-1">
            Manage who can access your Pruview account and what they can do
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-[var(--pv-accent)] text-[var(--pv-accent-on)] text-sm font-semibold rounded-xl hover:bg-[var(--pv-accent-hover)] transition-all shadow-md"
        >
          + Add User
        </button>
      </div>

      {/* Users list */}
      {users.length === 0 ? (
        <div className="text-center py-24 bg-white border border-[var(--pv-border)] rounded-2xl">
          <p className="text-[var(--pv-muted)]">No users yet. Add your first team member.</p>
        </div>
      ) : (
        <div className="bg-white border border-[var(--pv-border)] rounded-2xl overflow-hidden">
          {users.map((u, index) => (
            <div
              key={u.id}
              className={`flex items-center gap-5 px-6 py-5 ${
                index !== users.length - 1 ? 'border-b border-[var(--pv-border)]' : ''
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[var(--pv-text)]">
                  {u.name || u.email}
                  {currentUser?.id === u.id && (
                    <span className="text-xs text-[var(--pv-muted)] font-normal ml-2">(you)</span>
                  )}
                </p>
                <p className="text-sm text-[var(--pv-muted)] mt-0.5">{u.email}</p>
              </div>

              <span className="px-3 py-1.5 rounded-full border border-[var(--pv-border)] text-xs font-semibold text-[var(--pv-text-secondary)]">
                {u.role}
              </span>

              <div className={`px-3 py-1.5 rounded-full border text-xs font-semibold ${STATUS_STYLES[u.status]}`}>
                {u.status === 'ACTIVE' ? 'Active' : 'Disabled'}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => openEditModal(u)}
                  className="px-4 py-2 border border-[var(--pv-border)] text-[var(--pv-accent)] text-sm font-medium rounded-xl hover:bg-[var(--pv-accent-tint)] transition-all"
                >
                  Edit
                </button>
                <button
                  onClick={() => toggleStatus(u)}
                  disabled={currentUser?.id === u.id}
                  className="px-4 py-2 border border-[var(--pv-border)] text-[var(--pv-text-secondary)] text-sm font-medium rounded-xl hover:bg-[var(--pv-bg)] disabled:opacity-30 transition-all"
                >
                  {u.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => deleteUser(u.id)}
                  disabled={currentUser?.id === u.id}
                  className="px-4 py-2 border border-red-100 text-red-400 text-sm font-medium rounded-xl hover:bg-red-50 disabled:opacity-30 transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden">

            <div className="flex items-center justify-between px-8 py-6 border-b border-[var(--pv-border)]">
              <div>
                <h2 className="text-xl font-bold text-[var(--pv-text)]">
                  {editingId ? 'Edit User' : 'Add User'}
                </h2>
                <p className="text-[var(--pv-muted)] text-sm mt-1">
                  {editingId ? 'Update role, name, or reset the password' : 'Create a login for a team member'}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 border border-[var(--pv-border)] rounded-full flex items-center justify-center text-[var(--pv-muted)] hover:text-[var(--pv-text-secondary)] transition-all"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="px-8 py-6 flex flex-col gap-5">
              <div>
                <label className="block text-sm font-semibold text-[var(--pv-text-secondary)] mb-2">
                  Email {!editingId && <span className="text-red-400">*</span>}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={!!editingId}
                  placeholder="teammate@pruview.com"
                  className="w-full px-4 py-3 border border-[var(--pv-border)] rounded-xl text-sm text-[var(--pv-text)] disabled:bg-[var(--pv-bg)] disabled:text-[var(--pv-muted)] focus:outline-none focus:border-[var(--pv-accent)] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--pv-text-secondary)] mb-2">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Full name"
                  className="w-full px-4 py-3 border border-[var(--pv-border)] rounded-xl text-sm text-[var(--pv-text)] focus:outline-none focus:border-[var(--pv-accent)] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--pv-text-secondary)] mb-2">Role</label>
                <div className="flex gap-3">
                  {ROLES.map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      disabled={editingId === currentUser?.id}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all disabled:opacity-40 ${
                        role === r
                          ? 'border-[var(--pv-accent)] text-[var(--pv-accent)] bg-[var(--pv-accent-tint)]'
                          : 'border-[var(--pv-border)] text-[var(--pv-muted)] hover:border-[var(--pv-accent)]'
                      }`}
                    >
                      {r === 'ADMIN' ? 'Admin' : 'Agent'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--pv-text-secondary)] mb-2">
                  {editingId ? 'New Password' : 'Password'} {!editingId && <span className="text-red-400">*</span>}
                  {editingId && <span className="text-[var(--pv-muted)] font-normal ml-1">(leave blank to keep current)</span>}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-[var(--pv-border)] rounded-xl text-sm text-[var(--pv-text)] focus:outline-none focus:border-[var(--pv-accent)] transition-all"
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>

            <div className="flex gap-3 px-8 py-5 border-t border-[var(--pv-border)]">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 border border-[var(--pv-border)] text-[var(--pv-text-secondary)] text-sm font-semibold rounded-xl hover:bg-[var(--pv-bg)] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={saveUser}
                disabled={saving}
                className="flex-1 py-3 bg-[var(--pv-accent)] text-[var(--pv-accent-on)] text-sm font-semibold rounded-xl hover:bg-[var(--pv-accent-hover)] disabled:opacity-40 transition-all"
              >
                {saving ? 'Saving…' : (editingId ? 'Save Changes' : 'Add User')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
