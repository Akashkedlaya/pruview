'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect } from 'react'

export default function EnquiryDetail() {
  const router = useRouter()
  const { id } = useParams()

  useEffect(() => {
    router.push('/admin/crm/enquiries')
  }, [])

  return (
    <div className="p-8">
      <p className="text-[#888]">Loading...</p>
    </div>
  )
}
