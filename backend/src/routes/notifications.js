const express     = require('express')
const prisma      = require('../lib/prisma')
const requireAuth = require('../middleware/auth')
const { generatePendingNotifications } = require('../lib/notifications')

const router = express.Router()
router.use(requireAuth)

// GET /api/notifications — newest first, plus the unread count for the badge.
// Also does a lazy generation pass scoped to this tenant so a notification
// that's due shows up immediately on open rather than waiting for the next
// background sweep.
router.get('/', async (req, res) => {
  try {
    await generatePendingNotifications(req.adminId)

    const notifications = await prisma.notification.findMany({
      where:   { adminId: req.adminId },
      orderBy: { createdAt: 'desc' },
      take:    50
    })
    const unreadCount = await prisma.notification.count({
      where: { adminId: req.adminId, isRead: false }
    })
    return res.json({ notifications, unreadCount })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Could not load notifications.' })
  }
})

// PUT /api/notifications/:id/read
router.put('/:id/read', async (req, res) => {
  try {
    const notification = await prisma.notification.findFirst({
      where: { id: parseInt(req.params.id), adminId: req.adminId }
    })
    if (!notification) return res.status(404).json({ message: 'Notification not found.' })

    const updated = await prisma.notification.update({
      where: { id: notification.id },
      data:  { isRead: true, readAt: new Date() }
    })
    return res.json(updated)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Could not update notification.' })
  }
})

// PUT /api/notifications/read-all
router.put('/read-all', async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { adminId: req.adminId, isRead: false },
      data:  { isRead: true, readAt: new Date() }
    })
    return res.json({ message: 'All notifications marked as read.' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Could not update notifications.' })
  }
})

module.exports = router
