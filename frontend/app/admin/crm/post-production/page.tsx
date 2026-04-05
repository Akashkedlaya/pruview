'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Task = {
  id: number
  taskName: string
  assigneeName?: string
  dueDate?: string
  status: string
  notes?: string
  order: number
}

type Invoice = {
  id: number
  totalAmount: number
  status: string
  payments: { amount: number }[]
}

type Event = {
  id: number
  coupleName: string
  startDate: string
  endDate: string
  location?: string
  deliveryDeadline?: string
  postProductionTasks: Task[]
  invoice?: Invoice
}

const TASK_STATUS_STYLES: Record<string, string> = {
  NOT_STARTED:   'bg-gray-100 text-gray-600',
  IN_PROGRESS:   'bg-blue-100 text-blue-600',
  REVIEW:        'bg-amber-100 text-amber-600',
  COMPLETED:     'bg-green-100 text-green-600',
}

const TASK_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']
const TASK_STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  REVIEW:      'In Review',
  COMPLETED:   'Completed',
}

export default function PostProductionPage() {
  const router = useRouter()
  const [events, setEvents]   = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [savingTask, setSavingTask] = useState<number | null>(null)
  const [addingTask, setAddingTask] = useState<number | null>(null)
  const [newTaskName, setNewTaskName] = useState('')

  const API = process.env.NEXT_PUBLIC_API_URL

  function getToken() { return localStorage.getItem('pruview_token') }

  async function loadEvents() {
    try {
      const res = await fetch(`${API}/api/crm/post-production`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      if (res.status === 401) { router.push('/admin/login'); return }
      setEvents(await res.json())
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  async function seedTasks(eventId: number) {
    const res = await fetch(`${API}/api/crm/post-production/${eventId}/seed-tasks`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    const tasks = await res.json()
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, postProductionTasks: tasks } : e))
  }

  async function updateTask(taskId: number, eventId: number, updates: Partial<Task>) {
    setSavingTask(taskId)
    try {
      const res = await fetch(`${API}/api/crm/post-production/tasks/${taskId}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body:    JSON.stringify(updates)
      })
      const updated = await res.json()
      setEvents(prev => prev.map(e => {
        if (e.id !== eventId) return e
        return { ...e, postProductionTasks: e.postProductionTasks.map(t => t.id === taskId ? updated : t) }
      }))
      // Check if event completed → remove from list
      const event = events.find(e => e.id === eventId)
      if (event) {
        const allDone = event.postProductionTasks
          .map(t => t.id === taskId ? { ...t, ...updates } : t)
          .every(t => t.status === 'COMPLETED')
        if (allDone && event.invoice?.status === 'PAID') {
          setEvents(prev => prev.filter(e => e.id !== eventId))
          router.push('/admin/crm/completed')
        }
      }
    } catch (err) { console.error(err) }
    finally { setSavingTask(null) }
  }

  async function addCustomTask(eventId: number) {
    if (!newTaskName.trim()) return
    const res = await fetch(`${API}/api/crm/post-production/${eventId}/tasks`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body:    JSON.stringify({ taskName: newTaskName.trim(), status: 'NOT_STARTED' })
    })
    const task = await res.json()
    setEvents(prev => prev.map(e => e.id === eventId
      ? { ...e, postProductionTasks: [...e.postProductionTasks, task] }
      : e
    ))
    setNewTaskName('')
    setAddingTask(null)
  }

  async function updateDeadline(eventId: number, date: string) {
    await fetch(`${API}/api/crm/events/${eventId}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body:    JSON.stringify({ deliveryDeadline: date || null })
    })
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, deliveryDeadline: date } : e))
  }

  function getProgress(tasks: Task[]) {
    if (!tasks.length) return 0
    return Math.round((tasks.filter(t => t.status === 'COMPLETED').length / tasks.length) * 100)
  }

  function getTotalPaid(invoice?: Invoice) {
    if (!invoice) return 0
    return invoice.payments.reduce((sum, p) => sum + p.amount, 0)
  }

  function formatDate(date?: string) {
    if (!date) return null
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  function isOverdue(date?: string) {
    if (!date) return false
    return new Date(date) < new Date()
  }

  useEffect(() => { loadEvents() }, [])

  const activeEvents   = events.filter(e => {
    const progress = getProgress(e.postProductionTasks)
    return progress < 100 || e.invoice?.status !== 'PAID'
  })
  const overdueEvents  = events.filter(e => isOverdue(e.deliveryDeadline))

  return (
    <div className="p-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#0f0f0f]">Post Production</h1>
          <p className="text-[#888] text-sm mt-1">Track editing, delivery and completion for past events</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-[#ede9fe] rounded-2xl p-5">
          <p className="text-3xl font-bold text-[#7c3aed]">{events.length}</p>
          <p className="text-sm text-[#888] mt-1">In Post Production</p>
        </div>
        <div className="bg-white border border-[#ede9fe] rounded-2xl p-5">
          <p className="text-3xl font-bold text-red-500">{overdueEvents.length}</p>
          <p className="text-sm text-[#888] mt-1">Overdue</p>
        </div>
        <div className="bg-white border border-[#ede9fe] rounded-2xl p-5">
          <p className="text-3xl font-bold text-green-500">
            {events.filter(e => getProgress(e.postProductionTasks) === 100).length}
          </p>
          <p className="text-sm text-[#888] mt-1">Tasks Complete</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-[#888]">Loading…</div>
      ) : events.length === 0 ? (
        <div className="text-center py-24 bg-white border border-[#ede9fe] rounded-2xl">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <p className="font-semibold text-[#333]">All caught up!</p>
          <p className="text-sm text-[#888] mt-1">No events in post production.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {events.map(event => {
            const progress    = getProgress(event.postProductionTasks)
            const totalPaid   = getTotalPaid(event.invoice)
            const balance     = (event.invoice?.totalAmount || 0) - totalPaid
            const isExpanded  = expanded === event.id
            const overdue     = isOverdue(event.deliveryDeadline)

            return (
              <div key={event.id} className={`bg-white border rounded-2xl overflow-hidden transition-all ${
                overdue ? 'border-red-200' : 'border-[#ede9fe]'
              }`}>

                {/* Card header */}
                <div
                  className="px-6 py-5 flex items-center justify-between cursor-pointer hover:bg-[#faf9ff] transition-all"
                  onClick={() => {
                    setExpanded(isExpanded ? null : event.id)
                    if (!isExpanded && event.postProductionTasks.length === 0) {
                      seedTasks(event.id)
                    }
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <h3 className="font-bold text-[#0f0f0f] text-lg">{event.coupleName}</h3>
                      {overdue && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-600">
                          Overdue
                        </span>
                      )}
                      {event.invoice?.status === 'PAID' && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-600">
                          Paid
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#888]">
                      {formatDate(event.startDate)} – {formatDate(event.endDate)}
                      {event.location && ` · ${event.location}`}
                    </p>

                    {/* Progress bar */}
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex-1 bg-[#f0ede8] rounded-full h-2">
                        <div
                          className="bg-[#7c3aed] h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-[#888] w-10 text-right">{progress}%</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                    {/* Delivery deadline */}
                    <div onClick={e => e.stopPropagation()}>
                      <input
                        type="date"
                        value={event.deliveryDeadline ? event.deliveryDeadline.split('T')[0] : ''}
                        onChange={e => updateDeadline(event.id, e.target.value)}
                        className="text-xs border border-[#e8e5e0] rounded-lg px-2 py-1.5 text-[#333] focus:outline-none focus:border-[#7c3aed] transition-all"
                        title="Delivery deadline"
                      />
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); router.push(`/admin/crm/${event.id}`) }}
                      className="text-xs text-[#7c3aed] font-medium hover:underline"
                    >
                      View Event
                    </button>
                    <span className="text-[#aaa]">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Expanded tasks */}
                {isExpanded && (
                  <div className="border-t border-[#f5f3ff] px-6 py-4">

                    {/* Payment summary */}
                    <div className="flex items-center justify-between mb-4 bg-[#f5f3ff] rounded-xl px-4 py-3">
                      <div className="flex items-center gap-6 text-sm">
                        <span className="text-[#888]">
                          Total: <span className="font-semibold text-[#0f0f0f]">₹{(event.invoice?.totalAmount || 0).toLocaleString('en-IN')}</span>
                        </span>
                        <span className="text-[#888]">
                          Paid: <span className="font-semibold text-green-600">₹{totalPaid.toLocaleString('en-IN')}</span>
                        </span>
                        <span className="text-[#888]">
                          Balance: <span className="font-semibold text-red-500">₹{balance.toLocaleString('en-IN')}</span>
                        </span>
                      </div>
                      <button
                        onClick={() => router.push('/admin/crm/invoices')}
                        className="text-xs text-[#7c3aed] font-medium hover:underline"
                      >
                        Manage Invoice →
                      </button>
                    </div>

                    {/* Tasks */}
                    <div className="flex flex-col gap-2">
                      {event.postProductionTasks.map(task => (
                        <div key={task.id} className="flex items-center gap-3 py-2 border-b border-[#f5f3ff] last:border-0">

                          {/* Status dot */}
                          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                            task.status === 'COMPLETED'   ? 'bg-green-500' :
                            task.status === 'IN_PROGRESS' ? 'bg-blue-500'  :
                            task.status === 'REVIEW'      ? 'bg-amber-500' : 'bg-gray-300'
                          }`} />

                          {/* Task name */}
                          <p className={`text-sm flex-1 ${task.status === 'COMPLETED' ? 'line-through text-[#aaa]' : 'text-[#0f0f0f]'}`}>
                            {task.taskName}
                          </p>

                          {/* Assignee */}
                          <input
                            type="text"
                            value={task.assigneeName || ''}
                            onChange={e => updateTask(task.id, event.id, { assigneeName: e.target.value })}
                            placeholder="Assignee"
                            className="text-xs border border-[#e8e5e0] rounded-lg px-2 py-1 w-28 focus:outline-none focus:border-[#7c3aed] transition-all"
                          />

                          {/* Due date */}
                          <input
                            type="date"
                            value={task.dueDate ? task.dueDate.split('T')[0] : ''}
                            onChange={e => updateTask(task.id, event.id, { dueDate: e.target.value })}
                            className="text-xs border border-[#e8e5e0] rounded-lg px-2 py-1 focus:outline-none focus:border-[#7c3aed] transition-all"
                          />

                          {/* Status dropdown */}
                          <select
                            value={task.status}
                            onChange={e => updateTask(task.id, event.id, { status: e.target.value })}
                            disabled={savingTask === task.id}
                            className={`text-xs rounded-lg px-2 py-1 border-0 font-semibold focus:outline-none ${TASK_STATUS_STYLES[task.status]}`}
                          >
                            {TASK_STATUSES.map(s => (
                              <option key={s} value={s}>{TASK_STATUS_LABELS[s]}</option>
                            ))}
                          </select>
                        </div>
                      ))}

                      {/* Add custom task */}
                      {addingTask === event.id ? (
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="text"
                            value={newTaskName}
                            onChange={e => setNewTaskName(e.target.value)}
                            placeholder="Task name..."
                            autoFocus
                            onKeyDown={e => { if (e.key === 'Enter') addCustomTask(event.id) }}
                            className="flex-1 text-sm border border-[#7c3aed] rounded-lg px-3 py-1.5 focus:outline-none"
                          />
                          <button onClick={() => addCustomTask(event.id)}
                            className="px-3 py-1.5 bg-[#7c3aed] text-white text-xs font-semibold rounded-lg hover:bg-[#6d28d9] transition-all">
                            Add
                          </button>
                          <button onClick={() => { setAddingTask(null); setNewTaskName('') }}
                            className="px-3 py-1.5 border border-[#e8e5e0] text-xs text-[#666] rounded-lg hover:bg-[#f5f3ff] transition-all">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAddingTask(event.id)}
                          className="mt-2 text-xs text-[#7c3aed] hover:underline text-left"
                        >
                          + Add custom task
                        </button>
                      )}
                    </div>
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