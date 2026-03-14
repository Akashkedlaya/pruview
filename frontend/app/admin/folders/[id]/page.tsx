'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'

type Image = {
  id: number
  filename: string
  thumbUrl: string
  sizeBytes: number
}

type Folder = {
  id: number
  name: string
  shareToken: string
  images: Image[]
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

  const API = process.env.NEXT_PUBLIC_API_URL

  function getToken() {
    return localStorage.getItem('pruview_token')
  }

 async function loadFolder() {
  try {
    const res = await fetch(`${API}/api/folders/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    if (res.status === 401) { router.push('/admin/login'); return }
    if (res.status === 404) { router.push('/admin'); return }  // ← add this
    const data = await res.json()
    setFolder(data)
  } catch (err) {
    setError('Could not load folder.')
  }
}

  async function uploadFile(file: File) {
    try {
      // Step 1 — get presigned URL from backend
      const urlRes = await fetch(
        `${API}/api/folders/${id}/upload-url?filename=${encodeURIComponent(file.name)}&contentType=${file.type}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      )
      const { uploadUrl, s3Key } = await urlRes.json()

      // Step 2 — upload file directly to S3
      setProgress(p => ({ ...p, [file.name]: 0 }))
      await fetch(uploadUrl, {
        method:  'PUT',
        body:    file,
        headers: { 'Content-Type': file.type }
      })
      setProgress(p => ({ ...p, [file.name]: 100 }))

      // Step 3 — save metadata to DB
      const saveRes = await fetch(`${API}/api/folders/${id}/images`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          filename:    file.name,
          originalKey: s3Key,
          sizeBytes:   file.size
        })
      })
      const newImage = await saveRes.json()
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
      method:  'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    setFolder(f => f ? { ...f, images: f.images.filter(i => i.id !== imageId) } : f)
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

  if (!folder) return (
    <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center">
      <p className="text-[#888]">Loading…</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f8f7f4]">

      {/* Nav */}
      <nav className="bg-[#0f0f0f] px-8 py-4 flex items-center gap-4">
        <button onClick={() => router.push('/admin')}
          className="text-[#666] hover:text-white text-sm transition-colors">
          ← Back
        </button>
        <span className="text-white text-xl font-semibold" style={{ fontFamily: 'Georgia, serif' }}>
          pru<span className="text-[#e8c547]">view</span>
        </span>
      </nav>

      <div className="max-w-5xl mx-auto px-8 py-12">

        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="text-3xl font-semibold text-[#0f0f0f]" style={{ fontFamily: 'Georgia, serif' }}>
              {folder.name}
            </h1>
            <p className="text-[#888] text-sm mt-1">{folder.images?.length ?? 0} photos</p>
          </div>
          <button onClick={copyLink}
            className="px-5 py-2.5 border border-[#e0ddd8] text-[#333] text-sm font-semibold rounded-xl hover:border-[#c8a020] hover:text-[#c8a020] transition-all">
            {copied ? '✓ Link copied!' : 'Copy share link'}
          </button>
        </div>

        {/* Upload zone */}
        <div
          onClick={() => fileInput.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
          className="border-2 border-dashed border-[#e0ddd8] rounded-2xl p-12 text-center cursor-pointer hover:border-[#c8a020] transition-all mb-8 bg-white"
        >
          <p className="text-3xl mb-3">📷</p>
          <p className="font-semibold text-[#333] mb-1">
            {uploading ? 'Uploading…' : 'Drop photos here or click to select'}
          </p>
          <p className="text-xs text-[#aaa]">JPG, PNG, WEBP, HEIC — up to 15 MB each</p>

          {/* Progress bars */}
          {Object.entries(progress).length > 0 && (
            <div className="mt-6 flex flex-col gap-2 text-left max-w-sm mx-auto">
              {Object.entries(progress).map(([name, pct], index) => (
                <div key={`${index}-${name}`}>
                  <div className="flex justify-between text-xs text-[#888] mb-1">
                    <span className="truncate max-w-[200px]">{name}</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-[#f0ede8] rounded-full overflow-hidden">
                    <div className="h-full bg-[#c8a020] rounded-full transition-all"
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
          <div className="text-center py-16 text-[#aaa]">
            <p className="text-sm">No photos yet — upload some above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {folder.images.map(img => (
              <div key={img.id} className="group relative aspect-square rounded-xl overflow-hidden bg-[#e8e5e0]">
                <img
                  src={img.thumbUrl}
                  alt={img.filename}
                  className="w-full h-full object-cover"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                  <p className="text-white text-xs text-center px-2 truncate w-full text-center">
                    {img.filename}
                  </p>
                  <p className="text-white/60 text-xs">{formatSize(img.sizeBytes)}</p>
                  <button
                    onClick={() => deleteImage(img.id)}
                    className="px-3 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-colors"
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