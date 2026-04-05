const express     = require('express')
const prisma      = require('../lib/prisma')
const requireAuth = require('../middleware/auth')

const router = express.Router()
router.use(requireAuth)

// ── PHOTOGRAPHERS ──────────────────────────────────────

router.get('/photographers', async (req, res) => {
  try {
    const photographers = await prisma.photographer.findMany({
      where:   { adminId: req.adminId },
      orderBy: { name: 'asc' }
    })
    return res.json(photographers)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Could not load photographers.' })
  }
})

router.post('/photographers', async (req, res) => {
  try {
    const { name, phone, email, specialization } = req.body
    if (!name || !phone) return res.status(400).json({ message: 'Name and phone are required.' })
    const photographer = await prisma.photographer.create({
      data: { name, phone, email, specialization, adminId: req.adminId }
    })
    return res.status(201).json(photographer)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Could not add photographer.' })
  }
})

router.put('/photographers/:id', async (req, res) => {
  try {
    const { name, phone, email, specialization, status } = req.body
    const photographer = await prisma.photographer.update({
      where: { id: parseInt(req.params.id) },
      data:  { name, phone, email, specialization, status }
    })
    return res.json(photographer)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Could not update photographer.' })
  }
})

router.delete('/photographers/:id', async (req, res) => {
  try {
    await prisma.photographer.delete({ where: { id: parseInt(req.params.id) } })
    return res.json({ message: 'Photographer deleted.' })
  } catch (err) {
    return res.status(500).json({ message: 'Could not delete photographer.' })
  }
})

// ── ENQUIRIES ─────────────────────────────────────────

router.get('/enquiries', async (req, res) => {
  try {
    const enquiries = await prisma.enquiry.findMany({
      where:   { adminId: req.adminId, status: { not: 'ARCHIVED' } },
      orderBy: { createdAt: 'desc' }
    })
    return res.json(enquiries)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Could not load enquiries.' })
  }
})

router.post('/enquiries', async (req, res) => {
  try {
    const {
      coupleName, phone, startDate, endDate, location,
      expectedGuests, photographerId, packageDetails, estimatedCost,
      leadSource, followUpDays, description
    } = req.body
    if (!coupleName || !phone) return res.status(400).json({ message: 'Couple name and phone are required.' })
    const enquiry = await prisma.enquiry.create({
      data: {
        coupleName, phone, startDate, endDate, location,
        expectedGuests: expectedGuests ? parseInt(expectedGuests) : null,
        photographerId: photographerId ? parseInt(photographerId) : null,
        packageDetails, estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null,
        leadSource, followUpDays: followUpDays ? parseInt(followUpDays) : 3,
        description, adminId: req.adminId
      }
    })
    return res.status(201).json(enquiry)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Could not create enquiry.' })
  }
})

router.put('/enquiries/:id', async (req, res) => {
  try {
    const enquiry = await prisma.enquiry.update({
      where: { id: parseInt(req.params.id) },
      data:  req.body
    })
    return res.json(enquiry)
  } catch (err) {
    return res.status(500).json({ message: 'Could not update enquiry.' })
  }
})

router.delete('/enquiries/:id', async (req, res) => {
  try {
    await prisma.enquiry.delete({ where: { id: parseInt(req.params.id) } })
    return res.json({ message: 'Enquiry deleted.' })
  } catch (err) {
    return res.status(500).json({ message: 'Could not delete enquiry.' })
  }
})

// ── T1: CONFIRM ENQUIRY → CREATE EVENT + INVOICE ──────

router.put('/enquiries/:id/confirm', async (req, res) => {
  try {
    const enquiry = await prisma.enquiry.findFirst({
      where: { id: parseInt(req.params.id), adminId: req.adminId }
    })
    if (!enquiry) return res.status(404).json({ message: 'Enquiry not found.' })
    if (enquiry.status === 'ARCHIVED') return res.status(400).json({ message: 'Enquiry already confirmed.' })

    // Run in a single transaction
    const result = await prisma.$transaction(async (tx) => {

      // 1. Create Event
      const event = await tx.event.create({
        data: {
          coupleName:     enquiry.coupleName,
          startDate:      enquiry.startDate ? new Date(enquiry.startDate) : new Date(),
          endDate:        enquiry.endDate   ? new Date(enquiry.endDate)   : new Date(),
          location:       enquiry.location,
          status:         'ACTIVE',
          sourceEnquiryId: enquiry.id,
          adminId:        req.adminId,
          days: {
            create: (() => {
              if (!enquiry.startDate || !enquiry.endDate) return [{ dayNumber: 1, date: new Date() }]
              const days = []
              const start   = new Date(enquiry.startDate)
              const end     = new Date(enquiry.endDate)
              let current   = new Date(start)
              let dayNumber = 1
              while (current <= end) {
                days.push({ dayNumber, date: new Date(current) })
                current.setDate(current.getDate() + 1)
                dayNumber++
              }
              return days
            })()
          }
        },
        include: { days: true }
      })

      // 2. Create Invoice linked to Event
      const invoice = await tx.invoice.create({
        data: {
          eventId:     event.id,
          packageName: enquiry.packageDetails || null,
          totalAmount: enquiry.estimatedCost  || 0,
          status:      'UNPAID'
        }
      })

      // 3. Archive enquiry
      await tx.enquiry.update({
        where: { id: enquiry.id },
        data:  { status: 'ARCHIVED', convertedEventId: event.id }
      })

      return { event, invoice }
    })

    return res.status(201).json(result)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Could not confirm enquiry.' })
  }
})

// ── EVENTS ────────────────────────────────────────────

// Auto-update event status based on date
async function syncEventStatuses(adminId) {
  const now = new Date()
  // Move ACTIVE events past end date → POST_PRODUCTION
  await prisma.event.updateMany({
    where: { adminId, status: 'ACTIVE', endDate: { lt: now } },
    data:  { status: 'POST_PRODUCTION' }
  })
}

router.get('/events', async (req, res) => {
  try {
    await syncEventStatuses(req.adminId)
    const events = await prisma.event.findMany({
      where:   { adminId: req.adminId, status: 'ACTIVE' },
      orderBy: { startDate: 'asc' },
      include: {
        days: {
          include: { bookings: { include: { photographer: true } } }
        },
        invoice: true
      }
    })
    return res.json(events)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Could not load events.' })
  }
})

router.post('/events', async (req, res) => {
  try {
    const { coupleName, startDate, endDate, location } = req.body
    if (!coupleName || !startDate || !endDate) {
      return res.status(400).json({ message: 'Couple name, start and end date required.' })
    }
    const start = new Date(startDate)
    const end   = new Date(endDate)
    const days  = []
    let current   = new Date(start)
    let dayNumber = 1
    while (current <= end) {
      days.push({ dayNumber, date: new Date(current) })
      current.setDate(current.getDate() + 1)
      dayNumber++
    }
    const event = await prisma.event.create({
      data: {
        coupleName, startDate: start, endDate: end, location,
        status: 'ACTIVE', adminId: req.adminId,
        days: { create: days }
      },
      include: {
        days: { include: { bookings: { include: { photographer: true } } } },
        invoice: true
      }
    })
    return res.status(201).json(event)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Could not create event.' })
  }
})

router.get('/events/:id', async (req, res) => {
  try {
    const event = await prisma.event.findFirst({
      where:   { id: parseInt(req.params.id), adminId: req.adminId },
      include: {
        days: {
          orderBy: { dayNumber: 'asc' },
          include: { bookings: { include: { photographer: true } } }
        },
        invoice: { include: { payments: true } },
        postProductionTasks: { orderBy: { order: 'asc' } }
      }
    })
    if (!event) return res.status(404).json({ message: 'Event not found.' })
    return res.json(event)
  } catch (err) {
    return res.status(500).json({ message: 'Could not load event.' })
  }
})

router.put('/events/:id', async (req, res) => {
  try {
    const { coupleName, startDate, endDate, location, status, deliveryDeadline } = req.body
    const event = await prisma.event.update({
      where: { id: parseInt(req.params.id) },
      data:  {
        ...(coupleName       && { coupleName }),
        ...(startDate        && { startDate: new Date(startDate) }),
        ...(endDate          && { endDate: new Date(endDate) }),
        ...(location         !== undefined && { location }),
        ...(status           && { status }),
        ...(deliveryDeadline !== undefined && { deliveryDeadline: deliveryDeadline ? new Date(deliveryDeadline) : null }),
      }
    })
    return res.json(event)
  } catch (err) {
    return res.status(500).json({ message: 'Could not update event.' })
  }
})

router.delete('/events/:id', async (req, res) => {
  try {
    await prisma.event.delete({ where: { id: parseInt(req.params.id) } })
    return res.json({ message: 'Event deleted.' })
  } catch (err) {
    return res.status(500).json({ message: 'Could not delete event.' })
  }
})

router.post('/events/:id/days', async (req, res) => {
  try {
    const { dayNumber, date } = req.body
    const day = await prisma.eventDay.create({
      data: { eventId: parseInt(req.params.id), dayNumber, date: new Date(date) }
    })
    return res.status(201).json(day)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Could not add day.' })
  }
})

router.put('/events/:id/action', async (req, res) => {
  try {
    const { actionStatus, actionNotes } = req.body
    const event = await prisma.event.update({
      where: { id: parseInt(req.params.id) },
      data:  { actionStatus, actionNotes }
    })
    return res.json(event)
  } catch (err) {
    return res.status(500).json({ message: 'Could not update action.' })
  }
})

// ── BOOKINGS ──────────────────────────────────────────

router.post('/bookings', async (req, res) => {
  try {
    const { eventDayId, slot, eventName, photographerId, location } = req.body
    if (!eventDayId || !slot || !eventName || !photographerId) {
      return res.status(400).json({ message: 'All fields required.' })
    }
    const conflict = await prisma.booking.findFirst({
      where: {
        eventDayId:     parseInt(eventDayId),
        slot,
        photographerId: parseInt(photographerId)
      }
    })
    if (conflict) return res.status(409).json({ message: 'Photographer already booked for this slot.' })
    const booking = await prisma.booking.create({
      data: {
        eventDayId:     parseInt(eventDayId),
        slot, eventName,
        photographerId: parseInt(photographerId),
        location
      },
      include: { photographer: true }
    })
    return res.status(201).json(booking)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Could not create booking.' })
  }
})

router.delete('/bookings/:id', async (req, res) => {
  try {
    await prisma.booking.delete({ where: { id: parseInt(req.params.id) } })
    return res.json({ message: 'Booking cancelled.' })
  } catch (err) {
    return res.status(500).json({ message: 'Could not cancel booking.' })
  }
})

// ── POST PRODUCTION ───────────────────────────────────

const DEFAULT_TASKS = [
  'Culling', 'Basic Editing', 'Retouching',
  'Album Design', 'Client Review', 'Final Delivery'
]

router.get('/post-production', async (req, res) => {
  try {
    await syncEventStatuses(req.adminId)
    const events = await prisma.event.findMany({
      where:   {
        adminId: req.adminId,
        status:  { in: ['POST_PRODUCTION'] }
      },
      orderBy: { endDate: 'desc' },
      include: {
        postProductionTasks: { orderBy: { order: 'asc' } },
        invoice: { include: { payments: true } }
      }
    })
    return res.json(events)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Could not load post production.' })
  }
})

router.get('/post-production/:id/tasks', async (req, res) => {
  try {
    const tasks = await prisma.postProductionTask.findMany({
      where:   { eventId: parseInt(req.params.id) },
      orderBy: { order: 'asc' }
    })
    return res.json(tasks)
  } catch (err) {
    return res.status(500).json({ message: 'Could not load tasks.' })
  }
})

router.post('/post-production/:id/tasks', async (req, res) => {
  try {
    const { taskName, assigneeName, assigneeId, dueDate, status, notes, order } = req.body
    const task = await prisma.postProductionTask.create({
      data: {
        eventId:      parseInt(req.params.id),
        taskName,
        assigneeName: assigneeName || null,
        assigneeId:   assigneeId   ? parseInt(assigneeId) : null,
        dueDate:      dueDate      ? new Date(dueDate)    : null,
        status:       status       || 'NOT_STARTED',
        notes:        notes        || null,
        order:        order        || 0
      }
    })
    return res.status(201).json(task)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Could not create task.' })
  }
})

// Seed default tasks for an event
router.post('/post-production/:id/seed-tasks', async (req, res) => {
  try {
    const eventId = parseInt(req.params.id)
    const existing = await prisma.postProductionTask.findMany({ where: { eventId } })
    if (existing.length > 0) return res.json(existing)
    const tasks = await prisma.postProductionTask.createMany({
      data: DEFAULT_TASKS.map((taskName, i) => ({
        eventId, taskName, order: i, status: 'NOT_STARTED'
      }))
    })
    const created = await prisma.postProductionTask.findMany({
      where: { eventId }, orderBy: { order: 'asc' }
    })
    return res.status(201).json(created)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Could not seed tasks.' })
  }
})

router.put('/post-production/tasks/:id', async (req, res) => {
  try {
    const { taskName, assigneeName, assigneeId, dueDate, status, notes } = req.body
    const task = await prisma.postProductionTask.update({
      where: { id: parseInt(req.params.id) },
      data:  {
        ...(taskName      && { taskName }),
        ...(assigneeName  !== undefined && { assigneeName }),
        ...(assigneeId    !== undefined && { assigneeId: assigneeId ? parseInt(assigneeId) : null }),
        ...(dueDate       !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(status        && { status }),
        ...(notes         !== undefined && { notes })
      }
    })

    // Check if all tasks completed → check invoice → maybe mark event COMPLETED
    const allTasks = await prisma.postProductionTask.findMany({
      where: { eventId: task.eventId }
    })
    const allTasksDone = allTasks.every(t => t.status === 'COMPLETED')
    if (allTasksDone) {
      const invoice = await prisma.invoice.findUnique({ where: { eventId: task.eventId } })
      if (invoice && invoice.status === 'PAID') {
        await prisma.event.update({
          where: { id: task.eventId },
          data:  { status: 'COMPLETED', completionDate: new Date() }
        })
      }
    }

    return res.json(task)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Could not update task.' })
  }
})

router.delete('/post-production/tasks/:id', async (req, res) => {
  try {
    await prisma.postProductionTask.delete({ where: { id: parseInt(req.params.id) } })
    return res.json({ message: 'Task deleted.' })
  } catch (err) {
    return res.status(500).json({ message: 'Could not delete task.' })
  }
})

// ── INVOICES ──────────────────────────────────────────

router.get('/invoices', async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { event: { adminId: req.adminId } },
      orderBy: { createdAt: 'desc' },
      include: {
        payments: true,
        event:    { select: { id: true, coupleName: true, startDate: true, endDate: true, status: true } }
      }
    })
    return res.json(invoices)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Could not load invoices.' })
  }
})

router.get('/invoices/:eventId', async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where:   { eventId: parseInt(req.params.eventId) },
      include: {
        payments: { orderBy: { paidOn: 'asc' } },
        event:    { select: { id: true, coupleName: true, startDate: true, endDate: true } }
      }
    })
    if (!invoice) return res.status(404).json({ message: 'Invoice not found.' })
    return res.json(invoice)
  } catch (err) {
    return res.status(500).json({ message: 'Could not load invoice.' })
  }
})

router.put('/invoices/:id', async (req, res) => {
  try {
    const { packageName, totalAmount, notes } = req.body
    const invoice = await prisma.invoice.update({
      where: { id: parseInt(req.params.id) },
      data:  {
        ...(packageName  !== undefined && { packageName }),
        ...(totalAmount  !== undefined && { totalAmount: parseFloat(totalAmount) }),
        ...(notes        !== undefined && { notes })
      },
      include: { payments: true }
    })
    return res.json(invoice)
  } catch (err) {
    return res.status(500).json({ message: 'Could not update invoice.' })
  }
})

router.post('/invoices/:id/payments', async (req, res) => {
  try {
    const { amount, paidOn, method, notes } = req.body
    if (!amount) return res.status(400).json({ message: 'Amount is required.' })

    const payment = await prisma.payment.create({
      data: {
        invoiceId: parseInt(req.params.id),
        amount:    parseFloat(amount),
        paidOn:    paidOn ? new Date(paidOn) : new Date(),
        method:    method || 'CASH',
        notes:     notes  || null
      }
    })

    // Recalculate invoice status
    const invoice = await prisma.invoice.findUnique({
      where:   { id: parseInt(req.params.id) },
      include: { payments: true }
    })
    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0)
    let newStatus = 'UNPAID'
    if (totalPaid >= invoice.totalAmount) newStatus = 'PAID'
    else if (totalPaid > 0)               newStatus = 'PARTIAL'

    const updatedInvoice = await prisma.invoice.update({
      where:   { id: parseInt(req.params.id) },
      data:    { status: newStatus },
      include: { payments: true }
    })

    // If PAID → check if all tasks done → maybe complete event
    if (newStatus === 'PAID') {
      const allTasks = await prisma.postProductionTask.findMany({
        where: { eventId: updatedInvoice.eventId }
      })
      const allTasksDone = allTasks.length === 0 || allTasks.every(t => t.status === 'COMPLETED')
      if (allTasksDone) {
        await prisma.event.update({
          where: { id: updatedInvoice.eventId },
          data:  { status: 'COMPLETED', completionDate: new Date() }
        })
      }
    }

    return res.status(201).json({ payment, invoice: updatedInvoice })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Could not add payment.' })
  }
})

router.delete('/payments/:id', async (req, res) => {
  try {
    const payment = await prisma.payment.delete({ where: { id: parseInt(req.params.id) } })
    // Recalculate invoice status after deletion
    const invoice = await prisma.invoice.findUnique({
      where:   { id: payment.invoiceId },
      include: { payments: true }
    })
    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0)
    let newStatus = 'UNPAID'
    if (totalPaid >= invoice.totalAmount && invoice.totalAmount > 0) newStatus = 'PAID'
    else if (totalPaid > 0) newStatus = 'PARTIAL'
    await prisma.invoice.update({
      where: { id: payment.invoiceId },
      data:  { status: newStatus }
    })
    return res.json({ message: 'Payment deleted.' })
  } catch (err) {
    return res.status(500).json({ message: 'Could not delete payment.' })
  }
})

// ── COMPLETED EVENTS ──────────────────────────────────

router.get('/completed', async (req, res) => {
  try {
    const { filter, year, month, quarter } = req.query
    const now = new Date()
    let dateFilter = {}

    if (filter === 'this-month') {
      dateFilter = {
        completionDate: {
          gte: new Date(now.getFullYear(), now.getMonth(), 1),
          lt:  new Date(now.getFullYear(), now.getMonth() + 1, 1)
        }
      }
    } else if (filter === 'month' && year && month) {
      dateFilter = {
        completionDate: {
          gte: new Date(parseInt(year), parseInt(month) - 1, 1),
          lt:  new Date(parseInt(year), parseInt(month), 1)
        }
      }
    } else if (filter === 'quarter' && year && quarter) {
      const q     = parseInt(quarter)
      const start = (q - 1) * 3
      dateFilter  = {
        completionDate: {
          gte: new Date(parseInt(year), start, 1),
          lt:  new Date(parseInt(year), start + 3, 1)
        }
      }
    } else if (filter === 'year' && year) {
      dateFilter = {
        completionDate: {
          gte: new Date(parseInt(year), 0, 1),
          lt:  new Date(parseInt(year) + 1, 0, 1)
        }
      }
    }

    const events = await prisma.event.findMany({
      where:   { adminId: req.adminId, status: 'COMPLETED', ...dateFilter },
      orderBy: { completionDate: 'desc' },
      include: {
        invoice: { include: { payments: true } },
        postProductionTasks: true
      }
    })
    return res.json(events)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Could not load completed events.' })
  }
})

// ── CALENDAR (for calendar page) ─────────────────────

router.get('/calendar-events', async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where:   { adminId: req.adminId },
      orderBy: { startDate: 'asc' },
      include: {
        days: {
          include: { bookings: { include: { photographer: true } } }
        }
      }
    })
    return res.json(events)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Could not load events.' })
  }
})

module.exports = router