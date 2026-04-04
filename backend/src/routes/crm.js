const express     = require('express')
const prisma      = require('../lib/prisma')
const requireAuth = require('../middleware/auth')

const router = express.Router()
router.use(requireAuth)

// ── PHOTOGRAPHERS ──────────────────────────────────────

// GET /api/crm/photographers
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

// POST /api/crm/photographers
router.post('/photographers', async (req, res) => {
  try {
    const { name, phone, specialization } = req.body
    if (!name || !phone) {
      return res.status(400).json({ message: 'Name and phone are required.' })
    }
    const photographer = await prisma.photographer.create({
      data: { name, phone, specialization, adminId: req.adminId }
    })
    return res.status(201).json(photographer)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Could not add photographer.' })
  }
})

// DELETE /api/crm/photographers/:id
router.delete('/photographers/:id', async (req, res) => {
  try {
    await prisma.photographer.delete({
      where: { id: parseInt(req.params.id) }
    })
    return res.json({ message: 'Photographer deleted.' })
  } catch (err) {
    return res.status(500).json({ message: 'Could not delete photographer.' })
  }
})
// PUT /api/crm/photographers/:id — update photographer
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
// ── ENQUIRIES ─────────────────────────────────────────

// GET /api/crm/enquiries
router.get('/enquiries', async (req, res) => {
  try {
    const enquiries = await prisma.enquiry.findMany({
      where:   { adminId: req.adminId },
      orderBy: { createdAt: 'desc' }
    })
    return res.json(enquiries)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Could not load enquiries.' })
  }
})

// POST /api/crm/enquiries
router.post('/enquiries', async (req, res) => {
  try {
    const { coupleName, phone, startDate, endDate, location, expectedGuests, photographerId, leadSource, followUpDays, description } = req.body
    if (!coupleName || !phone) {
      return res.status(400).json({ message: 'Couple name and phone are required.' })
    }
    const enquiry = await prisma.enquiry.create({
      data: {
        coupleName,
        phone,
        startDate,
        endDate,
        location,
        expectedGuests: expectedGuests ? parseInt(expectedGuests) : null,
        photographerId: photographerId ? parseInt(photographerId) : null,
        leadSource,
        followUpDays:   followUpDays ? parseInt(followUpDays) : 3,
        description,
        adminId: req.adminId
      }
    })
    return res.status(201).json(enquiry)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Could not create enquiry.' })
  }
})

// PUT /api/crm/enquiries/:id — update status
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

// DELETE /api/crm/enquiries/:id
router.delete('/enquiries/:id', async (req, res) => {
  try {
    await prisma.enquiry.delete({ where: { id: parseInt(req.params.id) } })
    return res.json({ message: 'Enquiry deleted.' })
  } catch (err) {
    return res.status(500).json({ message: 'Could not delete enquiry.' })
  }
})

// ── EVENTS ──────────────────────────────────────────────

// GET /api/crm/events
router.get('/events', async (req, res) => {
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

// POST /api/crm/events
router.post('/events', async (req, res) => {
  try {
    const { coupleName, startDate, endDate, location } = req.body
    if (!coupleName || !startDate || !endDate) {
      return res.status(400).json({ message: 'Couple name, start and end date required.' })
    }

    const start = new Date(startDate)
    const end   = new Date(endDate)

    // Auto-generate days
    const days = []
    let current = new Date(start)
    let dayNumber = 1
    while (current <= end) {
      days.push({ dayNumber, date: new Date(current) })
      current.setDate(current.getDate() + 1)
      dayNumber++
    }

    const event = await prisma.event.create({
      data: {
        coupleName,
        startDate: start,
        endDate:   end,
        location,
        adminId:   req.adminId,
        days: { create: days }
      },
      include: {
        days: {
          include: { bookings: { include: { photographer: true } } }
        }
      }
    })

    return res.status(201).json(event)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Could not create event.' })
  }
})

// GET /api/crm/events/:id
router.get('/events/:id', async (req, res) => {
  try {
    const event = await prisma.event.findFirst({
      where:   { id: parseInt(req.params.id), adminId: req.adminId },
      include: {
        days: {
          orderBy: { dayNumber: 'asc' },
          include: {
            bookings: {
              include: { photographer: true }
            }
          }
        }
      }
    })
    if (!event) return res.status(404).json({ message: 'Event not found.' })
    return res.json(event)
  } catch (err) {
    return res.status(500).json({ message: 'Could not load event.' })
  }
})
// POST /api/crm/events/:id/days — add extra day
router.post('/events/:id/days', async (req, res) => {
  try {
    const { dayNumber, date } = req.body
    const day = await prisma.eventDay.create({
      data: {
        eventId:   parseInt(req.params.id),
        dayNumber,
        date:      new Date(date)
      }
    })
    return res.status(201).json(day)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Could not add day.' })
  }
})
// PUT /api/crm/events/:id — update status and notes
router.put('/events/:id', async (req, res) => {
  try {
    const { status, notes } = req.body
    const event = await prisma.event.update({
      where: { id: parseInt(req.params.id) },
      data:  { status, notes }
    })
    return res.json(event)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Could not update event.' })
  }
})

// DELETE /api/crm/events/:id
router.delete('/events/:id', async (req, res) => {
  try {
    await prisma.event.delete({
      where: { id: parseInt(req.params.id) }
    })
    return res.json({ message: 'Event deleted.' })
  } catch (err) {
    return res.status(500).json({ message: 'Could not delete event.' })
  }
})

// ── BOOKINGS ─────────────────────────────────────────────

// POST /api/crm/bookings
router.post('/bookings', async (req, res) => {
  try {
    const { eventDayId, slot, eventName, photographerId, location } = req.body

    if (!eventDayId || !slot || !eventName || !photographerId) {
      return res.status(400).json({ message: 'All fields required.' })
    }

    // Check for conflict
    const conflict = await prisma.booking.findFirst({
      where: {
        eventDayId: parseInt(eventDayId),
        slot,
        photographerId: parseInt(photographerId)
      }
    })
    if (conflict) {
      return res.status(409).json({ message: 'Photographer already booked for this slot.' })
    }

    const booking = await prisma.booking.create({
      data: {
        eventDayId:     parseInt(eventDayId),
        slot,
        eventName,
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

// DELETE /api/crm/bookings/:id
router.delete('/bookings/:id', async (req, res) => {
  try {
    await prisma.booking.delete({ where: { id: parseInt(req.params.id) } })
    return res.json({ message: 'Booking cancelled.' })
  } catch (err) {
    return res.status(500).json({ message: 'Could not cancel booking.' })
  }
})



module.exports = router