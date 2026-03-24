'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Folder = {
  id: number
  name: string
  shareToken: string
  isActive: boolean
  createdAt: string
  _count: { images: number }
}

export default function AdminHome() {
  const router = useRouter()
  const [folders, setFolders]     = useState<Folder[]>([])
  const [loading, setLoading]     = useState(true)
  const [newName, setNewName]     = useState('')
  const [creating, setCreating]   = useState(false)
  const [copied, setCopied]       = useState<number | null>(null)
  const [error, setError]         = useState('')

  const API = process.env.NEXT_PUBLIC_API_URL

  function getToken() {
    return localStorage.getItem('pruview_token')
  }

  async function loadFolders() {
    try {
      const res = await fetch(`${API}/api/folders`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      if (res.status === 401) { router.push('/admin/login'); return }
      const data = await res.json()
      setFolders(data)
    } catch (err) {
      setError('Could not load folders.')
    } finally {
      setLoading(false)
    }
  }

  async function createFolder() {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const res = await fetch(`${API}/api/folders`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          Authorization:   `Bearer ${getToken()}`
        },
        body: JSON.stringify({ name: newName.trim() })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message); return }
      setFolders([{ ...data, _count: { images: 0 } }, ...folders])
      setNewName('')
    } catch (err) {
      setError('Could not create folder.')
    } finally {
      setCreating(false)
    }
  }

  async function deleteFolder(id: number) {
    if (!confirm('Delete this folder? This cannot be undone.')) return
    try {
      await fetch(`${API}/api/folders/${id}`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      setFolders(folders.filter(f => f.id !== id))
    } catch (err) {
      setError('Could not delete folder.')
    }
  }

  function copyLink(folder: Folder) {
    const url = `${window.location.origin}/g/${folder.shareToken}`
    navigator.clipboard.writeText(url)
    setCopied(folder.id)
    setTimeout(() => setCopied(null), 2000)
  }

  function logout() {
  localStorage.removeItem('pruview_token')
  document.cookie = 'pruview_token=; path=/; max-age=0'
  router.push('/admin/login')
}

  useEffect(() => { loadFolders() }, [])

  return (
    <div className="min-h-screen bg-[#f8f7f4]">

      {/* Nav */}
      <nav className="bg-[#0f0f0f] px-8 py-4 flex items-center justify-between">
        <span className="text-white text-xl font-semibold" style={{ fontFamily: 'Georgia, serif' }}>
          pru<span className="text-[#e8c547]">view</span>
        </span>
        <button onClick={logout} className="text-[#666] text-sm hover:text-white transition-colors">
          Sign out
        </button>
      </nav>
      <nav className="bg-[#0f0f0f] px-8 py-4 flex items-center justify-between">
         <span className="text-white text-xl font-semibold" style={{ fontFamily: 'Georgia, serif' }}>
          pru<span className="text-[#e8c547]">view</span>
         </span>
         <div className="flex items-center gap-6">
           <button
             onClick={() => router.push('/admin/crm')}
             className="text-[#666] hover:text-white text-sm transition-colors">
              CRM
           </button>
           <button onClick={logout} className="text-[#666] text-sm hover:text-white transition-colors">
             Sign out
           </button>
         </div>
      </nav>

      <div className="max-w-4xl mx-auto px-8 py-12">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-semibold text-[#0f0f0f] mb-1" style={{ fontFamily: 'Georgia, serif' }}>
            Your Galleries
          </h1>
          <p className="text-[#888] text-sm">Create a folder, upload photos, share the link.</p>
        </div>

        {/* Create folder */}
        <div className="bg-white border border-[#e8e5e0] rounded-2xl p-6 mb-8">
          <p className="text-xs font-semibold tracking-widest uppercase text-[#888] mb-3">
            New Gallery
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createFolder()}
              placeholder="e.g. Wedding – Priya & Arjun"
              className="flex-1 px-4 py-3 border border-[#e0ddd8] rounded-xl text-sm text-[#0f0f0f] placeholder-[#aaa] focus:outline-none focus:border-[#c8a020] focus:ring-1 focus:ring-[#c8a020] transition-all"
            />
            <button
              onClick={createFolder}
              disabled={creating || !newName.trim()}
              className="px-6 py-3 bg-[#0f0f0f] text-white text-sm font-semibold rounded-xl hover:bg-[#222] disabled:opacity-40 transition-all"
            >
              {creating ? 'Creating…' : 'Create'}
            </button>
          </div>
          {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
        </div>

        {/* Folders list */}
        {loading ? (
          <p className="text-[#888] text-sm">Loading…</p>
        ) : folders.length === 0 ? (
          <div className="text-center py-20 text-[#aaa]">
            <p className="text-4xl mb-4">📁</p>
            <p className="text-sm">No galleries yet. Create your first one above.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {folders.map(folder => (
              <div key={folder.id}
                onClick={() => router.push(`/admin/folders/${folder.id}`)}
                className="bg-white border border-[#e8e5e0] rounded-2xl px-6 py-5 flex items-center gap-4 cursor-pointer hover:border-[#c8a020] transition-all">

                {/* Icon */}
                <div className="w-10 h-10 rounded-xl bg-[#f8f7f4] border border-[#e8e5e0] flex items-center justify-center text-lg flex-shrink-0">
                  📁
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#0f0f0f] truncate">{folder.name}</p>
                  <p className="text-xs text-[#aaa] mt-0.5">
                    {folder._count.images} photos · {new Date(folder.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => copyLink(folder)}
                    className="px-4 py-2 text-xs font-semibold text-[#333] border border-[#e0ddd8] rounded-lg hover:border-[#c8a020] hover:text-[#c8a020] transition-all"
                  >
                    {copied === folder.id ? '✓ Copied!' : 'Copy link'}
                  </button>
                  <button
                    onClick={() => deleteFolder(folder.id)}
                    className="px-4 py-2 text-xs font-semibold text-[#333] border border-[#e0ddd8] rounded-lg hover:border-red-300 hover:text-red-500 transition-all"
                  >
                    Delete
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}