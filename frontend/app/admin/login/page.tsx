'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        }
      )
      const data = await res.json()
      if (!res.ok) {
        setError(data.message || 'Login failed')
        return
      }
      localStorage.setItem('pruview_token', data.token)
      // Also save as cookie for middleware to read
      document.cookie = `pruview_token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict`
      router.push('/admin')
    } catch (err) {
      setError('Cannot connect to server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* Left — branding */}
      <div className="hidden lg:flex w-1/2 bg-[#0f0f0f] flex-col justify-between p-14">
        <span className="text-white text-2xl font-semibold">
          pru<span className="text-[#e8c547]">view</span>
        </span>
        <div>
          <p className="text-[#444] text-xs tracking-[4px] uppercase mb-4">Admin Portal</p>
          <h2 className="text-white text-4xl font-light leading-tight">
            Your images.<br />
            <span className="text-[#e8c547] italic">Beautifully</span><br />
            delivered.
          </h2>
        </div>
        <p className="text-[#333] text-xs">© 2025 Pruview</p>
      </div>

      {/* Right — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-[#f8f7f4] p-8">
        <div className="w-full max-w-sm">

          <h1 className="text-3xl font-semibold text-[#0f0f0f] mb-2">
            Sign in
          </h1>
          <p className="text-[#888] text-sm mb-8">Enter your credentials to continue</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            <div>
              <label className="block text-xs font-semibold tracking-widest uppercase text-[#555] mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="admin@pruview.com"
                className="w-full px-4 py-3 bg-white border border-[#e0ddd8] rounded-xl text-sm text-[#0f0f0f] placeholder-[#aaa] focus:outline-none focus:border-[#c8a020] focus:ring-1 focus:ring-[#c8a020] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-widest uppercase text-[#555] mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-white border border-[#e0ddd8] rounded-xl text-sm text-[#0f0f0f] placeholder-[#aaa] focus:outline-none focus:border-[#c8a020] focus:ring-1 focus:ring-[#c8a020] transition-all"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#0f0f0f] text-white text-sm font-semibold rounded-xl hover:bg-[#222] disabled:opacity-50 transition-all"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>

          </form>
        </div>
      </div>

    </div>
  )
}