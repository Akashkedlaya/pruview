'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Payment = {
  id: number
  amount: number
  paidOn: string
  method: string
  notes?: string
}

type Invoice = {
  id: number
  eventId: number
  packageName?: string
  totalAmount: number
  status: string
  notes?: string
  payments: Payment[]
  event: {
    id: number
    coupleName: string
    startDate: string
    endDate: string
    status: string
  }
}

const STATUS_STYLES: Record<string, string> = {
  UNPAID:  'bg-red-100 text-red-600',
  PARTIAL: 'bg-amber-100 text-amber-600',
  PAID:    'bg-green-100 text-green-600',
  OVERDUE: 'bg-red-200 text-red-700',
}

const PAYMENT_METHODS = ['CASH', 'UPI', 'BANK', 'CARD', 'OTHER']

export default function InvoicesPage() {
  const router = useRouter()
  const [invoices, setInvoices]       = useState<Invoice[]>([])
  const [loading, setLoading]         = useState(true)
  const [expanded, setExpanded]       = useState<number | null>(null)
  const [editingId, setEditingId]     = useState<number | null>(null)
  const [addingPayment, setAddingPayment] = useState<number | null>(null)
  const [filter, setFilter]           = useState('all')

  // Edit invoice form
  const [editPackage, setEditPackage]   = useState('')
  const [editAmount, setEditAmount]     = useState('')
  const [editNotes, setEditNotes]       = useState('')
  const [savingInvoice, setSavingInvoice] = useState(false)

  // Add payment form
  const [payAmount, setPayAmount]   = useState('')
  const [payDate, setPayDate]       = useState(new Date().toISOString().split('T')[0])
  const [payMethod, setPayMethod]   = useState('CASH')
  const [payNotes, setPayNotes]     = useState('')
  const [savingPayment, setSavingPayment] = useState(false)

  const API = process.env.NEXT_PUBLIC_API_URL

  function getToken() { return localStorage.getItem('pruview_token') }

  async function loadInvoices() {
    try {
      const res = await fetch(`${API}/api/crm/invoices`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      if (res.status === 401) { router.push('/admin/login'); return }
      setInvoices(await res.json())
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  function getTotalPaid(invoice: Invoice) {
    return invoice.payments.reduce((sum, p) => sum + p.amount, 0)
  }

  function getBalance(invoice: Invoice) {
    return invoice.totalAmount - getTotalPaid(invoice)
  }

  function openEdit(invoice: Invoice) {
    setEditingId(invoice.id)
    setEditPackage(invoice.packageName || '')
    setEditAmount(invoice.totalAmount.toString())
    setEditNotes(invoice.notes || '')
  }

  async function saveInvoice(invoiceId: number) {
    setSavingInvoice(true)
    try {
      const res = await fetch(`${API}/api/crm/invoices/${invoiceId}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body:    JSON.stringify({
          packageName: editPackage,
          totalAmount: parseFloat(editAmount),
          notes:       editNotes
        })
      })
      const data = await res.json()
      setInvoices(prev => prev.map(i => i.id === invoiceId ? { ...i, ...data } : i))
      setEditingId(null)
    } catch (err) { console.error(err) }
    finally { setSavingInvoice(false) }
  }

  async function addPayment(invoiceId: number) {
    if (!payAmount) return
    setSavingPayment(true)
    try {
      const res = await fetch(`${API}/api/crm/invoices/${invoiceId}/payments`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body:    JSON.stringify({
          amount: parseFloat(payAmount),
          paidOn: payDate,
          method: payMethod,
          notes:  payNotes
        })
      })
      const data = await res.json()
      setInvoices(prev => prev.map(i =>
        i.id === invoiceId ? { ...i, ...data.invoice } : i
      ))
      setPayAmount(''); setPayNotes(''); setAddingPayment(null)
    } catch (err) { console.error(err) }
    finally { setSavingPayment(false) }
  }

  async function deletePayment(paymentId: number, invoiceId: number) {
    if (!confirm('Delete this payment?')) return
    await fetch(`${API}/api/crm/payments/${paymentId}`, {
      method:  'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    loadInvoices()
  }

  function sendWhatsAppReminder(invoice: Invoice) {
    const balance = getBalance(invoice)
    const message = `Hi ${invoice.event.coupleName},

This is a gentle reminder for your pending payment:

Package: ${invoice.packageName || 'Photography Package'}
Total Amount: ₹${invoice.totalAmount.toLocaleString('en-IN')}
Amount Paid: ₹${getTotalPaid(invoice).toLocaleString('en-IN')}
Balance Due: ₹${balance.toLocaleString('en-IN')}

Please let us know if you have any questions.

Thank you!
Pruview`
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const filtered = invoices.filter(i => {
    if (filter === 'all')     return true
    if (filter === 'pending') return i.status === 'UNPAID' || i.status === 'PARTIAL'
    if (filter === 'paid')    return i.status === 'PAID'
    return true
  })

  const totalRevenue    = invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + i.totalAmount, 0)
  const totalPending    = invoices.filter(i => i.status !== 'PAID').reduce((sum, i) => sum + getBalance(i), 0)

  useEffect(() => { loadInvoices() }, [])

  return (
    <div className="p-8">

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#0f0f0f]">Invoices & Payments</h1>
          <p className="text-[#888] text-sm mt-1">Track payments for all events</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-[#ede9fe] rounded-2xl p-5">
          <p className="text-3xl font-bold text-green-500">₹{totalRevenue.toLocaleString('en-IN')}</p>
          <p className="text-sm text-[#888] mt-1">Total Collected</p>
        </div>
        <div className="bg-white border border-[#ede9fe] rounded-2xl p-5">
          <p className="text-3xl font-bold text-red-500">₹{totalPending.toLocaleString('en-IN')}</p>
          <p className="text-sm text-[#888] mt-1">Pending Balance</p>
        </div>
        <div className="bg-white border border-[#ede9fe] rounded-2xl p-5">
          <p className="text-3xl font-bold text-[#7c3aed]">{invoices.length}</p>
          <p className="text-sm text-[#888] mt-1">Total Invoices</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-white border border-[#ede9fe] rounded-xl p-1 w-fit mb-6">
        {[
          { key: 'all',     label: 'All' },
          { key: 'pending', label: 'Pending' },
          { key: 'paid',    label: 'Paid' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filter === tab.key ? 'bg-[#7c3aed] text-white' : 'text-[#666] hover:text-[#0f0f0f]'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-[#888]">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 bg-white border border-[#ede9fe] rounded-2xl">
          <p className="text-[#888]">No invoices found.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map(invoice => {
            const totalPaid  = getTotalPaid(invoice)
            const balance    = getBalance(invoice)
            const isExpanded = expanded === invoice.id
            const isEditing  = editingId === invoice.id

            return (
              <div key={invoice.id} className="bg-white border border-[#ede9fe] rounded-2xl overflow-hidden">

                {/* Invoice header */}
                <div
                  className="px-6 py-5 flex items-center justify-between cursor-pointer hover:bg-[#faf9ff] transition-all"
                  onClick={() => setExpanded(isExpanded ? null : invoice.id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h3 className="font-bold text-[#0f0f0f] text-lg">{invoice.event.coupleName}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[invoice.status]}`}>
                        {invoice.status}
                      </span>
                    </div>
                    <p className="text-sm text-[#888]">
                      {invoice.packageName || 'Photography Package'} ·
                      {formatDate(invoice.event.startDate)}
                    </p>
                  </div>

                  <div className="flex items-center gap-6 text-right mr-4">
                    <div>
                      <p className="text-xs text-[#888]">Total</p>
                      <p className="font-bold text-[#0f0f0f]">₹{invoice.totalAmount.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#888]">Paid</p>
                      <p className="font-bold text-green-600">₹{totalPaid.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#888]">Balance</p>
                      <p className={`font-bold ${balance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                        ₹{balance.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>

                  <span className="text-[#aaa]">{isExpanded ? '▲' : '▼'}</span>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-[#f5f3ff] px-6 py-5">

                    {/* Edit invoice details */}
                    {isEditing ? (
                      <div className="grid grid-cols-3 gap-4 mb-5">
                        <div>
                          <label className="block text-xs font-semibold text-[#555] mb-1.5">Package Name</label>
                          <input type="text" value={editPackage} onChange={e => setEditPackage(e.target.value)}
                            className="w-full px-3 py-2 border border-[#e8e5e0] rounded-lg text-sm focus:outline-none focus:border-[#7c3aed] transition-all" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#555] mb-1.5">Total Amount (₹)</label>
                          <input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)}
                            className="w-full px-3 py-2 border border-[#e8e5e0] rounded-lg text-sm focus:outline-none focus:border-[#7c3aed] transition-all" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#555] mb-1.5">Notes</label>
                          <input type="text" value={editNotes} onChange={e => setEditNotes(e.target.value)}
                            className="w-full px-3 py-2 border border-[#e8e5e0] rounded-lg text-sm focus:outline-none focus:border-[#7c3aed] transition-all" />
                        </div>
                        <div className="col-span-3 flex gap-2">
                          <button onClick={() => saveInvoice(invoice.id)} disabled={savingInvoice}
                            className="px-4 py-2 bg-[#7c3aed] text-white text-sm font-semibold rounded-lg hover:bg-[#6d28d9] disabled:opacity-40 transition-all">
                            {savingInvoice ? 'Saving…' : 'Save'}
                          </button>
                          <button onClick={() => setEditingId(null)}
                            className="px-4 py-2 border border-[#e8e5e0] text-sm text-[#333] rounded-lg hover:bg-[#f5f3ff] transition-all">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between mb-5">
                        <p className="text-sm text-[#888]">
                          {invoice.packageName || 'Photography Package'}
                          {invoice.notes && ` · ${invoice.notes}`}
                        </p>
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(invoice)}
                            className="px-3 py-1.5 border border-[#ede9fe] text-xs text-[#7c3aed] rounded-lg hover:bg-[#ede9fe] transition-all">
                            Edit Invoice
                          </button>
                          {balance > 0 && (
                            <button onClick={() => sendWhatsAppReminder(invoice)}
                              className="px-3 py-1.5 bg-green-500 text-white text-xs font-semibold rounded-lg hover:bg-green-600 transition-all">
                              Send Reminder
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Payment history */}
                    <p className="text-xs font-semibold text-[#888] uppercase tracking-wider mb-3">Payment History</p>
                    {invoice.payments.length === 0 ? (
                      <p className="text-sm text-[#aaa] mb-4">No payments recorded yet.</p>
                    ) : (
                      <div className="flex flex-col gap-2 mb-4">
                        {invoice.payments.map(payment => (
                          <div key={payment.id} className="flex items-center justify-between py-2 border-b border-[#f5f3ff] last:border-0">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <span className="text-green-600 text-xs font-bold">₹</span>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-[#0f0f0f]">₹{payment.amount.toLocaleString('en-IN')}</p>
                                <p className="text-xs text-[#888]">{payment.method} · {formatDate(payment.paidOn)}</p>
                              </div>
                            </div>
                            <button onClick={() => deletePayment(payment.id, invoice.id)}
                              className="text-xs text-red-400 hover:text-red-600 transition-colors">
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add payment */}
                    {addingPayment === invoice.id ? (
                      <div className="bg-[#f5f3ff] rounded-xl p-4">
                        <p className="text-xs font-semibold text-[#7c3aed] uppercase tracking-wider mb-3">Add Payment</p>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-xs text-[#555] mb-1">Amount (₹) *</label>
                            <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                              placeholder="50000"
                              className="w-full px-3 py-2 border border-[#e8e5e0] rounded-lg text-sm focus:outline-none focus:border-[#7c3aed] transition-all" />
                          </div>
                          <div>
                            <label className="block text-xs text-[#555] mb-1">Date</label>
                            <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)}
                              className="w-full px-3 py-2 border border-[#e8e5e0] rounded-lg text-sm focus:outline-none focus:border-[#7c3aed] transition-all" />
                          </div>
                          <div>
                            <label className="block text-xs text-[#555] mb-1">Method</label>
                            <select value={payMethod} onChange={e => setPayMethod(e.target.value)}
                              className="w-full px-3 py-2 border border-[#e8e5e0] rounded-lg text-sm focus:outline-none focus:border-[#7c3aed] transition-all">
                              {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-[#555] mb-1">Notes</label>
                            <input type="text" value={payNotes} onChange={e => setPayNotes(e.target.value)}
                              placeholder="Token / Balance / etc"
                              className="w-full px-3 py-2 border border-[#e8e5e0] rounded-lg text-sm focus:outline-none focus:border-[#7c3aed] transition-all" />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => addPayment(invoice.id)} disabled={savingPayment || !payAmount}
                            className="px-4 py-2 bg-[#7c3aed] text-white text-sm font-semibold rounded-lg hover:bg-[#6d28d9] disabled:opacity-40 transition-all">
                            {savingPayment ? 'Saving…' : 'Add Payment'}
                          </button>
                          <button onClick={() => setAddingPayment(null)}
                            className="px-4 py-2 border border-[#e8e5e0] text-sm text-[#333] rounded-lg hover:bg-[#f5f3ff] transition-all">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      balance > 0 && (
                        <button onClick={() => setAddingPayment(invoice.id)}
                          className="px-4 py-2 bg-[#7c3aed] text-white text-sm font-semibold rounded-lg hover:bg-[#6d28d9] transition-all">
                          + Add Payment
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}