'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PendingActionsRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/admin/crm/post-production') }, [])
  return <div className="p-8 text-[#888]">Redirecting…</div>
}