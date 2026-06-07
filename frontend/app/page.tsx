'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen bg-[#EDE8D0] text-[#0a0a0a] font-sans">

      {/* ── Navbar ── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#EDE8D0]/95 backdrop-blur-sm border-b border-black/10' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-8 lg:px-16 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">
            pru<span className="text-[#2563eb]">view</span>
          </Link>

          <nav className="hidden md:flex items-center gap-10">
            <a href="#features" className="text-sm text-[#555] hover:text-[#0a0a0a] transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-[#555] hover:text-[#0a0a0a] transition-colors">How it works</a>
            <a href="#for-photographers" className="text-sm text-[#555] hover:text-[#0a0a0a] transition-colors">Photographers</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/admin/login" className="text-sm text-[#555] hover:text-[#0a0a0a] transition-colors">
              Log in
            </Link>
            <Link href="/admin/login" className="text-sm font-semibold bg-[#0a0a0a] text-white px-5 py-2.5 rounded-full hover:bg-[#2563eb] transition-colors">
              Get started
            </Link>
          </div>

          <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            )}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-[#EDE8D0] border-t border-black/10 px-8 py-5 flex flex-col gap-4">
            <a href="#features" className="text-sm text-[#555]" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#how-it-works" className="text-sm text-[#555]" onClick={() => setMenuOpen(false)}>How it works</a>
            <a href="#for-photographers" className="text-sm text-[#555]" onClick={() => setMenuOpen(false)}>Photographers</a>
            <Link href="/admin/login" className="text-sm font-semibold text-[#0a0a0a]">Log in</Link>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20 pb-0 bg-[#EDE8D0]">
        <p className="text-[11px] font-semibold tracking-[0.25em] uppercase text-[#2563eb] mb-8">
          Wedding photography platform
        </p>
        <h1 className="text-5xl sm:text-7xl lg:text-[90px] font-bold text-[#0a0a0a] leading-[1.02] tracking-tight max-w-5xl">
          Your photography.<br />
          <span className="font-light text-[#444]">Beautifully</span> delivered.
        </h1>
        <p className="mt-8 text-lg sm:text-xl text-[#666] max-w-lg leading-relaxed font-light">
          Share wedding galleries instantly. Let guests find their own photos using AI face recognition — no sign-up required.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3 items-center">
          <Link
            href="/admin/login"
            className="px-8 py-4 bg-[#0a0a0a] text-white font-semibold text-sm rounded-full hover:bg-[#2563eb] transition-colors"
          >
            Start for free
          </Link>
          <a
            href="#features"
            className="px-8 py-4 border border-black/20 text-[#0a0a0a] font-medium text-sm rounded-full hover:border-black/40 transition-colors"
          >
            See how it works
          </a>
        </div>

        {/* Gallery preview mockup */}
        <div className="mt-20 w-full max-w-4xl mx-auto">
          <div className="bg-white rounded-t-2xl border border-black/10 border-b-0 shadow-[0_-8px_40px_rgba(0,0,0,0.12)] overflow-hidden">
            <div className="bg-[#f2f2f2] border-b border-black/10 px-5 py-3 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <div className="w-3 h-3 rounded-full bg-[#28c840]" />
              </div>
              <div className="flex-1 bg-white rounded-md h-6 flex items-center px-3 max-w-xs mx-auto">
                <span className="text-[11px] text-[#999]">pruview.in/g/sharma-wedding</span>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-semibold text-sm text-[#0a0a0a]">Sharma Wedding Gallery</h3>
                  <p className="text-xs text-[#999] mt-0.5">247 photos · Jun 2025</p>
                </div>
                <button className="text-xs px-4 py-2 rounded-full bg-[#2563eb] text-white font-semibold hover:bg-[#1d4ed8] transition-colors">
                  Find my photos
                </button>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {[
                  'https://images.unsplash.com/photo-1519741497674-611481863552?w=200&q=80',
                  'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=200&q=80',
                  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=200&q=80',
                  'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=200&q=80',
                  'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=200&q=80',
                  'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=200&q=80',
                  'https://images.unsplash.com/photo-1519741497674-611481863552?w=200&q=80',
                  'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=200&q=80',
                  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=200&q=80',
                  'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=200&q=80',
                  'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=200&q=80',
                  'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=200&q=80',
                ].map((src, i) => (
                  <div key={i} className="aspect-square rounded-xl overflow-hidden bg-[#f5f5f5]">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-16 px-6 border-y border-black/10 bg-white">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '10,000+', label: 'Photos delivered' },
            { value: '99%', label: 'Face match accuracy' },
            { value: '< 30s', label: 'Gallery share time' },
            { value: '500+', label: 'Events managed' },
          ].map((s, i) => (
            <div key={i}>
              <p className="text-3xl sm:text-4xl font-bold text-[#0a0a0a]">{s.value}</p>
              <p className="text-sm text-[#999] mt-2 font-light">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature 1: AI Face Recognition ── */}
      <section id="features" className="py-32 px-6 lg:px-16 bg-[#EDE8D0]">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.25em] uppercase text-[#2563eb] mb-6">01 — AI Recognition</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-[#0a0a0a] leading-[1.1]">
              Guests find their<br />photos <span className="font-light text-[#555]">instantly.</span>
            </h2>
            <p className="mt-6 text-[#555] text-lg leading-relaxed max-w-md font-light">
              No app download. No sign-up. Open the link, scan your face, and see every photo you appear in — within seconds.
            </p>
            <div className="mt-10 space-y-3">
              {[
                'Works on any device with a camera',
                'Face scan takes under 2 seconds',
                '99% face match accuracy',
                'Privacy-first — no biometric data stored',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#2563eb] flex-shrink-0" />
                  <span className="text-sm text-[#444]">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="bg-white rounded-3xl border border-black/8 p-5 shadow-xl">
              <div className="aspect-[4/3] rounded-2xl bg-[#0a0a0a] flex items-center justify-center relative overflow-hidden mb-4">
                <img
                  src="https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80"
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-30"
                />
                <div className="relative z-10 text-center">
                  <div className="w-28 h-28 rounded-full border-2 border-[#2563eb] mx-auto mb-4 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full border border-[#2563eb]/40 flex items-center justify-center">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                    </div>
                  </div>
                  <p className="text-white text-sm font-medium">Scanning face...</p>
                  <p className="text-white/40 text-xs mt-1">Hold still for a moment</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-[#eff6ff] rounded-xl px-4 py-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span className="text-sm font-semibold text-[#0a0a0a]">47 photos found for you</span>
                <span className="ml-auto text-xs text-[#2563eb] font-medium">Download all</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature 2: Gallery Sharing (dark) ── */}
      <section className="py-32 px-6 lg:px-16 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <div className="relative order-2 lg:order-1">
            <div className="grid grid-cols-2 gap-3">
              {[
                { src: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=600&q=80', span: 'col-span-2 aspect-[16/7]' },
                { src: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&q=80', span: 'aspect-square' },
                { src: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&q=80', span: 'aspect-square' },
              ].map((img, i) => (
                <div key={i} className={`rounded-2xl overflow-hidden ${img.span}`}>
                  <img src={img.src} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <div className="absolute bottom-4 left-4 right-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-white text-xs font-medium truncate">pruview.in/g/sharma-wedding</span>
              <div className="flex items-center gap-1.5 text-white/50 text-xs flex-shrink-0 ml-3">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                Share link
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <p className="text-[11px] font-semibold tracking-[0.25em] uppercase text-[#60a5fa] mb-6">02 — Gallery Sharing</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-white leading-[1.1]">
              One link.<br />Every photo.<br /><span className="font-light text-[#60a5fa]">Ready to share.</span>
            </h2>
            <p className="mt-6 text-white/50 text-lg leading-relaxed max-w-md font-light">
              Upload your edited photos and get a beautiful, branded gallery link in seconds. Share it with clients and their guests instantly.
            </p>
            <div className="mt-10 space-y-3">
              {[
                'Secure cloud storage with AWS S3',
                'Full-resolution downloads',
                'Works on any browser and device',
                'No watermarks, no file limits',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#60a5fa] flex-shrink-0" />
                  <span className="text-sm text-white/60">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature 3: Business Dashboard ── */}
      <section id="for-photographers" className="py-32 px-6 lg:px-16 bg-white">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.25em] uppercase text-[#2563eb] mb-6">03 — Business Dashboard</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-[#0a0a0a] leading-[1.1]">
              Run your entire<br />business from<br /><span className="font-light text-[#555]">one place.</span>
            </h2>
            <p className="mt-6 text-[#555] text-lg leading-relaxed max-w-md font-light">
              From first enquiry to final payment — manage your team, track post-production, and invoice clients without juggling multiple tools.
            </p>
            <div className="mt-10 space-y-3">
              {[
                'Enquiry management and lead tracking',
                'Slot-based photographer booking calendar',
                'Post-production task tracking',
                'Invoices with UPI, cash, and bank transfer',
                'Full event archive with payment history',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#2563eb] flex-shrink-0" />
                  <span className="text-sm text-[#444]">{item}</span>
                </div>
              ))}
            </div>
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-2 mt-10 px-7 py-3.5 bg-[#0a0a0a] text-white text-sm font-semibold rounded-full hover:bg-[#2563eb] transition-colors"
            >
              Open dashboard
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
          </div>

          {/* CRM preview */}
          <div className="bg-[#EDE8D0] rounded-3xl border border-black/8 p-1.5 shadow-xl">
            <div className="bg-white rounded-2xl overflow-hidden">
              <div className="bg-[#f9f9f9] border-b border-black/5 px-4 py-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-[#0a0a0a]">pru<span className="text-[#2563eb]">view</span> CRM</span>
                <span className="text-[10px] bg-[#dbeafe] text-[#2563eb] px-2 py-0.5 rounded-full font-semibold">Live</span>
              </div>
              <div className="flex">
                <div className="w-36 bg-[#f9f9f9] border-r border-black/5 p-2 flex flex-col gap-1">
                  {['Dashboard', 'Calendar', 'Enquiries', 'Invoices', 'Completed'].map((item, i) => (
                    <div key={i} className={`px-3 py-1.5 rounded-lg text-[10px] font-medium ${i === 0 ? 'bg-[#dbeafe] text-[#2563eb]' : 'text-[#888]'}`}>
                      {item}
                    </div>
                  ))}
                </div>
                <div className="flex-1 p-4">
                  <p className="text-[11px] font-semibold text-[#0a0a0a] mb-3">Upcoming events</p>
                  <div className="space-y-2 mb-4">
                    {[
                      { name: 'Priya & Arjun', date: 'Jun 12', status: 'CONFIRMED', bg: '#dcfce7', color: '#16a34a' },
                      { name: 'Meera & Karan', date: 'Jun 18', status: 'ACTIVE', bg: '#dbeafe', color: '#2563eb' },
                      { name: 'Sana & Rohit', date: 'Jun 25', status: 'UPCOMING', bg: '#fef3c7', color: '#d97706' },
                    ].map((e, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl border border-black/5">
                        <div>
                          <p className="text-[10px] font-semibold text-[#0a0a0a]">{e.name}</p>
                          <p className="text-[9px] text-[#bbb]">{e.date}</p>
                        </div>
                        <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: e.bg, color: e.color }}>
                          {e.status}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[#eff6ff] rounded-xl p-3">
                      <p className="text-[18px] font-bold text-[#2563eb]">12</p>
                      <p className="text-[9px] text-[#888]">Events this month</p>
                    </div>
                    <div className="bg-[#f0fdf4] rounded-xl p-3">
                      <p className="text-[18px] font-bold text-[#16a34a]">₹2.4L</p>
                      <p className="text-[9px] text-[#888]">Revenue collected</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-32 px-6 lg:px-16 bg-[#EDE8D0]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-[11px] font-semibold tracking-[0.25em] uppercase text-[#2563eb] mb-6">For guests</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-[#0a0a0a]">
              Find your photos<br /><span className="font-light text-[#555]">in three steps.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                step: '01',
                title: 'Open the gallery link',
                desc: 'Your photographer shares a unique link after the event. Open it on any device — phone, tablet, or laptop. No app needed.',
              },
              {
                step: '02',
                title: 'Scan your face',
                desc: "Tap 'Find my photos', allow camera access, and look at the screen for 2 seconds. Our AI does the rest.",
              },
              {
                step: '03',
                title: 'Download your photos',
                desc: 'See every photo you appear in, instantly. Download one, a few, or all of them in a single click.',
              },
            ].map((s, i) => (
              <div key={i}>
                <p className="text-7xl font-bold text-black/8 mb-5 leading-none">{s.step}</p>
                <h3 className="font-semibold text-[#0a0a0a] text-lg mb-3">{s.title}</h3>
                <p className="text-sm text-[#666] leading-relaxed font-light">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-40 px-6 bg-[#0a0a0a] text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl sm:text-6xl font-bold text-white leading-[1.05] mb-6">
            Ready to delight<br /><span className="font-light text-[#60a5fa]">your clients?</span>
          </h2>
          <p className="text-white/40 text-lg mb-10 font-light">
            Start delivering beautiful galleries with AI face recognition today. Free to get started.
          </p>
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-2 px-10 py-4 bg-white text-[#0a0a0a] font-semibold text-sm rounded-full hover:bg-[#EDE8D0] transition-colors"
          >
            Get started free
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#0a0a0a] border-t border-white/[0.06] text-[#555] py-14 px-8 lg:px-16">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-10">
          <div>
            <p className="font-bold text-white text-xl">pru<span className="text-[#2563eb]">view</span></p>
            <p className="text-xs text-[#444] mt-2 max-w-xs font-light">Beautiful wedding galleries with AI-powered face recognition.</p>
          </div>
          <div className="flex flex-wrap gap-8 text-xs">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
            <a href="#for-photographers" className="hover:text-white transition-colors">For photographers</a>
            <Link href="/admin/login" className="hover:text-white transition-colors">Admin login</Link>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#333]">© 2025 Pruview. All rights reserved.</p>
          <p className="text-xs text-[#333]">www.pruview.in</p>
        </div>
      </footer>
    </div>
  )
}
