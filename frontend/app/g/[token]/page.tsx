'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'

type Image = {
  id: number
  filename: string
  thumbUrl: string
  sizeBytes: number
}

type Gallery = {
  folder: { id: number; name: string; createdAt: string }
  images: Image[]
  total: number
}

export default function GalleryPage() {
  const { token } = useParams() as { token: string }

  const [gallery, setGallery]               = useState<Gallery | null>(null)
  const [error, setError]                   = useState('')
  const [lightboxIndex, setLightboxIndex]   = useState<number | null>(null)
  const [downloading, setDownloading]       = useState<number | null>(null)
  const [downloadingAll, setDownloadingAll] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)

  // Face scan state
  const [scanning, setScanning]         = useState(false)
  const [scanResult, setScanResult]     = useState<Image[] | null>(null)
  const [cameraError, setCameraError]   = useState('')
  const [modelsReady, setModelsReady]   = useState(false)
  const videoRef  = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const API = process.env.NEXT_PUBLIC_API_URL

  useEffect(() => {
    fetch(`${API}/api/g/${token}`)
      .then(res => {
        if (!res.ok) throw new Error('Gallery not found')
        return res.json()
      })
      .then(data => setGallery(data))
      .catch(() => setError('This gallery link is invalid or has been removed.'))
  }, [token])

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (lightboxIndex === null || !gallery) return
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft')  goPrev()
      if (e.key === 'Escape')     setLightboxIndex(null)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [lightboxIndex, gallery])

  function goNext() {
    if (!gallery || lightboxIndex === null) return
    setLightboxIndex(i => i !== null ? (i + 1) % gallery.images.length : null)
  }

  function goPrev() {
    if (!gallery || lightboxIndex === null) return
    setLightboxIndex(i => i !== null ? (i - 1 + gallery.images.length) % gallery.images.length : null)
  }

  async function getDownloadUrl(imageId: number) {
    const res  = await fetch(`${API}/api/g/${token}/download/${imageId}`)
    const data = await res.json()
    return data.downloadUrl
  }

  async function downloadImage(img: Image) {
    setDownloading(img.id)
    try {
      const url = await getDownloadUrl(img.id)
      window.open(url, '_blank')
    } catch {
      alert('Could not download. Try again.')
    } finally {
      setDownloading(null)
    }
  }

  async function downloadAll() {
    if (!gallery) return
    setDownloadingAll(true)
    setDownloadProgress(0)
    for (let i = 0; i < gallery.images.length; i++) {
      const img = gallery.images[i]
      try {
        const url = await getDownloadUrl(img.id)
        const a = document.createElement('a')
        a.href = url
        a.download = img.filename
        a.target = '_blank'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        await new Promise(r => setTimeout(r, 800))
      } catch {
        console.error('Failed to download:', img.filename)
      }
      setDownloadProgress(Math.round(((i + 1) / gallery.images.length) * 100))
    }
    setDownloadingAll(false)
    setDownloadProgress(0)
  }

  // ── Face scan functions
  async function startFaceScan() {
    if (!token) return
    setScanning(true)
    setCameraError('')
    setScanResult(null)
    setModelsReady(false)

    try {
      const { loadModels, detectFaceFromVideo } = await import('@/app/lib/faceDetection')
      await loadModels()
      setModelsReady(true)

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 }
      })
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      let detected = false
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 500))
        if (!videoRef.current) break

        const embedding = await detectFaceFromVideo(videoRef.current)
        if (embedding) {
          detected = true
          stopCamera()

          const res = await fetch(`${API}/api/g/${token}/match-face`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ embedding })
          })
          const data = await res.json()
          setScanResult(data.images || [])
          break
        }
      }

      if (!detected) {
        stopCamera()
        setCameraError('No face detected. Please try again in good lighting.')
      }

    } catch (err: any) {
      stopCamera()
      if (err.name === 'NotAllowedError') {
        setCameraError('Camera permission denied. Please allow camera access and try again.')
      } else {
        setCameraError('Camera error. Please try again.')
      }
    } finally {
      setScanning(false)
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  function clearScanResult() {
    setScanResult(null)
    setCameraError('')
  }

  function formatSize(bytes: number) {
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const lightboxImage = lightboxIndex !== null && gallery ? gallery.images[lightboxIndex] : null
  const displayImages = scanResult !== null ? scanResult : gallery?.images ?? []

  // ── Error state
  if (error) return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="text-center">
        <p className="text-6xl mb-6">🔗</p>
        <h1 className="text-[#0f0f0f] text-2xl font-semibold mb-3">
          Gallery not found
        </h1>
        <p className="text-[#888] text-sm">{error}</p>
      </div>
    </div>
  )

  // ── Loading state
  if (!gallery) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-[#aaa] text-sm">Loading gallery…</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-white">

      {/* Header */}
      <div className="px-8 py-12 border-b border-[#e8e5e0]">
        <div className="max-w-6xl mx-auto flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs tracking-[4px] uppercase mb-3 font-bold">
              <span className="text-[#5f9ea0]">PRU</span><span className="text-[#999]">VIEW</span>
            </p>
            <h1 className="text-[#0f0f0f] text-4xl font-light mb-2">
              {gallery.folder.name}
            </h1>
            <p className="text-[#888] text-sm">
              {scanResult !== null
                ? `${scanResult.length} photos with you`
                : `${gallery.total} ${gallery.total === 1 ? 'photo' : 'photos'}`}
            </p>
          </div>

          {gallery.total > 0 && (
            <div className="flex flex-col items-end gap-2">
              <button
                onClick={downloadAll}
                disabled={downloadingAll}
                className="px-6 py-3 bg-[#e8c547] text-[#0f0f0f] text-sm font-bold rounded-xl hover:bg-[#f0d060] disabled:opacity-60 transition-all flex items-center gap-2 shadow-lg border-2 border-[#c8a020]"
              >
                {downloadingAll ? (
                  <span>Downloading {downloadProgress}%</span>
                ) : (
                  <><span className="text-lg">⬇</span><span>Download All {gallery.total} Photos</span></>
                )}
              </button>
              {downloadingAll && (
                <div className="w-full h-1 bg-[#e8e5e0] rounded-full overflow-hidden">
                  <div className="h-full bg-[#e8c547] rounded-full transition-all duration-300"
                    style={{ width: `${downloadProgress}%` }} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Face Scan Section */}
      <div className="max-w-6xl mx-auto px-8 py-6 border-b border-[#e8e5e0]">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[#0f0f0f]">
              Find your photos
            </h2>
            <p className="text-sm text-[#888] mt-0.5">
              Scan your face to instantly find all photos with you in them
            </p>
          </div>
          <div className="flex items-center gap-3">
            {scanResult !== null && (
              <button
                onClick={clearScanResult}
                className="px-4 py-2 text-sm text-[#888] border border-[#e0ddd8] rounded-xl hover:text-[#333] transition-all"
              >
                Show all photos
              </button>
            )}
            <button
              onClick={startFaceScan}
              disabled={scanning}
              className="px-6 py-3 bg-[#0f0f0f] text-white text-sm font-bold rounded-xl hover:bg-[#222] disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {scanning ? (
                <><span className="animate-pulse">●</span><span>Scanning...</span></>
              ) : (
                <><span>📸</span><span>Scan Face</span></>
              )}
            </button>
          </div>
        </div>

        {/* Camera Preview */}
        {scanning && (
          <div className="mt-6 flex flex-col items-center gap-4">
            <div className="relative rounded-2xl overflow-hidden border-4 border-[#0f0f0f] w-80 h-60 bg-black">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                muted
                playsInline
              />
              {!modelsReady && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <p className="text-white text-sm">Loading AI models...</p>
                </div>
              )}
              {modelsReady && (
                <div className="absolute bottom-3 left-0 right-0 text-center">
                  <p className="text-white text-xs bg-black/50 inline-block px-3 py-1 rounded-full">
                    Look directly at the camera
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Camera Error */}
        {cameraError && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">
            {cameraError}
          </div>
        )}

        {/* Scan Results */}
        {scanResult !== null && (
          <div className="mt-4">
            {scanResult.length === 0 ? (
              <div className="bg-[#f8f7f4] border border-[#e8e5e0] rounded-xl px-4 py-3 text-[#888] text-sm">
                No photos found with your face. Try scanning again in better lighting.
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 text-sm">
                ✅ Found {scanResult.length} photo{scanResult.length !== 1 ? 's' : ''} with you in them!
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-8 py-10">
        {displayImages.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-[#aaa] text-sm">
              {scanResult !== null ? 'No matching photos found.' : 'No photos in this gallery yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {displayImages.map((img, index) => (
              <div
                key={img.id}
                className="group relative aspect-square rounded-xl overflow-hidden bg-[#e8e5e0] cursor-pointer"
                onClick={() => {
                  const fullIndex = gallery.images.findIndex(i => i.id === img.id)
                  setLightboxIndex(fullIndex >= 0 ? fullIndex : index)
                }}
              >
                <img
                  src={img.thumbUrl}
                  alt={img.filename}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <p className="text-white text-xs truncate w-full">{img.filename}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-8 border-t border-[#e8e5e0]">
        <p className="text-[#aaa] text-xs font-bold tracking-widest uppercase">
          Delivered by <span className="text-[#5f9ea0]">PRU</span><span className="text-[#999]">VIEW</span>
        </p>
      </div>

      {/* Lightbox */}
      {lightboxImage && lightboxIndex !== null && (
        <div
          className="fixed inset-0 bg-white z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            onClick={e => { e.stopPropagation(); goPrev() }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-[#0f0f0f] text-white rounded-full flex items-center justify-center text-2xl font-bold hover:bg-[#e8c547] hover:text-[#0f0f0f] transition-all z-10 shadow-xl"
          >❮</button>

          <button
            onClick={e => { e.stopPropagation(); goNext() }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-[#0f0f0f] text-white rounded-full flex items-center justify-center text-2xl font-bold hover:bg-[#e8c547] hover:text-[#0f0f0f] transition-all z-10 shadow-xl"
          >❯</button>

          <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[#aaa] text-sm">
                {lightboxIndex + 1} / {gallery.images.length}
              </span>
              <button
                onClick={() => setLightboxIndex(null)}
                className="text-[#aaa] hover:text-[#0f0f0f] text-sm transition-colors"
              >
                ✕ Close
              </button>
            </div>

            <img
              src={lightboxImage.thumbUrl}
              alt={lightboxImage.filename}
              className="w-full rounded-xl max-h-[75vh] object-contain"
            />

            <div className="flex items-center justify-between mt-4 px-1">
              <div>
                <p className="text-[#0f0f0f] text-sm font-medium">{lightboxImage.filename}</p>
                <p className="text-[#666] text-xs mt-0.5">{formatSize(lightboxImage.sizeBytes)}</p>
              </div>
              <button
                onClick={() => downloadImage(lightboxImage)}
                disabled={downloading === lightboxImage.id}
                className="px-5 py-2.5 bg-[#e8c547] text-[#0f0f0f] text-sm font-bold rounded-xl hover:bg-[#f0d060] disabled:opacity-50 transition-all shadow-md flex items-center gap-2"
              >
                {downloading === lightboxImage.id
                  ? 'Preparing…'
                  : <><span>⬇</span><span>Download Original</span></>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}