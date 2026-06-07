'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white text-[#0f0f0f] font-sans">

      {/* ── Navbar ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#7c3aed] rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white text-xs font-bold tracking-tight">P</span>
            </div>
            <span className="font-semibold text-[#0f0f0f] text-base">
              pru<span className="text-[#7c3aed]">view</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-[#555] hover:text-[#7c3aed] transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-[#555] hover:text-[#7c3aed] transition-colors">How it works</a>
            <a href="#for-photographers" className="text-sm text-[#555] hover:text-[#7c3aed] transition-colors">For photographers</a>
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/admin/login"
              className="text-sm font-medium text-[#0f0f0f] hover:text-[#7c3aed] transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/admin/login"
              className="text-sm font-medium bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-5 py-2 rounded-full transition-colors shadow-sm"
            >
              Get started
            </Link>
          </div>

          {/* Hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-[#555] hover:bg-gray-100"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 flex flex-col gap-4">
            <a href="#features" className="text-sm text-[#555]" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#how-it-works" className="text-sm text-[#555]" onClick={() => setMenuOpen(false)}>How it works</a>
            <a href="#for-photographers" className="text-sm text-[#555]" onClick={() => setMenuOpen(false)}>For photographers</a>
            <Link href="/admin/login" className="text-sm font-medium text-[#7c3aed]">Log in →</Link>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center bg-[#0f0f0f] overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:64px_64px]" />
        {/* Purple glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#7c3aed] rounded-full opacity-[0.12] blur-[120px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 pt-24 pb-20 flex flex-col lg:flex-row items-center gap-16">
          {/* Text */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#7c3aed]/20 border border-[#7c3aed]/30 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#a78bfa] animate-pulse" />
              <span className="text-xs font-medium text-[#a78bfa]">Wedding photography platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
              Every moment,
              <br />
              <span className="text-[#7c3aed]">beautifully</span>
              <br />
              delivered.
            </h1>

            <p className="mt-6 text-base sm:text-lg text-[#999] max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Share wedding galleries with guests. Let them find their own photos using AI face recognition — no sign-up required.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link
                href="/admin/login"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold text-sm transition-all shadow-lg shadow-[#7c3aed]/30 hover:shadow-[#7c3aed]/50"
              >
                Get started free
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full border border-white/20 text-white/80 hover:text-white hover:border-white/40 font-medium text-sm transition-all"
              >
                See how it works
              </a>
            </div>

            {/* Social proof */}
            <div className="mt-12 flex items-center gap-6 justify-center lg:justify-start">
              <div className="flex -space-x-2">
                {['#7c3aed','#9333ea','#a855f7','#c084fc'].map((c, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0f0f0f] flex items-center justify-center text-white text-xs font-bold" style={{backgroundColor: c}}>
                    {['A','B','C','D'][i]}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex text-[#f59e0b] text-sm">★★★★★</div>
                <p className="text-xs text-[#777] mt-0.5">Loved by photographers</p>
              </div>
            </div>
          </div>

          {/* Gallery preview card */}
          <div className="flex-1 flex justify-center lg:justify-end w-full max-w-lg">
            <div className="relative w-full max-w-md">
              {/* Main card */}
              <div className="bg-[#1a1a1a] rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                <div className="bg-[#111] px-5 py-3.5 flex items-center gap-3 border-b border-white/[0.06]">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                    <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                    <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                  </div>
                  <div className="flex-1 bg-[#222] rounded-md h-6 flex items-center px-3">
                    <span className="text-[10px] text-[#555]">pruview.in/g/sharma-wedding</span>
                  </div>
                </div>
                {/* Gallery grid */}
                <div className="p-4 grid grid-cols-3 gap-2">
                  {[
                    'https://images.unsplash.com/photo-1519741497674-611481863552?w=200&q=80',
                    'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=200&q=80',
                    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=200&q=80',
                    'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=200&q=80',
                    'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=200&q=80',
                    'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=200&q=80',
                  ].map((src, i) => (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden bg-[#222]">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                {/* Face scan bar */}
                <div className="mx-4 mb-4 px-4 py-3 bg-[#7c3aed]/20 border border-[#7c3aed]/30 rounded-2xl flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#7c3aed]/30 flex items-center justify-center flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/><path d="M20 8h-1M5 8H4M12 3V2M17.7 5.3l-.7.7M6.3 5.3l.7.7"/></svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Find your photos</p>
                    <p className="text-[10px] text-[#777]">Scan your face to find photos of you</p>
                  </div>
                  <div className="ml-auto">
                    <div className="w-7 h-7 rounded-full bg-[#7c3aed] flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl px-3 py-2 flex items-center gap-2 border border-gray-100">
                <div className="w-6 h-6 bg-[#dcfce7] rounded-full flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <span className="text-xs font-semibold text-[#0f0f0f]">47 photos found!</span>
              </div>

              {/* Floating download badge */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl px-3 py-2 flex items-center gap-2 border border-gray-100">
                <div className="w-6 h-6 bg-[#ede9fe] rounded-full flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </div>
                <span className="text-xs font-semibold text-[#0f0f0f]">Download all</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="bg-[#f9f7ff] border-y border-[#ede9fe] py-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '10,000+', label: 'Photos delivered' },
            { value: '99%', label: 'Face match accuracy' },
            { value: '< 30s', label: 'Gallery share time' },
            { value: '500+', label: 'Events managed' },
          ].map((s, i) => (
            <div key={i}>
              <p className="text-2xl sm:text-3xl font-bold text-[#7c3aed]">{s.value}</p>
              <p className="text-sm text-[#666] mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-[#7c3aed] uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0f0f0f]">Everything you need,<br />nothing you don't.</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/><path d="M20 8h-1M5 8H4"/></svg>
                ),
                title: 'AI face recognition',
                desc: 'Guests scan their face with their camera and instantly see only the photos they appear in. No app download, no login needed.',
                accent: '#7c3aed',
                bg: '#f5f3ff',
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                ),
                title: 'Smart galleries',
                desc: 'Share a single link with your clients. They get a beautiful, branded gallery with all event photos, organized and ready to download.',
                accent: '#0ea5e9',
                bg: '#f0f9ff',
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                ),
                title: 'One-click download',
                desc: 'Guests download individual photos or the entire gallery in one click. Full-resolution files directly from secure cloud storage.',
                accent: '#10b981',
                bg: '#f0fdf4',
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                ),
                title: 'Lead management',
                desc: 'Capture enquiries, track follow-ups, and convert leads into bookings — all from your CRM dashboard.',
                accent: '#f59e0b',
                bg: '#fffbeb',
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                ),
                title: 'Post-production tracking',
                desc: 'Track editing progress — culling, retouching, album design — with task assignment and due dates per event.',
                accent: '#ec4899',
                bg: '#fdf2f8',
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                ),
                title: 'Invoices & payments',
                desc: 'Generate invoices, record payments (UPI, cash, bank), and track outstanding balances — everything in one place.',
                accent: '#6366f1',
                bg: '#eef2ff',
              },
            ].map((f, i) => (
              <div key={i} className="rounded-2xl p-6 border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all group">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-all" style={{backgroundColor: f.bg, color: f.accent}}>
                  {f.icon}
                </div>
                <h3 className="font-semibold text-[#0f0f0f] mb-2">{f.title}</h3>
                <p className="text-sm text-[#666] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works (for guests) ── */}
      <section id="how-it-works" className="bg-[#0f0f0f] py-24 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-[#a78bfa] uppercase tracking-widest mb-3">For guests</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Find your photos in seconds.</h2>
            <p className="text-[#777] mt-4 max-w-xl mx-auto text-sm leading-relaxed">No app download. No account. Just open the link the photographer shares and let the magic happen.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-8 left-1/4 right-1/4 h-px bg-gradient-to-r from-[#7c3aed]/40 via-[#7c3aed] to-[#7c3aed]/40" />

            {[
              {
                step: '01',
                title: 'Open the gallery link',
                desc: 'Your photographer shares a unique link after the event. Open it on any device — no app needed.',
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                ),
              },
              {
                step: '02',
                title: 'Scan your face',
                desc: 'Tap the face scan button, allow camera access, and look at your screen for 2 seconds.',
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6V4a2 2 0 0 1 2-2h2M4 18v2a2 2 0 0 0 2 2h2M14 4h2a2 2 0 0 1 2 2v2M14 20h2a2 2 0 0 0 2-2v-2"/><circle cx="12" cy="12" r="3"/></svg>
                ),
              },
              {
                step: '03',
                title: 'Download your photos',
                desc: 'Instantly see every photo you appear in. Download one or all with a single tap.',
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                ),
              },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center text-center relative">
                <div className="w-16 h-16 rounded-2xl bg-[#7c3aed] flex items-center justify-center text-white mb-5 shadow-lg shadow-[#7c3aed]/30 z-10">
                  {s.icon}
                </div>
                <span className="text-xs font-mono text-[#7c3aed] mb-2">{s.step}</span>
                <h3 className="font-semibold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-[#777] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── For photographers ── */}
      <section id="for-photographers" className="py-24 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Text */}
            <div>
              <p className="text-sm font-semibold text-[#7c3aed] uppercase tracking-widest mb-4">For photographers</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#0f0f0f] leading-snug">
                Run your entire business<br />from one place.
              </h2>
              <p className="text-[#666] mt-5 leading-relaxed">
                From first enquiry to final delivery — manage your team, track post-production, and get paid without juggling multiple tools.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  'Manage enquiries and convert leads to bookings',
                  'Schedule photographers with slot-based calendar',
                  'Track editing tasks and production milestones',
                  'Send invoices and record UPI / cash / bank payments',
                  'Archive completed events with full payment history',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#ede9fe] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <span className="text-sm text-[#444]">{item}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/admin/login"
                className="inline-flex items-center gap-2 mt-10 px-7 py-3 rounded-full bg-[#7c3aed] text-white text-sm font-semibold hover:bg-[#6d28d9] transition-colors shadow-lg shadow-[#7c3aed]/25"
              >
                Open your dashboard
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </Link>
            </div>

            {/* Right: CRM preview */}
            <div className="relative">
              <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl overflow-hidden">
                {/* Mini sidebar */}
                <div className="flex">
                  <div className="w-44 bg-[#fafafa] border-r border-gray-100 p-3 flex flex-col gap-1">
                    <div className="px-3 py-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-[#7c3aed] rounded-md flex items-center justify-center">
                          <span className="text-white text-[9px] font-bold">P</span>
                        </div>
                        <span className="text-xs font-semibold text-[#0f0f0f]">pru<span className="text-[#7c3aed]">view</span></span>
                      </div>
                      <p className="text-[9px] text-[#aaa] mt-0.5 ml-8">CRM</p>
                    </div>
                    {['Dashboard', 'Calendar', 'Enquiries', 'Invoices', 'Completed'].map((item, i) => (
                      <div key={i} className={`px-3 py-1.5 rounded-lg text-[10px] font-medium ${i === 0 ? 'bg-[#ede9fe] text-[#7c3aed]' : 'text-[#888]'}`}>
                        {item}
                      </div>
                    ))}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4">
                    <p className="text-xs font-semibold text-[#0f0f0f] mb-3">Upcoming events</p>
                    <div className="space-y-2">
                      {[
                        { name: 'Priya & Arjun', date: 'Jun 12', status: 'CONFIRMED', color: '#dcfce7', textColor: '#16a34a' },
                        { name: 'Meera & Karan', date: 'Jun 18', status: 'ACTIVE', color: '#ede9fe', textColor: '#7c3aed' },
                        { name: 'Sana & Rohit', date: 'Jun 25', status: 'UPCOMING', color: '#fef3c7', textColor: '#d97706' },
                      ].map((e, i) => (
                        <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#fafafa] border border-gray-100">
                          <div>
                            <p className="text-[10px] font-semibold text-[#0f0f0f]">{e.name}</p>
                            <p className="text-[9px] text-[#aaa]">{e.date}</p>
                          </div>
                          <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full" style={{backgroundColor: e.color, color: e.textColor}}>
                            {e.status}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="bg-[#f5f3ff] rounded-xl p-3">
                        <p className="text-[18px] font-bold text-[#7c3aed]">12</p>
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
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="bg-[#7c3aed] py-20 px-6 lg:px-10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Ready to delight your clients?</h2>
          <p className="text-[#c4b5fd] mt-4 text-base">Start delivering beautiful galleries with face recognition today.</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/admin/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-white text-[#7c3aed] font-semibold text-sm hover:bg-[#f5f3ff] transition-colors shadow-lg"
            >
              Get started free
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#0f0f0f] text-[#666] py-12 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            {/* Logo */}
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 bg-[#7c3aed] rounded-xl flex items-center justify-center">
                  <span className="text-white text-xs font-bold">P</span>
                </div>
                <span className="font-semibold text-white text-base">
                  pru<span className="text-[#7c3aed]">view</span>
                </span>
              </div>
              <p className="text-xs text-[#555] max-w-xs">Beautiful wedding galleries with AI-powered face recognition.</p>
            </div>

            {/* Links */}
            <div className="flex flex-wrap gap-6 text-sm">
              <a href="#features" className="hover:text-white transition-colors text-xs">Features</a>
              <a href="#how-it-works" className="hover:text-white transition-colors text-xs">How it works</a>
              <a href="#for-photographers" className="hover:text-white transition-colors text-xs">For photographers</a>
              <Link href="/admin/login" className="hover:text-white transition-colors text-xs">Admin login</Link>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[#444]">© 2025 Pruview. All rights reserved.</p>
            <p className="text-xs text-[#444]">www.pruview.in</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
