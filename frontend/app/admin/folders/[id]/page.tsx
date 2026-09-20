'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'

type Image = {
  id: number
  filename: string
  thumbUrl: string
  sizeBytes: number
  status: 'UPLOADED' | 'PROCESSING' | 'PROCESSED' | 'FAILED'
  faceCount: number
  processingError?: string | null
}

type SubFolder = {
  id: number
  name: string
  shareToken: string
  createdAt: string
  _count: { images: number }
}

type Folder = {
  id: number
  name: string
  shareToken: string
  parentId: number | null
  images: Image[]
  children: SubFolder[]
}

export default function UploadPage() {
  const router    = useRouter()
  const { id }    = useParams()
  const fileInput = useRef<HTMLInputElement>(null)

  const [folder, setFolder]       = useState<Folder | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress]   = useState<Record<string, number>>({})
  const [error, setError]         = useState('')
  const [copied, setCopied]       = useState(false)
  const [subError, setSubError]           = useState('')
  const [newSubfolderName, setNewSubfolderName] = useState('')
  const [creatingSubfolder, setCreatingSubfolder] = useState(false)
  const [copiedSubId, setCopiedSubId]     = useState<number | null>(null)

  const API = process.env.NEXT_PUBLIC_API_URL

  function getToken() {
    return localStorage.getItem('pruview_token')
  }
  async function reindexFaces() {
    if (!folder) return
    setError('')
    try {
      const res = await fetch(`${API}/api/folders/${folder.id}/reindex-faces`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message || 'Re-indexing failed.'); return }
      // Reflect the queued state immediately; the poll loop below will
      // pick up PROCESSING/PROCESSED/FAILED as the background worker runs.
      setFolder(f => f ? { ...f, images: f.images.map(img => ({ ...img, status: 'UPLOADED', processingError: null })) } : f)
    } catch (err) {
      setError('Re-indexing failed.')
    }
  }

  async function retryImage(imageId: number) {
    try {
      await fetch(`${API}/api/images/${imageId}/process-faces`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      setFolder(f => f ? {
        ...f,
        images: f.images.map(img => img.id === imageId ? { ...img, status: 'UPLOADED', processingError: null } : img)
      } : f)
    } catch (err) {
      setError('Could not retry processing.')
    }
  }
  async function loadFolder() {
    try {
      const res = await fetch(`${API}/api/folders/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      if (res.status === 401) { router.push('/admin/login'); return }
      if (res.status === 404) { router.push('/admin'); return }
      const data = await res.json()
      setFolder(data)
    } catch (err) {
      setError('Could not load folder.')
    }
  }

  async function uploadFile(file: File) {
    try {
      // Step 1 — get presigned URL
      const urlRes = await fetch(
        `${API}/api/folders/${id}/upload-url?filename=${encodeURIComponent(file.name)}&contentType=${file.type}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      )
      const { uploadUrl, s3Key } = await urlRes.json()

      // Step 2 — upload to S3
      setProgress(p => ({ ...p, [file.name]: 0 }))
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type }
      })
      setProgress(p => ({ ...p, [file.name]: 50 }))

      // Step 3 — save metadata to DB
      const saveRes = await fetch(`${API}/api/folders/${id}/images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          filename: file.name,
          originalKey: s3Key,
          sizeBytes: file.size
        })
      })
      const newImage = await saveRes.json()

      // Face processing is queued server-side by the backend the moment
      // the image row is created — nothing left for the browser to do.
      setProgress(p => ({ ...p, [file.name]: 100 }))
      setFolder(f => f ? { ...f, images: [newImage, ...f.images] } : f)

    } catch (err) {
      setError(`Failed to upload ${file.name}`)
    }
  }

  async function handleFiles(files: FileList) {
    setUploading(true)
    setError('')
    for (const file of Array.from(files)) {
      await uploadFile(file)
    }
    setUploading(false)
    setProgress({})
  }

  async function deleteImage(imageId: number) {
    if (!confirm('Delete this photo?')) return
    await fetch(`${API}/api/images/${imageId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    setFolder(f => f ? { ...f, images: f.images.filter(i => i.id !== imageId) } : f)
  }

  async function createSubfolder() {
    if (!newSubfolderName.trim() || !folder) return
    setCreatingSubfolder(true)
    setSubError('')
    try {
      const res = await fetch(`${API}/api/folders/${folder.id}/subfolders`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${getToken()}`
        },
        body: JSON.stringify({ name: newSubfolderName.trim() })
      })
      const data = await res.json()
      if (!res.ok) { setSubError(data.message || 'Could not create subfolder.'); return }
      setFolder(f => f ? { ...f, children: [data, ...f.children] } : f)
      setNewSubfolderName('')
    } catch (err) {
      setSubError('Could not create subfolder.')
    } finally {
      setCreatingSubfolder(false)
    }
  }

  function copySubLink(sub: SubFolder) {
    navigator.clipboard.writeText(`${window.location.origin}/g/${sub.shareToken}`)
    setCopiedSubId(sub.id)
    setTimeout(() => setCopiedSubId(null), 2000)
  }

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/g/${folder?.shareToken}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function formatSize(bytes: number) {
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  useEffect(() => { loadFolder() }, [id])

  // Face processing happens in the background — poll while anything is
  // still queued/running so statuses (and face counts) update without a
  // manual refresh, and stop once everything's settled.
  useEffect(() => {
    const pending = folder?.images.some(img => img.status === 'UPLOADED' || img.status === 'PROCESSING')
    if (!pending) return
    const interval = setInterval(loadFolder, 4000)
    return () => clearInterval(interval)
  }, [folder])

  if (!folder) return (
    <div className="min-h-screen bg-[var(--pv-bg)] flex items-center justify-center">
      <p className="text-[var(--pv-muted)]">Loading…</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[var(--pv-bg)]">

      {/* Nav */}
      <nav className="bg-[var(--pv-ink)] px-8 py-4 flex items-center gap-4">
        <button onClick={() => router.push(folder.parentId ? `/admin/folders/${folder.parentId}` : '/admin')}
          className="text-white/50 hover:text-white text-sm transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg> Back
        </button>
        <span className="text-white text-xl font-semibold">
          pru<span className="text-[var(--pv-accent)]">view</span>
        </span>
      </nav>

      <div className="max-w-5xl mx-auto px-8 py-12">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold text-[var(--pv-text)]">
              {folder.name}
            </h1>
            <p className="text-[var(--pv-muted)] text-sm mt-1">{folder.images?.length ?? 0} photos</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={reindexFaces}
              className="px-4 py-2 border border-[var(--pv-border)] text-[var(--pv-text-secondary)] text-xs font-semibold rounded-xl hover:border-[var(--pv-accent)] hover:text-[var(--pv-accent)] transition-all"
            >
              Re-index faces
            </button>
            <button onClick={copyLink}
              className="px-5 py-2.5 border border-[var(--pv-border)] text-[var(--pv-text-secondary)] text-sm font-semibold rounded-xl hover:border-[var(--pv-accent)] hover:text-[var(--pv-accent)] transition-all">
              {copied ? 'Link copied!' : 'Copy share link'}
            </button>
          </div>
        </div>

        {/* Subfolders — one level of nesting only */}
        {!folder.parentId && (
          <div className="mb-10">
            <p className="text-xs font-semibold tracking-widest uppercase text-[var(--pv-muted)] mb-3">
              Subfolders
            </p>
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={newSubfolderName}
                onChange={e => setNewSubfolderName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createSubfolder()}
                placeholder="e.g. Ceremony"
                className="flex-1 px-4 py-2.5 border border-[var(--pv-border)] rounded-xl text-sm text-[var(--pv-text)] bg-white placeholder-[var(--pv-muted)] focus:outline-none focus:border-[var(--pv-accent)] focus:ring-1 focus:ring-[var(--pv-accent)] transition-all"
              />
              <button
                onClick={createSubfolder}
                disabled={creatingSubfolder || !newSubfolderName.trim()}
                className="px-5 py-2.5 bg-[var(--pv-ink)] text-white text-sm font-semibold rounded-xl hover:bg-[var(--pv-ink-hover)] disabled:opacity-40 transition-all"
              >
                {creatingSubfolder ? 'Creating…' : '+ Subfolder'}
              </button>
            </div>
            {subError && <p className="text-red-500 text-sm mb-4">{subError}</p>}

            {folder.children.length > 0 && (
              <div className="flex flex-col gap-2">
                {folder.children.map(sub => (
                  <div key={sub.id}
                    onClick={() => router.push(`/admin/folders/${sub.id}`)}
                    className="bg-white border border-[var(--pv-border)] rounded-xl px-5 py-3.5 flex items-center gap-4 cursor-pointer hover:border-[var(--pv-accent)] transition-all">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--pv-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-[var(--pv-text)] truncate">{sub.name}</p>
                      <p className="text-xs text-[var(--pv-muted)]">{sub._count.images} photos</p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); copySubLink(sub) }}
                      className="px-3 py-1.5 text-xs font-semibold text-[var(--pv-text-secondary)] border border-[var(--pv-border)] rounded-lg hover:border-[var(--pv-accent)] hover:text-[var(--pv-accent)] transition-all flex-shrink-0"
                    >
                      {copiedSubId === sub.id ? 'Copied!' : 'Copy link'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Upload zone */}
        <div
          onClick={() => fileInput.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
          className="border-2 border-dashed border-[var(--pv-border)] rounded-2xl p-12 text-center cursor-pointer hover:border-[var(--pv-accent)] transition-all mb-8 bg-white"
        >
          <div className="w-12 h-12 bg-[var(--pv-bg)] border border-[var(--pv-border)] rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--pv-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          </div>
          <p className="font-semibold text-[var(--pv-text-secondary)] mb-1">
            {uploading ? 'Uploading…' : 'Drop photos here or click to select'}
          </p>
          <p className="text-xs text-[var(--pv-muted)]">JPG, PNG, WEBP, HEIC — up to 15 MB each</p>

          {Object.entries(progress).length > 0 && (
            <div className="mt-6 flex flex-col gap-2 text-left max-w-sm mx-auto">
              {Object.entries(progress).map(([name, pct], index) => (
                <div key={`${index}-${name}`}>
                  <div className="flex justify-between text-xs text-[var(--pv-muted)] mb-1">
                    <span className="truncate max-w-[200px]">{name}</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-[var(--pv-border)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--pv-accent)] rounded-full transition-all"
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <input
          ref={fileInput}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={e => e.target.files && handleFiles(e.target.files)}
        />

        {error && <p className="text-red-500 text-sm mb-6">{error}</p>}

        {/* Images grid */}
        {folder.images.length === 0 ? (
          <div className="text-center py-16 text-[var(--pv-muted)]">
            <p className="text-sm">No photos yet — upload some above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {folder.images.map(img => (
              <div key={img.id} className="group relative aspect-square rounded-xl overflow-hidden bg-[var(--pv-border)]">
                <img
                  src={img.thumbUrl}
                  alt={img.filename}
                  className="w-full h-full object-cover"
                />

                {/* Processing status badge */}
                {(img.status === 'UPLOADED' || img.status === 'PROCESSING') && (
                  <span className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 text-white text-[10px] font-medium px-2 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    Processing…
                  </span>
                )}
                {img.status === 'PROCESSED' && (
                  <span className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 text-white text-[10px] font-medium px-2 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    {img.faceCount} {img.faceCount === 1 ? 'face' : 'faces'}
                  </span>
                )}
                {img.status === 'FAILED' && (
                  <span
                    className="absolute top-2 left-2 flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-medium px-2 py-1 rounded-full"
                    title={img.processingError || 'Processing failed'}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    Failed
                  </span>
                )}

                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                  <p className="text-white text-xs text-center px-2 truncate w-full">
                    {img.filename}
                  </p>
                  <p className="text-white/60 text-xs">{formatSize(img.sizeBytes)}</p>
                  <div className="flex items-center gap-2">
                    {img.status === 'FAILED' && (
                      <button
                        onClick={() => retryImage(img.id)}
                        className="px-3 py-1 bg-[var(--pv-accent)] text-[var(--pv-accent-on)] text-xs rounded-lg hover:bg-[var(--pv-accent-hover)] transition-colors"
                      >
                        Retry
                      </button>
                    )}
                    <button
                      onClick={() => deleteImage(img.id)}
                      className="px-3 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}